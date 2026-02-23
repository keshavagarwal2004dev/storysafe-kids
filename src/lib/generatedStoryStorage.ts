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
    imagingStartedAt?: string | null;
    imagingCompletedAt?: string | null;
  };
}
