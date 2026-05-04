"use client";

import { useCallback, useState } from "react";

const WELCOME_MESSAGE = "Hello! I'm your AI clinical assistant. I can help analyze symptoms, provide medical guidance, and support clinical decision-making. How can I assist you today?";

function formatAgentPayload(data: Record<string, unknown>): string {
  const d = data.result ?? data.payload ?? data.data;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const inner = d as Record<string, unknown>;
    if (typeof inner.error === "string") return inner.error;
    if (inner.stage === "follow_up") {
      return [inner.question, inner.guidance].filter((x) => typeof x === "string" && (x as string).trim()).join("\n\n");
    }
    const parts: string[] = [];
    if (typeof inner.summary === "string" && inner.summary.trim()) parts.push(inner.summary);
    if (typeof inner.recommendation === "string" && inner.recommendation.trim()) parts.push(inner.recommendation);
    if (typeof inner.question === "string" && inner.question.trim()) parts.push(inner.question);
    if (typeof inner.message === "string" && inner.message.trim()) parts.push(inner.message);
    if (Array.isArray(inner.emergencySteps) && inner.emergencySteps.length) {
      parts.push("🚨 **Emergency steps:**\n" + (inner.emergencySteps as string[]).join("\n"));
    }
    if (inner.nearbyHospitals && typeof inner.nearbyHospitals === "object") {
      parts.push("🏥 Nearby medical resources have been located and are available in the clinical dashboard.");
    }
    const joined = parts.join("\n\n").trim();
    return joined || JSON.stringify(inner, null, 2);
  }
  return typeof d === "string" ? d : JSON.stringify(data, null, 2);
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  status: "sending" | "sent" | "streaming" | "complete";
}

const EMPTY_MESSAGES: Message[] = [{
  id: "welcome",
  role: "assistant",
  content: WELCOME_MESSAGE,
  timestamp: Date.now(),
  status: "complete"
}];

export function DoctorAssistant({ threadId = "clinical-chat" }: { threadId?: string }) {
  const [messages, setMessages] = useState<Message[]>(EMPTY_MESSAGES);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    // Add user message
    addMessage({
      id: userMessageId,
      role: "user",
      content: trimmedInput,
      timestamp: Date.now(),
      status: "sent"
    });

    // Add assistant message placeholder
    addMessage({
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now() + 1,
      status: "streaming"
    });

    setInput("");
    setIsLoading(true);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom: trimmedInput,
          followUpAnswer: "Clinical assistant query from doctor.",
          clientMessageId: assistantMessageId,
          threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = formatAgentPayload(data);

      // Simulate streaming effect
      let currentContent = "";
      const words = content.split(" ");
      let wordIndex = 0;

      const streamInterval = setInterval(() => {
        if (wordIndex < words.length) {
          currentContent += (wordIndex > 0 ? " " : "") + words[wordIndex];
          setStreamingMessage(currentContent);
          updateMessage(assistantMessageId, { content: currentContent });
          wordIndex++;
        } else {
          clearInterval(streamInterval);
          updateMessage(assistantMessageId, {
            content: currentContent,
            status: "complete"
          });
          setStreamingMessage("");
        }
      }, 50); // Adjust speed as needed

    } catch {
      updateMessage(assistantMessageId, {
        content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact support if the issue persists.",
        status: "complete"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Clinical Assistant</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">AI-powered medical guidance</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-600 dark:text-slate-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-12"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 mr-12 border border-white/50"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Clinical Assistant</span>
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
                {message.status === "streaming" && streamingMessage && (
                  <span className="animate-pulse">▊</span>
                )}
              </div>
              {message.status === "streaming" && !streamingMessage && (
                <div className="flex space-x-1 mt-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/10 backdrop-blur-md border-t border-white/20">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe symptoms or ask for clinical guidance..."
              className="w-full resize-none rounded-2xl border border-white/30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] max-h-32"
              rows={1}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-3 flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl px-6 py-3 font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          Press Enter to send • AI responses are for clinical guidance only
        </p>
      </div>
    </div>
  );
}
