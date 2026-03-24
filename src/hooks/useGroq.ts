import { useState } from "react";
import { Message } from "../types/chat";
import { logUsage } from "../lib/rateLimit";
import { searchMemories, addMemory, getTimeTags } from "../lib/membrain";
import { getSettings } from "../lib/store";

import { getAIConfig } from "../lib/aiProfiles";

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
    options?: { source?: 'panel' | 'desk' }
  ) => {
    setIsGenerating(true);
    setError(null);
    try {
      const config = getAIConfig();
      const settings = getSettings();
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error(
          "Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file.",
        );
      }

      // ── MEMBRAIN: Search ──────────────────────────────────────────────────
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      
      const shouldFetch = options?.source === 'panel' ? settings.membrainPanelFetch : settings.membrainDeskFetch;
      const memoryContext = (lastUserMsg && shouldFetch)
        ? await searchMemories(lastUserMsg.content)
        : "";

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
        addMemory(lastUserMsg.content, ["source.groq", "type.user-message", ...timeTags]);
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
            temperature: config.temperature,
            max_tokens: config.maxTokens,
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

      // ── MEMBRAIN: Store AI response in background ──────────────────────────
      if (responseText.trim()) {
        addMemory(
          `[AI Response to "${lastUserMsg?.content?.slice(0, 80) || 'unknown'}"] ${responseText.slice(0, 2000)}`,
          ["source.groq", "type.ai-response", `model.${model}`, ...timeTags]
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error communicating with Groq API");
    } finally {
      setIsGenerating(false);
    }
  };

  return { models, isGenerating, error, sendMessageStream };
}
