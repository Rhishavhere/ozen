import { useState, useCallback, useEffect } from "react";
import { Message, OllamaModel } from "../types/chat";
import { logUsage } from "../lib/rateLimit";
import { searchMemories, addMemory } from "../lib/membrain"; // ← NEW

const OLLAMA_URL = "http://localhost:11434";

export function useOllama() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) throw new Error("Failed to fetch models from Ollama");
      const data = await response.json();
      setModels(data.models || []);
    } catch (err: any) {
      setError(
        err.message || "Error fetching models. Make sure Ollama is running.",
      );
    }
  }, []);

  const sendMessageStream = async (
    modelName: string,
    messages: Message[],
    onChunk: (chunk: string) => void,
  ) => {
    setIsGenerating(true);
    setError(null);
    try {
      // ── MEMBRAIN: Search ──────────────────────────────────────────────────
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      const memoryContext = lastUserMsg
        ? await searchMemories(lastUserMsg.content)
        : "";

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
        addMemory(lastUserMsg.content, ["source.ollama", "type.user-message"]);
      }
      // ─────────────────────────────────────────────────────────────────────

      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: messagesWithMemory.map(({ role, content }) => ({
            role,
            content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to start chat stream");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split("\n")
          .filter((line) => line.trim().length > 0);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullContent += parsed.message.content;
              onChunk(parsed.message.content);
            }
          } catch (e) {
            console.error("Error parsing JSON line:", line, e);
          }
        }
      }

      const estimatedTokens = Math.max(1, Math.ceil(fullContent.length / 4));
      logUsage(estimatedTokens);
    } catch (err: any) {
      setError(err.message || "Error during generation");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, isGenerating, error, fetchModels, sendMessageStream };
}
