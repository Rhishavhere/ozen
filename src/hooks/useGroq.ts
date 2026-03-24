import { useState } from "react";
import { Message } from "../types/chat";
import { logUsage } from "../lib/rateLimit";
import { searchMemories, addMemory } from "../lib/membrain"; // ← NEW

export function useGroq() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const models = [
    { name: "llama-3.1-8b-instant" },
    { name: "llama-3.3-70b-versatile" },
    { name: "openai/gpt-oss-120b" },
  ];

  const sendMessageStream = async (
    model: string,
    messages: Message[],
    onChunk: (chunk: string) => void,
  ) => {
    setIsGenerating(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error(
          "Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file.",
        );
      }

      // ── MEMBRAIN: Search ──────────────────────────────────────────────────
      // Get the last user message to use as the memory search query
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      const memoryContext = lastUserMsg
        ? await searchMemories(lastUserMsg.content)
        : "";

      // Build final message array — inject memory as system message if found
      const messagesWithMemory: Message[] = memoryContext
        ? [
            {
              id: "mem-ctx",
              role: "system",
              content: `You have access to the user's persistent memory. Use the following context to personalize your response:\n\n${memoryContext}`,
            },
            ...messages,
          ]
        : messages;

      // ── MEMBRAIN: Store user message in background ────────────────────────
      if (lastUserMsg) {
        addMemory(lastUserMsg.content, ["source.groq", "type.user-message"]);
      }
      // ─────────────────────────────────────────────────────────────────────

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: messagesWithMemory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = errorText;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error?.message) errMsg = parsed.error.message;
        } catch (e) {}
        throw new Error(`Groq API Error: ${response.status} - ${errMsg}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Stream not supported by browser");

      const promptText = messages.map((m) => m.content).join(" ");
      let totalTokens = Math.ceil(promptText.length / 4);
      let responseText = "";
      let exactUsageFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line === "data: [DONE]") break;
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices && data.choices[0]?.delta?.content) {
                const text = data.choices[0].delta.content;
                responseText += text;
                onChunk(text);
              }
              if (data.usage?.total_tokens) {
                totalTokens = data.usage.total_tokens;
                exactUsageFound = true;
              }
            } catch (e) {}
          }
        }
      }

      if (!exactUsageFound) {
        totalTokens += Math.ceil(responseText.length / 4);
      }
      logUsage(totalTokens);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error communicating with Groq API");
    } finally {
      setIsGenerating(false);
    }
  };

  return { models, isGenerating, error, sendMessageStream };
}
