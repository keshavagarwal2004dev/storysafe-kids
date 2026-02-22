export const topics = [
  "Good Touch Bad Touch",
  "Stranger Danger",
  "Safe & Unsafe Secrets",
  "Bullying",
  "Online Safety",
] as const;

export const ageGroups = ["4-6 years", "7-9 years", "10-12 years", "13-15 years"] as const;

export const languages = ["English", "Hindi", "Tamil", "Bengali", "Marathi", "Telugu", "Kannada"] as const;

export const avatars = ["🧒", "👧", "👦", "👶", "🧒🏽", "👧🏾", "👦🏻", "👧🏼"] as const;

export interface Story {
  id: string;
  title: string;
  topic: string;
  ageGroup: string;
  language: string;
  coverColor: string;
  status: "draft" | "published";
  studentsReached: number;
  completionRate: number;
  createdAt: string;
}

export const mockStories: Story[] = [
  {
    id: "1",
    title: "Rani and the Playground",
    topic: "Stranger Danger",
    ageGroup: "7-9 years",
    language: "English",
    coverColor: "hsl(152 45% 42%)",
    status: "published",
    studentsReached: 234,
    completionRate: 87,
    createdAt: "2026-02-15",
  },
  {
    id: "2",
    title: "My Body Belongs to Me",
    topic: "Good Touch Bad Touch",
    ageGroup: "4-6 years",
    language: "Hindi",
    coverColor: "hsl(207 55% 55%)",
    status: "published",
    studentsReached: 512,
    completionRate: 92,
    createdAt: "2026-02-10",
  },
  {
    id: "3",
    title: "The Secret That Shouldn't Stay",
    topic: "Safe & Unsafe Secrets",
    ageGroup: "7-9 years",
    language: "English",
    coverColor: "hsl(25 85% 65%)",
    status: "draft",
    studentsReached: 0,
    completionRate: 0,
    createdAt: "2026-02-20",
  },
  {
    id: "4",
    title: "Standing Up Together",
    topic: "Bullying",
    ageGroup: "10-12 years",
    language: "English",
    coverColor: "hsl(280 50% 55%)",
    status: "published",
    studentsReached: 178,
    completionRate: 79,
    createdAt: "2026-02-08",
  },
  {
    id: "5",
    title: "Stay Safe Online",
    topic: "Online Safety",
    ageGroup: "10-12 years",
    language: "Tamil",
    coverColor: "hsl(340 60% 55%)",
    status: "published",
    studentsReached: 145,
    completionRate: 85,
    createdAt: "2026-02-05",
  },
  {
    id: "6",
    title: "Arjun's Brave Day",
    topic: "Good Touch Bad Touch",
    ageGroup: "7-9 years",
    language: "Bengali",
    coverColor: "hsl(152 45% 42%)",
    status: "draft",
    studentsReached: 0,
    completionRate: 0,
    createdAt: "2026-02-18",
  },
];

export interface StorySlide {
  id: string;
  slideNumber: number;
  imageDescription: string;
  text: string;
  choices?: { label: string; nextSlide: string; isCorrect: boolean }[];
}

export const sampleStorySlides: StorySlide[] = [
  {
    id: "1",
    slideNumber: 1,
    imageDescription: "A sunny playground with children playing happily",
    text: "It was a beautiful afternoon. Rani was playing on the swings at the park near her school. She loved the feeling of the wind in her hair!",
  },
  {
    id: "2",
    slideNumber: 2,
    imageDescription: "A friendly-looking stranger approaching with candy",
    text: "A man Rani had never seen before walked up to her. \"Hello little girl! Would you like some candy? I have a puppy in my car too!\" he said with a big smile.",
  },
  {
    id: "3",
    slideNumber: 3,
    imageDescription: "Rani looking thoughtful with two thought bubbles",
    text: "Rani remembered what her teacher had told her about strangers. What should Rani do?",
    choices: [
      { label: "Ask for help from a trusted adult", nextSlide: "4", isCorrect: true },
      { label: "Go with the person", nextSlide: "5", isCorrect: false },
    ],
  },
  {
    id: "4",
    slideNumber: 4,
    imageDescription: "Rani running to her teacher, looking brave and confident",
    text: "\"No thank you!\" said Rani firmly. She ran straight to her teacher Mrs. Sharma. \"A stranger offered me candy and wanted me to go with him!\" Rani told her. Mrs. Sharma was so proud of Rani! \"You did exactly the right thing, Rani. You are brave and smart!\" 🌟",
  },
  {
    id: "5",
    slideNumber: 5,
    imageDescription: "A gentle warning scene with a thought bubble showing the right action",
    text: "Oh no! Going with a stranger is never safe, even if they seem friendly. Remember: strangers can seem nice but have bad intentions. The safe choice is always to say NO and tell a trusted adult right away. Let's see what Rani should have done... 💡",
  },
];

export const studentStories = mockStories.filter((s) => s.status === "published");

export const dashboardStats = {
  storiesCreated: mockStories.length,
  studentsReached: mockStories.reduce((sum, s) => sum + s.studentsReached, 0),
  completionRate: Math.round(
    mockStories.filter((s) => s.completionRate > 0).reduce((sum, s) => sum + s.completionRate, 0) /
      mockStories.filter((s) => s.completionRate > 0).length
  ),
  activeStories: mockStories.filter((s) => s.status === "published").length,
};
