/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_GROQ_API_KEY: string;
	readonly VITE_GROQ_MODEL_BLUEPRINT?: string;
	readonly VITE_GROQ_MODEL_STORY?: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_GEMINI_MODEL?: string;
}

interface PuterAI {
	txt2img?: (prompt: string) => Promise<unknown>;
}

interface PuterSDK {
	ai?: PuterAI;
}

interface Window {
	puter?: PuterSDK;
}
