import {
  GeneratedStory,
  GeneratedStoryChoice,
  GeneratedStorySlide,
} from "@/lib/generatedStoryStorage";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const BLUEPRINT_MODEL = import.meta.env.VITE_GROQ_MODEL_BLUEPRINT || "llama-3.3-70b-versatile";
const STORY_MODEL =
  import.meta.env.VITE_GROQ_MODEL_STORY === "llama-3.1-70b-versatile"
    ? "llama-3.3-70b-versatile"
    : import.meta.env.VITE_GROQ_MODEL_STORY || "llama-3.3-70b-versatile";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const IMAGEN_MODEL = "imagen-3.0-generate-001";
const IMAGEN_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages";

// POCSO-compliant prompting
const SAFE_IMAGE_STYLE_SUFFIX =
  "Children's storybook illustration, soft watercolor style, warm colors, innocent, safe educational tone, comforting, reassuring. No scary elements, no violence, no nudity, non-threatening.";

const POCSO_NEGATIVE_PROMPTS =
  "no photorealistic children, no explicit content, no nudity, no graphic violence, no scary or distressful imagery, no blood, no horror elements, no unsupervised strangers in threatening poses, no abuse imagery, no dark or disturbing content";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tryParseJson = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

export interface CharacterInput {
  name: string;
  description: string;
}

export interface StoryGenerationInput {
  topic: string;
  ageGroup: string;
  language: string;
  characterCount: number;
  characters?: CharacterInput[];
  regionContext: string;
  description: string;
  moralLesson?: string;
}

export type GenerationStage =
  | "initializing"
  | "blueprint-request"
  | "blueprint-ready"
  | "storytree-request"
  | "storytree-ready"
  | "images-start"
  | "image-progress"
  | "images-ready"
  | "completed";

export interface GenerationProgressEvent {
  stage: GenerationStage;
  message: string;
  current?: number;
  total?: number;
}

export interface StoryGenerationOptions {
  onProgress?: (event: GenerationProgressEvent) => void;
}

interface StoryBlueprint {
  title: string;
  summary: string;
  setting: string;
  moralLesson?: string;
  characters: Array<{
    name: string;
    role: string;
    traits: string[];
  }>;
}

interface StoryTreeResponse {
  title: string;
  slides: Array<{
    id: number;
    text: string;
    imagePrompt: string;
    choices?: Array<{
      label: string;
      nextSlide: number;
      isCorrect: boolean;
    }>;
  }>;
}

const parseJsonFromModel = <T>(content: string): T => {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonCandidate = fencedMatch ? fencedMatch[1] : trimmed;

  const direct = tryParseJson<T>(jsonCandidate);
  if (direct) return direct;

  const start = jsonCandidate.indexOf("{");
  const end = jsonCandidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = jsonCandidate.slice(start, end + 1);
    const repaired = slice.replace(/,\s*([}\]])/g, "$1");
    const parsed = tryParseJson<T>(repaired);
    if (parsed) return parsed;
  }

  throw new Error("Unable to parse JSON from model response.");
};

