/**
 * Type definitions for the LLM chat application.
 */

/**
 * Represents the environment variables for the LLM chat application.
 */
export interface Env {
	/**
	 * Binding for the Workers AI API.
	 */
	AI: Ai;

	/**
	 * Binding for static assets.
	 */
	ASSETS: { fetch: (request: Request) => Promise<Response> };

	/**
	 * Model ID for Workers AI, configurable via the MODEL_ID env var.
	 */
	MODEL_ID?: string;

	/**
	 * Frontend page title, configurable via the APP_TITLE env var.
	 */
	APP_TITLE?: string;

	/**
	 * KV namespace storing the system prompt (key: `system_prompt`).
	 */
	PROMPT_KV: KVNamespace;
}

/**
 * Represents a chat message.
 */
export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}
