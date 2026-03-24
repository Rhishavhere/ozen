import { useState } from 'react';
import { Message } from '../types/chat';
import { logUsage } from '../lib/rateLimit';

export function useGroq() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The custom models requested by the user for Groq integration
  const models = [
    { name: 'llama-3.1-8b-instant' },
    { name: 'llama-3.3-70b-versatile' },
    { name: 'openai/gpt-oss-120b' }
  ];

  const sendMessageStream = async (
    model: string,
    messages: Message[],
    onChunk: (chunk: string) => void
  ) => {
    setIsGenerating(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file.");
      }

      // We explicitly request usage stats included in the stream 
      // by using stream_options if the API supports it, 
      // but Groq often sends it in the last chunk anyway.
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = errorText;
        try {
           const parsed = JSON.parse(errorText);
           if (parsed.error?.message) errMsg = parsed.error.message;
        } catch(e) {}
        throw new Error(`Groq API Error: ${response.status} - ${errMsg}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Stream not supported by browser");
      
      // Rough estimation fallback: 1 token ~ 4 chars
      const promptText = messages.map(m => m.content).join(" ");
      let totalTokens = Math.ceil(promptText.length / 4);
      let responseText = "";
      let exactUsageFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line === 'data: [DONE]') break;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.choices && data.choices[0]?.delta?.content) {
                const text = data.choices[0].delta.content;
                responseText += text;
                onChunk(text);
              }
              
              // Capture exact token usage if provided in the stream chunks
              if (data.usage?.total_tokens) {
                 totalTokens = data.usage.total_tokens;
                 exactUsageFound = true;
              }
            } catch (e) {
              // Ignore incomplete JSON parses for fragmented chunks
            }
          }
        }
      }
      
      // Fallback calculation if Groq didn't return a usage chunk
      if (!exactUsageFound) {
         totalTokens += Math.ceil(responseText.length / 4);
      }
      
      // Log to our rate limit/usage tracker
      logUsage(totalTokens);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unknown error communicating with Groq API');
    } finally {
      setIsGenerating(false);
    }
  };

  return { models, isGenerating, error, sendMessageStream };
}