const chatCompletion = async ({
  model,
  system,
  user,
}: {
  model: string;
  system: string;
  user: string;
}) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing VITE_GROQ_API_KEY. Add it to your .env file.");
  }
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_completion_tokens: 3500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unknown Groq API error";

      try {
        const errorPayload = await response.json();
        errorMessage =
          errorPayload?.error?.message ||
          errorPayload?.message ||
          JSON.stringify(errorPayload);
      } catch {
        errorMessage = await response.text();
      }

      const isRetriable = [408, 429, 500, 502, 503, 504].includes(response.status);
      const isContextError =
        response.status === 400 &&
        /context|maximum context|token/i.test(errorMessage);

      if (isContextError) {
        throw new Error(
          `Groq request too large. ${errorMessage}. Try reducing story description length or character details.`,
        );
      }

      if (isRetriable && attempt < maxAttempts) {
        const backoff = 600 * attempt;
        console.warn(
          `[SafeStory][Generation] Groq retry ${attempt}/${maxAttempts} after ${response.status}: ${errorMessage}`,
        );
        await sleep(backoff);
        continue;
      }

      if (response.status === 400) {
        throw new Error(
          `Groq request rejected (400). ${errorMessage}. Check model names and input size in your .env settings.`,
        );
      }

      throw new Error(`Groq API error (${response.status}): ${errorMessage}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Groq API returned an empty response.");
    }

    return content;
  }

  throw new Error("Groq API failed after retries.");
};

const normalizeChoices = (choices?: StoryTreeResponse["slides"][number]["choices"]): GeneratedStoryChoice[] | undefined => {
  if (!choices || choices.length === 0) return undefined;

  return choices.slice(0, 2).map((choice) => ({
    label: choice.label?.trim() || "Continue",
    nextSlide: String(Number.isFinite(choice.nextSlide) ? choice.nextSlide : 1),
    isCorrect: !!choice.isCorrect,
  }));
};

const ensureSafeImagePrompt = (prompt?: string) => {
  const cleaned = prompt?.trim();
  if (!cleaned) return cleaned;
  const lower = cleaned.toLowerCase();
  if (lower.includes("children's book illustration") || lower.includes("safe educational tone")) {
    return cleaned;
  }
  return `${cleaned}. ${SAFE_IMAGE_STYLE_SUFFIX}`;
};

const normalizeSlides = (slides: StoryTreeResponse["slides"]): GeneratedStorySlide[] => {
  const cleaned = slides
    .map((slide, index) => ({
      originalId: Number.isFinite(slide.id) ? slide.id : index + 1,
      text: slide.text?.trim(),
      imagePrompt: ensureSafeImagePrompt(slide.imagePrompt),
      choices: normalizeChoices(slide.choices),
    }))
    .filter((slide) => slide.text && slide.imagePrompt);

  if (cleaned.length < 7) {
    throw new Error("Model returned fewer than 7 slides. Please try generating again.");
  }

  const limited = cleaned.slice(0, 10);
  const idMap = new Map<number, string>();

  limited.forEach((slide, index) => {
    idMap.set(slide.originalId, String(index + 1));
  });

  const normalized = limited.map((slide, index) => ({
    id: String(index + 1),
    slideNumber: index + 1,
    text: slide.text,
    imagePrompt: slide.imagePrompt,
    choices: slide.choices,
    createdAt: new Date().toISOString(),
  }));

  const totalSlides = normalized.length;
  let decisionSlideUsed = false;

  return normalized.map((slide, index) => {
    if (!slide.choices || slide.choices.length === 0) {
      return slide;
    }

    if (decisionSlideUsed) {
      return {
        ...slide,
        choices: undefined,
      };
    }

    decisionSlideUsed = true;

    const safeFallback = String(Math.min(index + 2, totalSlides));
    const unsafeFallback = String(Math.min(index + 3, totalSlides));

    const resolveTarget = (target: string, fallback: string) => {
      const mappedTarget = idMap.get(Number(target));
      if (mappedTarget && mappedTarget !== slide.id) {
        return mappedTarget;
      }
      const fallbackIndex = Number(fallback);
      if (fallbackIndex >= 1 && fallbackIndex <= totalSlides && fallback !== slide.id) {
        return fallback;
      }
      const nextIndex = Math.min(index + 2, totalSlides);
      return String(nextIndex === Number(slide.id) ? totalSlides : nextIndex);
    };

    const repaired = slide.choices.slice(0, 2).map((choice, choiceIndex) => {
      const fallbackTarget = choice.isCorrect ? safeFallback : unsafeFallback;
      const resolvedTarget = resolveTarget(choice.nextSlide, fallbackTarget);

      const defaultLabel = choice.isCorrect
        ? "Ask for help from a trusted adult"
        : "Go with the person";

      return {
        label: choice.label?.trim() || defaultLabel,
        nextSlide: resolvedTarget,
        isCorrect: typeof choice.isCorrect === "boolean" ? choice.isCorrect : choiceIndex === 0,
      };
    });

    if (repaired.length === 1) {
      repaired.push({
        label: "Try the other option",
        nextSlide: unsafeFallback,
        isCorrect: false,
      });
    }

    if (repaired.length === 2 && repaired[0].isCorrect === repaired[1].isCorrect) {
      repaired[1] = {
        ...repaired[1],
        isCorrect: !repaired[0].isCorrect,
      };
    }

    return {
      ...slide,
      choices: repaired,
    };
  });
};

export const generateSlideImageWithPuter = async (prompt: string): Promise<string | undefined> => {
  try {
    if (!GEMINI_API_KEY) {
      console.warn("[SafeStory] Gemini API key missing; generating SVG placeholder instead.");
      return generateSvgPlaceholder(prompt);
    }

    // Construct POCSO-compliant prompt
    const fullPrompt = `${prompt}. ${SAFE_IMAGE_STYLE_SUFFIX}`;
    
    console.info(`[SafeStory][Image] Attempting to generate image for: "${prompt.substring(0, 50)}..."`);

    // Try Imagen 3 API first
    try {
      const imagenResponse = await fetch(`${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: fullPrompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "4:3",
            negativePrompt: POCSO_NEGATIVE_PROMPTS,
          },
        }),
      });

      if (imagenResponse.ok) {
        const data = await imagenResponse.json();
        console.info("[SafeStory][Image] Imagen API response:", data);
        
        // Try multiple possible response paths
        const imageData = data?.predictions?.[0]?.bytesBase64Encoded || 
                          data?.predictions?.[0]?.image?.data ||
                          data?.predictions?.[0]?.imageData ||
                          data?.predictions?.[0]?.imageUri;

        if (imageData) {
          console.info("[SafeStory][Image] Successfully generated image via Imagen API");
          // Handle both base64 and URI formats
          if (imageData.startsWith('data:') || imageData.startsWith('http')) {
            return imageData;
          }
          return `data:image/jpeg;base64,${imageData}`;
        }
      } else {
        const errorText = await imagenResponse.text();
        console.warn(`[SafeStory][Image] Imagen API error (${imagenResponse.status}):`, errorText);
      }
    } catch (imagenError) {
      console.warn("[SafeStory][Image] Imagen API call failed:", imagenError);
    }

    // Fallback: Use Gemini Vision (text-to-image via prompt description)
    console.info("[SafeStory][Image] Falling back to Gemini API for image generation...");
    
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a children's storybook illustration for: ${fullPrompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        
        // Try to extract image from Gemini response
        const imageContent = geminiData?.candidates?.[0]?.content?.parts?.find(
          (part: any) => part.inlineData || part.inline_data
        );

        if (imageContent?.inlineData?.data) {
          console.info("[SafeStory][Image] Generated image via Gemini API");
          return `data:image/jpeg;base64,${imageContent.inlineData.data}`;
        } else if (imageContent?.inline_data?.data) {
          console.info("[SafeStory][Image] Generated image via Gemini API");
          return `data:image/jpeg;base64,${imageContent.inline_data.data}`;
        }
      }
    } catch (geminiError) {
      console.warn("[SafeStory][Image] Gemini API fallback failed:", geminiError);
    }

    // Fallback: Generate SVG placeholder (ensures UI doesn't break)
    console.warn("[SafeStory][Image] All image APIs unavailable. Using SVG placeholder.");
    const svgPlaceholder = generateSvgPlaceholder(prompt);
    return svgPlaceholder;

  } catch (error) {
    console.error("[SafeStory][Image] Unexpected error during image generation:", error);
    // Return SVG placeholder on any error
    try {
      return generateSvgPlaceholder(prompt);
    } catch (svgError) {
      console.error("[SafeStory][Image] SVG placeholder generation also failed:", svgError);
      return undefined;
    }
  }
};

