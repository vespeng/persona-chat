/**
 * LLM Chat App Frontend
 *
 * Handles the chat UI interactions and communication with the backend API.
 */

// Welcome messages list - randomly pick one on load
const welcomeMessages = [
	"👋 Hi！有什么想聊的吗？",
	"😊 嘿！今天想聊点什么呢？",
	"✨ 你好！有什么需要我帮忙的？",
	"🌟 嗨！来聊聊天～",
	"💬 你好！随便聊聊～",
	"🌞 哈喽！今天心情怎么样？"
];
const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const welcomeContainer = document.getElementById("welcome-container");
const messageInput = document.getElementById("message-input");

// Set random welcome message
const welcomeTitle = welcomeContainer.querySelector("h1");
if (welcomeTitle) welcomeTitle.textContent = randomWelcome;

// Chat state
let chatHistory = [
	{
		role: "assistant",
		content:
			"Hello! I'm an LLM chat app powered by Cloudflare Workers AI. How can I help you today?",
	},
];
let isProcessing = false;
let chatStarted = false;

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
	this.style.height = "auto";
	this.style.height = this.scrollHeight + "px";
});

// Send message on Enter (without Shift), but not during IME composition
userInput.addEventListener("keydown", function (e) {
	if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
		e.preventDefault();
		sendMessage();
	}
});

// Send button click handler
sendButton.addEventListener("click", sendMessage);

/**
 * Sends a message to the chat API and processes the response
 */
async function sendMessage() {
	const message = userInput.value.trim();

	// Don't send empty messages
	if (message === "" || isProcessing) return;

	// 首次发送消息时，切换到聊天界面
	if (!chatStarted) {
		chatStarted = true;
		// 直接切换到聊天界面，让CSS过渡效果自然发生
		document.body.classList.add("chat-started");
		// 清除初始的欢迎消息
		chatMessages.innerHTML = "";
	}

	// Disable input while processing
	isProcessing = true;
	userInput.disabled = true;
	sendButton.disabled = true;

	// Add user message to chat
	addMessageToChat("user", message);

	// Clear input
	userInput.value = "";
	userInput.style.height = "auto";

	// Show typing indicator in input
	userInput.placeholder = "AI is thinking...";
	userInput.classList.add("thinking");

	// Add message to history
	chatHistory.push({ role: "user", content: message });

	try {
		// Create new assistant response element
		const assistantMessageEl = document.createElement("div");
		assistantMessageEl.className = "message assistant-message";
		chatMessages.appendChild(assistantMessageEl);

		// Scroll to bottom
		chatMessages.scrollTop = chatMessages.scrollHeight;

		// Send request to API
		const response = await fetch("/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messages: chatHistory,
			}),
		});

		// Handle errors
		if (!response.ok) {
			throw new Error("Failed to get response");
		}
		if (!response.body) {
			throw new Error("Response body is null");
		}

		// Process streaming response
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let responseText = "";
		let buffer = "";
		const flushAssistantText = () => {
			// 使用 Marked.js 渲染 Markdown 内容，移除末尾空白
			assistantMessageEl.innerHTML = marked.parse(responseText).trimEnd();
			chatMessages.scrollTop = chatMessages.scrollHeight;
		};

		let sawDone = false;
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				// Process any remaining complete events in buffer
				const parsed = consumeSseEvents(buffer + "\n\n");
				for (const data of parsed.events) {
					if (data === "[DONE]") {
						break;
					}
					try {
						const jsonData = JSON.parse(data);
						// Handle both Workers AI format (response) and OpenAI format (choices[0].delta.content)
						let content = "";
						if (
							typeof jsonData.response === "string" &&
							jsonData.response.length > 0
						) {
							content = jsonData.response;
						} else if (jsonData.choices?.[0]?.delta?.content) {
							content = jsonData.choices[0].delta.content;
						}
						if (content) {
							responseText += content;
							flushAssistantText();
						}
					} catch (e) {
						console.error("Error parsing SSE data as JSON:", e, data);
					}
				}
				break;
			}

			// Decode chunk
			buffer += decoder.decode(value, { stream: true });
			const parsed = consumeSseEvents(buffer);
			buffer = parsed.buffer;
			for (const data of parsed.events) {
				if (data === "[DONE]") {
					sawDone = true;
					buffer = "";
					break;
				}
				try {
					const jsonData = JSON.parse(data);
					// Handle both Workers AI format (response) and OpenAI format (choices[0].delta.content)
					let content = "";
					if (
						typeof jsonData.response === "string" &&
						jsonData.response.length > 0
					) {
						content = jsonData.response;
					} else if (jsonData.choices?.[0]?.delta?.content) {
						content = jsonData.choices[0].delta.content;
					}
					if (content) {
						responseText += content;
						flushAssistantText();
					}
				} catch (e) {
					console.error("Error parsing SSE data as JSON:", e, data);
				}
			}
			if (sawDone) {
				break;
			}
		}

		// Add completed response to chat history
		if (responseText.length > 0) {
			chatHistory.push({ role: "assistant", content: responseText });
		}
	} catch (error) {
		console.error("Error:", error);
		addMessageToChat(
			"assistant",
			"Sorry, there was an error processing your request.",
		);
	} finally {
		// Hide typing indicator
		userInput.placeholder = "Type your message here...";
		userInput.classList.remove("thinking");

		// Re-enable input
		isProcessing = false;
		userInput.disabled = false;
		sendButton.disabled = false;
		userInput.focus();
	}
}

/**
 * Helper function to add message to chat
 */
function addMessageToChat(role, content) {
	const messageEl = document.createElement("div");
	messageEl.className = `message ${role}-message`;
	// 使用 Marked.js 渲染 Markdown 内容
	messageEl.innerHTML = marked.parse(content).trimEnd();
	chatMessages.appendChild(messageEl);

	// Scroll to bottom
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

function consumeSseEvents(buffer) {
	// 统一所有换行风格
	const normalized = buffer.replace(/\r\n?/g, "\n");

	const events = [];
	let pos = 0;

	while (true) {
		const endIndex = normalized.indexOf("\n\n", pos);
		if (endIndex === -1) break;

		const rawEvent = normalized.slice(pos, endIndex);
		pos = endIndex + 2;

		const lines = rawEvent.split("\n");
		const dataParts = [];

		for (const line of lines) {
			if (line.startsWith("data:")) {
				const value = line.slice(5).trimStart();
				if (value) dataParts.push(value);
			}
		}

		if (dataParts.length > 0) {
			const eventData = dataParts.join("\n").trim();
			events.push(eventData);
		}
	}

	// 取出剩余部分，并清理尾部无意义换行
	let remaining = normalized.slice(pos).trimEnd();

	return { events, buffer: remaining };
}
