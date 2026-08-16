/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */

import { Env, ChatMessage } from "./types";
import SYSTEM_PROMPT from "./prompt";

// Default values, overridable via environment variables (see wrangler.jsonc "vars")
const DEFAULT_MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";
const DEFAULT_APP_TITLE = "AI Chat";


export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Serve the frontend entry page with the title injected from the APP_TITLE env var
		if (url.pathname === "/" || url.pathname === "/index.html") {
			return serveIndexPage(request, env);
		}

		// Handle other static assets (frontend)
		if (!url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			// Handle POST requests for chat
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Serves index.html with the page title injected from the APP_TITLE env var.
 */
async function serveIndexPage(request: Request, env: Env): Promise<Response> {
	const res = await env.ASSETS.fetch(request);
	return new HTMLRewriter()
		.on("title", {
			element(element) {
				element.setInnerContent(env.APP_TITLE || DEFAULT_APP_TITLE);
			},
		})
		.transform(res);
}

/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		// Parse JSON request body
		const { messages = [] } = (await request.json()) as {
			messages: ChatMessage[];
		};

		// Add system prompt if not present
		if (!messages.some((msg) => msg.role === "system")) {
			messages.unshift({ role: "system", content: SYSTEM_PROMPT });
		}

		const stream = await env.AI.run(
			(env.MODEL_ID || DEFAULT_MODEL_ID) as keyof AiModels,
			{
				messages,
				max_tokens: 1024,
				stream: true,
			},
			{
				// Uncomment to use AI Gateway
				// gateway: {
				//   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
				//   skipCache: false,      // Set to true to bypass cache
				//   cacheTtl: 3600,        // Cache time-to-live in seconds
				// },
			},
		);

		return new Response(stream, {
			headers: {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache",
				connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