/**
 * Generates a simple SVG placeholder when API image generation fails
 * This ensures the UI always has something to display
 * Uses URI encoding instead of base64 to handle Unicode characters properly
 */
const generateSvgPlaceholder = (prompt: string): string => {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Sanitize prompt text to remove potentially problematic characters
  const sanitizedPrompt = prompt
    .substring(0, 40)
    .replace(/[<>"]/g, '') // Remove XML special chars
    .trim();
  
  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${randomColor};stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#6C5CE7;stop-opacity:0.3" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#grad)"/>
    <circle cx="400" cy="300" r="100" fill="${randomColor}" opacity="0.5"/>
    <text x="400" y="300" font-size="20" text-anchor="middle" fill="#333" font-family="sans-serif" font-weight="bold">
      Generated
    </text>
    <text x="400" y="330" font-size="14" text-anchor="middle" fill="#666" font-family="sans-serif">
      Image Loading...
    </text>
  </svg>`;
  
  // Use encodeURIComponent for proper Unicode handling
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const generateBlueprint = async (input: StoryGenerationInput): Promise<StoryBlueprint> => {
  const system =
    "You are a precise JSON generator for child-safe educational story planning under strict POCSO-aligned safeguards. Output valid JSON only. Never include markdown, commentary, or extra text. Forbid explicit sexual content, nudity, indecent imagery, graphic violence, or horror framing. Use trauma-informed, positive, age-appropriate language focused on feelings and safe actions.";

  const characterDetails = input.characters && input.characters.length > 0
    ? `\nCharacter specifications (use these exact details):\n${input.characters.map((c, i) => `${i + 1}. Name: ${c.name}, Description: ${c.description}`).join("\n")}`
    : "";

  const user = `Create a story blueprint JSON for the following NGO request.
Requirements:
- Language: ${input.language}
- Topic: ${input.topic}
- Age group: ${input.ageGroup}
- Region/cultural context: ${input.regionContext}
- Character count: exactly ${input.characterCount}
- Description: ${input.description}
- Moral lesson: ${input.moralLesson || "Not provided"}${characterDetails}

Return JSON with exactly this shape:
{
  "title": string,
  "summary": string,
  "setting": string,
  "moralLesson": string,
  "characters": [
    {"name": string, "role": string, "traits": string[]}
  ]
}
Ensure characters array length is exactly ${input.characterCount}.`;

  const content = await chatCompletion({ model: BLUEPRINT_MODEL, system, user });
  const parsed = parseJsonFromModel<StoryBlueprint>(content);

  if (!parsed?.title || !Array.isArray(parsed.characters)) {
    throw new Error("Invalid blueprint format from model.");
  }

  if (parsed.characters.length !== input.characterCount) {
    throw new Error("Blueprint character count does not match requested value.");
  }

  return parsed;
};

const generateStoryTree = async (
  input: StoryGenerationInput,
  blueprint: StoryBlueprint,
): Promise<GeneratedStorySlide[]> => {
  const system =
    "You are a storytelling engine for child safety education under strict POCSO-aligned constraints. Output valid JSON only with no markdown, no explanations, and no extra text. Never include explicit sexual content, nudity, indecent images, body-part explicitness, graphic violence, or horror elements. Use trauma-informed positive framing and age-appropriate language focused on feelings and protective actions (example tone: 'this feels wrong' and 'go to a trusted adult'). Keep the overall tone reassuring and empowering.";

  const user = `Using this blueprint JSON:\n${JSON.stringify(blueprint, null, 2)}\n\nGenerate a branching story JSON in ${input.language}.
STRICT LEGAL + SAFETY RULES (MANDATORY):
- Must be POCSO-safe and child-protective.
- Absolutely no explicit sexual content, nudity, indecent imagery, or graphic violence.
- No horror tone, no threats, no frightening visual narration.
- Use trauma-informed, positive framing.
- Use highly age-appropriate wording for ${input.ageGroup}, centered on feelings and safe actions.

PEDAGOGICAL STRUCTURE (MANDATORY):
- Story length must be 7 to 10 slides total.
- Setup slides first: introduce child character, trusted context, and normal safe environment.
- Include exactly ONE Decision Slide in the whole story with exactly 2 choices:
  1) one Safe choice (isCorrect: true)
  2) one Unsafe choice (isCorrect: false)
- Choice button labels must be neutral and natural. Do NOT reveal which choice is right or wrong in the button label.
- Safe branch must go to a slide that praises the child, reinforces the safety rule, and ends with a happy reassuring conclusion.
- Unsafe branch must go to a slide that gently corrects the action immediately, shows a trusted adult stepping in right away, and ends with comfort and safety.

JSON + POINTER RULES (MANDATORY):
- Every slide must contain integer id, text, imagePrompt.
- id values must be unique integers and match slide order in the array.
- Every nextSlide must be an integer that exactly matches an existing slide id in this same array.
- Do not output missing references, invalid ids, strings, or null ids.
- Decision slide must contain exactly 2 choices; non-decision slides should omit choices.

Return JSON shape:
{
  "title": string,
  "slides": [
    {
      "id": number,
      "text": string,
      "imagePrompt": string,
      "choices": [
        {"label": string, "nextSlide": number, "isCorrect": boolean}
      ]
    }
  ]
}
Only include choices when a decision point exists.`;

  const content = await chatCompletion({ model: STORY_MODEL, system, user });
  const parsed = parseJsonFromModel<StoryTreeResponse>(content);

  if (!parsed?.slides || !Array.isArray(parsed.slides)) {
    throw new Error("Invalid story tree format from model.");
  }

  return normalizeSlides(parsed.slides);
};

export const generateStoryWithGroqAndPuterWithProgress = async (
  input: StoryGenerationInput,
  options: StoryGenerationOptions = {},
): Promise<GeneratedStory> => {
  const onProgress = options.onProgress ?? (() => undefined);

  const report = (event: GenerationProgressEvent) => {
    console.info(`[SafeStory][Generation] ${event.message}`, event);
    onProgress(event);
  };

  report({
    stage: "initializing",
    message: "Starting story generation pipeline...",
  });

  report({
    stage: "blueprint-request",
    message: `Sending NGO inputs to ${BLUEPRINT_MODEL} for story blueprint...`,
  });

  const blueprint = await generateBlueprint(input);
  report({
    stage: "blueprint-ready",
    message: `Blueprint ready with ${blueprint.characters.length} characters.`,
  });

  report({
    stage: "storytree-request",
    message: `Generating branching story JSON with ${STORY_MODEL}...`,
  });

  const slides = await generateStoryTree(input, blueprint);
  report({
    stage: "storytree-ready",
    message: `Story structure ready with ${slides.length} slides. Images will be generated in background.`,
    total: slides.length,
  });

  // Return story immediately with placeholder imageUrls (no images yet)
  const now = new Date().toISOString();
  const generatedStory: GeneratedStory = {
    id: `story-${Date.now()}`,
    title: blueprint.title,
    topic: input.topic,
    ageGroup: input.ageGroup,
    language: input.language,
    moralLesson: blueprint.moralLesson || input.moralLesson,
    characters: blueprint.characters,
    slides: slides.map((slide) => ({
      ...slide,
      imageUrl: undefined, // Placeholder - will be filled in background
    })),
    totalSlides: slides.length,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    metadata: {
      region: input.regionContext,
      description: input.description,
      imageStyle: "imagen-3.0-generate-001",
      generationModel: "llama-3.3-70b-versatile",
      imagingStartedAt: null,
      imagingCompletedAt: null,
    },
  };

  report({
    stage: "completed",
    message: "Story text generation completed. Images will be generated in background.",
    total: slides.length,
  });

  return generatedStory;
};

/**
 * Background function to generate and update images for a story asynchronously.
 * This function runs without blocking the main UI thread.
 * Processes images in parallel with rate limit handling (30-second delay between batches).
 */
export const generateImagesForStoryInBackground = async (
  storyId: string,
  slides: GeneratedStorySlide[],
  userId: string,
  onProgress?: (event: Partial<GenerationProgressEvent>) => void
): Promise<void> => {
  try {
    const report = (event: Partial<GenerationProgressEvent>) => {
      console.info(`[SafeStory][Background Imaging] ${event.message}`, event);
      onProgress?.(event);
    };

    report({
      stage: "images-start",
      message: "Starting background image generation...",
      total: slides.length,
    });

    // Import updateStoryData at runtime to avoid circular dependency
    const { updateStoryData, getStoryById } = await import("@/lib/supabaseStoryService");

    // Process images in batches to respect rate limits (2-15 requests/min = need ~30s between batches)
    const batchSize = 3; // Conservative batch size for free tier
    const batchDelayMs = 30000; // 30 seconds between batches

    for (let i = 0; i < slides.length; i += batchSize) {
      const batch = slides.slice(i, Math.min(i + batchSize, slides.length));
      
      // Generate images in parallel within this batch
      const results = await Promise.allSettled(
        batch.map((slide) => generateSlideImageWithPuter(slide.imagePrompt))
      );

      // Update each slide with its generated image
      let batchUpdated = false;
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const slideIndex = i + j;
        
        if (result.status === "fulfilled") {
          const imageValue = result.value;
          
          if (imageValue) {
            slides[slideIndex].imageUrl = imageValue;
            batchUpdated = true;
            console.info(`[SafeStory][Background Imaging] Successfully set image for slide ${slideIndex + 1}:`, imageValue.substring(0, 50) + "...");
            report({
              stage: "image-progress",
              message: `Generated image ${slideIndex + 1}/${slides.length}`,
              current: slideIndex + 1,
              total: slides.length,
            });
          } else {
            console.warn(`[SafeStory][Background Imaging] Image generation returned undefined for slide ${slideIndex + 1}`);
            report({
              stage: "image-progress",
              message: `Failed image ${slideIndex + 1}/${slides.length} (returned undefined)`,
              current: slideIndex + 1,
              total: slides.length,
            });
          }
        } else {
          console.error(`[SafeStory][Background Imaging] Promise rejected for slide ${slideIndex + 1}:`, result.reason);
          report({
            stage: "image-progress",
            message: `Error generating image ${slideIndex + 1}/${slides.length}`,
            current: slideIndex + 1,
            total: slides.length,
          });
        }
      }

      // Save batch to Supabase if we generated any images in this batch
      if (batchUpdated) {
        try {
          const storedStory = await getStoryById(storyId);
          const updatedStory: GeneratedStory = {
            ...storedStory.story_data,
            slides: slides,
            metadata: {
              ...storedStory.story_data.metadata,
              imagingStartedAt: storedStory.story_data.metadata?.imagingStartedAt || new Date().toISOString(),
              imagingCompletedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };

          await updateStoryData(storyId, updatedStory);
          console.info(`[SafeStory][Background Imaging] Saved batch ${Math.floor(i / batchSize) + 1} to Supabase`);
        } catch (saveError) {
          console.error(`[SafeStory][Background Imaging] Failed to save batch to Supabase:`, saveError);
          report({
            message: `Failed to save images to database: ${saveError instanceof Error ? saveError.message : "Unknown error"}`,
          });
        }
      }

      // Wait before next batch (except on last iteration)
      if (i + batchSize < slides.length) {
        console.info(`[SafeStory][Background Imaging] Waiting ${batchDelayMs}ms before next batch...`);
        await sleep(batchDelayMs);
      }
    }

    // Final save to ensure all images are persisted
    try {
      const storedStory = await getStoryById(storyId);
      const updatedStory: GeneratedStory = {
        ...storedStory.story_data,
        slides: slides,
        metadata: {
          ...storedStory.story_data.metadata,
          imagingStartedAt: storedStory.story_data.metadata?.imagingStartedAt || new Date().toISOString(),
          imagingCompletedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      await updateStoryData(storyId, updatedStory);

      report({
        stage: "images-ready",
        message: "All slide images processed and saved to database.",
        total: slides.length,
      });

      console.info("[SafeStory][Background Imaging] Completed successfully", { storyId, slidesProcessed: slides.length, totalWithImages: slides.filter(s => s.imageUrl).length });
    } catch (finalSaveError) {
      console.error("[SafeStory][Background Imaging] Final save failed:", finalSaveError);
      report({
        message: `Final save error: ${finalSaveError instanceof Error ? finalSaveError.message : "Unknown error"}`,
      });
    }
  } catch (error) {
    console.error("[SafeStory][Background Imaging] Failed:", error);
    onProgress?.({
      message: `Background imaging error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
};

