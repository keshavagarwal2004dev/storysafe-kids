/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_GROQ_API_KEY: string;
	readonly VITE_GROQ_MODEL_BLUEPRINT?: string;
	readonly VITE_GROQ_MODEL_STORY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
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
