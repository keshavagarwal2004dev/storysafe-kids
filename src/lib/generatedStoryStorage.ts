export const GENERATED_STORY_STORAGE_KEY = "safestory.generatedStory";

export interface GeneratedStoryChoice {
  label: string;
  nextSlide: string;
  isCorrect: boolean;
}

export interface GeneratedStorySlide {
  id: string;
  slideNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  choices?: GeneratedStoryChoice[];
  createdAt?: string;
}

export interface GeneratedStoryCharacter {
  name: string;
  role: string;
  traits: string[];
}

export interface GeneratedStory {
  id: string;
  title: string;
  topic: string;
  ageGroup: string;
  language: string;
  moralLesson?: string;
  characters: GeneratedStoryCharacter[];
  slides: GeneratedStorySlide[];
  totalSlides: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  metadata?: {
    region?: string;
    description?: string;
    imageStyle?: string;
    generationModel?: string;
  };
}

export const saveGeneratedStory = (story: GeneratedStory) => {
  localStorage.setItem(GENERATED_STORY_STORAGE_KEY, JSON.stringify(story));
};

export const loadGeneratedStory = (): GeneratedStory | null => {
  const raw = localStorage.getItem(GENERATED_STORY_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GeneratedStory;
  } catch {
    return null;
  }
};

export const clearGeneratedStory = () => {
  localStorage.removeItem(GENERATED_STORY_STORAGE_KEY);
};
