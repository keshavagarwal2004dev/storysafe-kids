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
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const SAFE_IMAGE_STYLE_SUFFIX =
  "Children's book illustration, warm colors, innocent, safe educational tone, no scary elements, no violence, no nudity, non-threatening.";

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
  if (!GEMINI_API_KEY) {
    console.warn("[SafeStory] Gemini API key missing; image generation skipped.");
    return undefined;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[SafeStory] Gemini API error:", errorData);
      return undefined;
    }

    const data = await response.json();
    const imageDataUrl =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ||
      data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;

    if (!imageDataUrl) {
      console.warn("[SafeStory] No image data returned from Gemini.");
      return undefined;
    }

    return `data:image/jpeg;base64,${imageDataUrl}`;
  } catch (error) {
    console.error("[SafeStory] Image generation failed:", error);
    return undefined;
  }
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
    message: `Story structure ready with ${slides.length} slides.`,
    total: slides.length,
  });

  report({
    stage: "images-start",
    message: "Generating illustrations for each slide with Puter...",
    total: slides.length,
  });

  const slidesWithImages: GeneratedStorySlide[] = [];

  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const imageUrl = await generateSlideImageWithPuter(slide.imagePrompt);

    slidesWithImages.push({
      ...slide,
      imageUrl,
    });

    report({
      stage: "image-progress",
      message: `Generated image ${index + 1} of ${slides.length}.`,
      current: index + 1,
      total: slides.length,
    });
  }

  report({
    stage: "images-ready",
    message: "All slide illustrations generated.",
    total: slides.length,
  });

  const now = new Date().toISOString();
  const generatedStory: GeneratedStory = {
    id: `story-${Date.now()}`,
    title: blueprint.title,
    topic: input.topic,
    ageGroup: input.ageGroup,
    language: input.language,
    moralLesson: blueprint.moralLesson || input.moralLesson,
    characters: blueprint.characters,
    slides: slidesWithImages,
    totalSlides: slidesWithImages.length,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    metadata: {
      region: input.regionContext,
      description: input.description,
      imageStyle: "gemini-2.0-flash-medium-quality",
      generationModel: "llama-3.3-70b-versatile",
    },
  };

  report({
    stage: "completed",
    message: "Story generation completed successfully.",
    total: slides.length,
  });

  return generatedStory;
};

export const generateStoryWithGroqAndPuter = async (
  input: StoryGenerationInput,
  options: StoryGenerationOptions = {},
): Promise<GeneratedStory> => {
  return generateStoryWithGroqAndPuterWithProgress(input, options);
};