export const generateStoryWithGroqAndPuter = async (
  input: StoryGenerationInput,
  options: StoryGenerationOptions = {},
): Promise<GeneratedStory> => {
  return generateStoryWithGroqAndPuterWithProgress(input, options);
};

/**
 * DIAGNOSTIC FUNCTION: Test Imagen API and log actual response format
 * Run this in browser console to debug image generation issues
 * 
 * Usage: Copy this test URL to console and call it to see actual API response
 */
export const testImagenApiDirect = async (testPrompt: string = "A happy child reading a book") => {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!GEMINI_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY not found in environment");
    return;
  }

  console.log("🔍 Starting Imagen API diagnostic test...");
  console.log("📝 Test prompt:", testPrompt);

  try {
    const payload = {
      instances: [{ prompt: testPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "4:3",
      },
    };

    console.log("📤 Request payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    console.log("📊 Response status:", response.status, response.statusText);

    const data = await response.json();
    console.log("📥 Full response data:", JSON.stringify(data, null, 2));

    if (response.ok && data?.predictions?.length > 0) {
      console.log("✅ Image generation successful!");
      console.log("📸 First prediction object keys:", Object.keys(data.predictions[0]));
      console.log("📸 First prediction data:", JSON.stringify(data.predictions[0], null, 2));
    } else if (response.ok) {
      console.warn("⚠️ Response OK but no predictions in response");
    } else {
      console.error("❌ API returned error:", data?.error);
    }

    return data;
  } catch (error) {
    console.error("❌ Diagnostic test failed:", error);
  }
};
