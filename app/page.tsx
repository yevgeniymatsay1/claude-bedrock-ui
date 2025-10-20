"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  FileText,
  Image as ImageIcon,
  X,
  Search,
  Brain,
} from "lucide-react";

type Model = "sonnet-4.5" | "opus-4.1";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: Array<{ data: string; format: string; preview: string }>;
  documents?: Array<{ data: string; format: string; name: string }>;
  timestamp: number;
};

type SearchResult = {
  title: string;
  url: string;
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<Model>("sonnet-4.5");
  const [extendedThinking, setExtendedThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [attachments, setAttachments] = useState<{
    images: Array<{ data: string; format: string; preview: string }>;
    documents: Array<{ data: string; format: string; name: string }>;
  }>({ images: [], documents: [] });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("claude-chat-history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("claude-chat-history", JSON.stringify(messages));
    }
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1];

        if (file.type.startsWith("image/")) {
          const format = file.type.split("/")[1];
          setAttachments((prev) => ({
            ...prev,
            images: [
              ...prev.images,
              { data: base64Data, format, preview: base64 },
            ],
          }));
        } else if (
          file.type === "application/pdf" ||
          file.type.includes("document") ||
          file.type.includes("text")
        ) {
          const format = file.type.includes("pdf")
            ? "pdf"
            : file.type.includes("word")
            ? "docx"
            : "txt";
          setAttachments((prev) => ({
            ...prev,
            documents: [
              ...prev.documents,
              { data: base64Data, format, name: file.name },
            ],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (type: "images" | "documents", index: number) => {
    setAttachments((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const performWebSearch = async (query: string): Promise<SearchResult[]> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_TAVILY_API_KEY;
      if (!apiKey) {
        console.warn("Tavily API key not configured");
        return [];
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          max_results: 5,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Web search error:", error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.images.length === 0 && attachments.documents.length === 0) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      images: attachments.images.length > 0 ? attachments.images : undefined,
      documents: attachments.documents.length > 0 ? attachments.documents : undefined,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments({ images: [], documents: [] });
    setIsLoading(true);

    let searchResults: SearchResult[] = [];
    if (webSearch && input.trim()) {
      searchResults = await performWebSearch(input);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map((msg) => ({
            role: msg.role,
            text: msg.text,
            images: msg.images,
            documents: msg.documents,
          })),
          model,
          extendedThinking,
          searchResults,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === "assistant") {
                      lastMessage.text += parsed.text;
                    }
                    return newMessages;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Clear all messages?")) {
      setMessages([]);
      localStorage.removeItem("claude-chat-history");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-semibold text-gray-900">Claude Chat</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Model Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setModel("sonnet-4.5")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                model === "sonnet-4.5"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sonnet 4.5
            </button>
            <button
              onClick={() => setModel("opus-4.1")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                model === "opus-4.1"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Opus 4.1
            </button>
          </div>

          {/* Settings Toggles */}
          <button
            onClick={() => setExtendedThinking(!extendedThinking)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              extendedThinking
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="Extended Thinking"
          >
            <Brain className="w-4 h-4" />
            {extendedThinking && "Extended"}
          </button>

          <button
            onClick={() => setWebSearch(!webSearch)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              webSearch
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="Web Search"
          >
            <Search className="w-4 h-4" />
            {webSearch && "Search"}
          </button>

          <button
            onClick={clearChat}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to Claude Chat
              </h2>
              <p className="text-gray-600">
                Start a conversation with Claude. You can attach images, upload
                documents, and enable web search.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                {message.images && message.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.images.map((img, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={img.preview}
                        alt="Uploaded"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {message.documents && message.documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Attachments Preview */}
          {(attachments.images.length > 0 ||
            attachments.documents.length > 0) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.images.map((img, idx) => (
                <div key={`img-${idx}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => removeAttachment("images", idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {attachments.documents.map((doc, idx) => (
                <div
                  key={`doc-${idx}`}
                  className="relative flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{doc.name}</span>
                  <button
                    onClick={() => removeAttachment("documents", idx)}
                    className="ml-2 text-red-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Attach files"
            >
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Message Claude..."
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                rows={1}
                style={{ minHeight: "52px", maxHeight: "200px" }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && attachments.images.length === 0 && attachments.documents.length === 0)}
              className="p-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-2">
            Claude can make mistakes. Check important info.
          </p>
        </div>
      </footer>
    </div>
  );
}
