import { useState, useCallback, useEffect } from "react";
import { Message, OllamaModel } from "../types/chat";
import { logUsage } from "../lib/rateLimit";
import { searchMemories, addMemory, getTimeTags } from "../lib/membrain";
import { getAIConfig } from "../lib/aiProfiles";
import { getSettings } from "../lib/store";

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_TIMEOUT = 30000; // 30 seconds

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Forward caller abort to controller so both signals are honoured
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(id);
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal, // always use controller signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      if (options.signal?.aborted) {
        throw new DOMException('Request was cancelled by caller', 'AbortError');
      }
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export function useOllama() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`);
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
    options?: { source?: 'panel' | 'desk' }
  ) => {
    setIsGenerating(true);
    setError(null);
    try {
      const config = getAIConfig();
      const settings = getSettings();
      // ── MEMBRAIN: Search ──────────────────────────────────────────────────
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      const shouldFetch = options?.source === 'panel' ? settings.membrainPanelFetch : settings.membrainDeskFetch;
      
      let memoryContext = "";
      if (lastUserMsg && shouldFetch) {
        try {
          const memResponse = await searchMemories(lastUserMsg.content, 5, "both");
          if (memResponse?.interpreted?.answer_summary) {
            memoryContext = memResponse.interpreted.answer_summary;
          } else if (memResponse?.results?.length > 0) {
            memoryContext = memResponse.results.map((r: any) => `- ${r.content}`).join("\n");
          }
        } catch (e) {
          console.error("Memory search failed:", e);
        }
      }

      // Build final message array — unify system message if memory found
      let messagesWithMemory: Message[] = [...messages];
      if (memoryContext) {
        const memoryPrompt = `\n\n[Persistent Memory Context]\n${memoryContext}`;
        const systemMsgIdx = messagesWithMemory.findIndex(m => m.role === 'system');
        
        if (systemMsgIdx >= 0) {
          // Merge with existing system message
          messagesWithMemory[systemMsgIdx] = {
            ...messagesWithMemory[systemMsgIdx],
            content: messagesWithMemory[systemMsgIdx].content + memoryPrompt
          };
        } else {
          // Add as new system message at start
          messagesWithMemory.unshift({
            id: "mem-ctx",
            role: "system",
            content: "You have access to the user's persistent memory. Use the following context to personalize your response:" + memoryPrompt,
          });
        }
      }

      // ── MEMBRAIN: Store user message in background ────────────────────────
      const timeTags = getTimeTags();
      if (lastUserMsg) {
        addMemory(lastUserMsg.content, ["source.ollama", "type.user-message", ...timeTags])
          .catch(e => {
            console.error("Failed to store user message in memory (Ollama):", e);
          });
      }
      // ─────────────────────────────────────────────────────────────────────

      const response = await fetchWithTimeout(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: messagesWithMemory.map(({ role, content }) => ({
            role,
            content,
          })),
          options: {
            temperature: config.temperature,
            num_predict: config.maxTokens,
          },
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

      // ── MEMBRAIN: Store AI response in background ──────────────────────────
      if (fullContent.trim()) {
        addMemory(
          `[AI Response to "${lastUserMsg?.content?.slice(0, 80) || 'unknown'}"] ${fullContent.slice(0, 2000)}`,
          ["source.ollama", "type.ai-response", `model.${modelName}`, ...timeTags]
        ).catch(e => {
          console.error("Failed to store AI response in memory (Ollama):", e);
        });
      }
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
