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

export interface StoryGenerationInput {
  topic: string;
  ageGroup: string;
  language: string;
  characterCount: number;
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
  const jsonText = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(jsonText) as T;
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
};

const normalizeChoices = (choices?: StoryTreeResponse["slides"][number]["choices"]): GeneratedStoryChoice[] | undefined => {
  if (!choices || choices.length === 0) return undefined;

  return choices.slice(0, 2).map((choice) => ({
    label: choice.label,
    nextSlide: Number.isFinite(choice.nextSlide) ? choice.nextSlide : 1,
    isCorrect: !!choice.isCorrect,
  }));
};

const normalizeSlides = (slides: StoryTreeResponse["slides"]): GeneratedStorySlide[] => {
  const cleaned = slides
    .map((slide, index) => ({
      id: Number.isFinite(slide.id) ? slide.id : index + 1,
      text: slide.text?.trim(),
      imagePrompt: slide.imagePrompt?.trim(),
      choices: normalizeChoices(slide.choices),
    }))
    .filter((slide) => slide.text && slide.imagePrompt);

  if (cleaned.length < 7) {
    throw new Error("Model returned fewer than 7 slides. Please try generating again.");
  }

  return cleaned.slice(0, 10).map((slide, index) => ({
    ...slide,
    id: index + 1,
    choices:
      slide.choices?.map((choice) => ({
        ...choice,
        nextSlide: Math.min(Math.max(choice.nextSlide, index + 1), Math.min(cleaned.length, 10)),
      })) ?? undefined,
  }));
};

const resolvePuterImageResult = async (result: unknown): Promise<string | undefined> => {
  if (!result) return undefined;
  if (typeof result === "string") return result;

  if (result instanceof Blob) {
    return URL.createObjectURL(result);
  }

  if (typeof result === "object") {
    const possible = result as {
      url?: string;
      src?: string;
      image?: string;
      data?: string;
    };

    return possible.url || possible.src || possible.image || possible.data;
  }

  return undefined;
};

export const generateSlideImageWithPuter = async (prompt: string): Promise<string | undefined> => {
  const puterApi = window.puter?.ai;
  if (!puterApi?.txt2img) return undefined;

  try {
    const result = await puterApi.txt2img(prompt);
    return await resolvePuterImageResult(result);
  } catch {
    return undefined;
  }
};

const generateBlueprint = async (input: StoryGenerationInput): Promise<StoryBlueprint> => {
  const system =
    "You are a precise JSON generator for child-safe educational story planning. Return valid JSON only, no markdown.";

  const user = `Create a story blueprint JSON for the following NGO request.
Requirements:
- Language: ${input.language}
- Topic: ${input.topic}
- Age group: ${input.ageGroup}
- Region/cultural context: ${input.regionContext}
- Character count: exactly ${input.characterCount}
- Description: ${input.description}
- Moral lesson: ${input.moralLesson || "Not provided"}

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
    "You are a storytelling engine for safety education. Return valid JSON only with no markdown, no explanations.";

  const user = `Using this blueprint JSON:\n${JSON.stringify(blueprint, null, 2)}\n\nGenerate a branching story JSON in ${input.language}.
Rules:
- Story must contain between 7 and 10 slides
- Use a tree-like structure using choices on at least 3 slides
- Each slide must include text and imagePrompt
- Keep language age-appropriate for ${input.ageGroup}
- Keep child safety framing trauma-informed and practical
- Include both right and wrong choices where relevant

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
    const imageUrl = await generateSlideImageWithPuter(
      `${slide.imagePrompt}. Children's book style, warm colors, safe educational tone.`,
    );

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

  const generatedStory: GeneratedStory = {
    title: blueprint.title,
    topic: input.topic,
    ageGroup: input.ageGroup,
    language: input.language,
    moralLesson: blueprint.moralLesson || input.moralLesson,
    characters: blueprint.characters,
    slides: slidesWithImages,
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
