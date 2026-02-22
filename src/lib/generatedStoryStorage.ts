export const GENERATED_STORY_STORAGE_KEY = "safestory.generatedStory";

export interface GeneratedStoryChoice {
  label: string;
  nextSlide: number;
  isCorrect: boolean;
}

export interface GeneratedStorySlide {
  id: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  choices?: GeneratedStoryChoice[];
}

export interface GeneratedStory {
  title: string;
  topic: string;
  ageGroup: string;
  language: string;
  moralLesson?: string;
  characters: Array<{ name: string; role: string; traits: string[] }>;
  slides: GeneratedStorySlide[];
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
