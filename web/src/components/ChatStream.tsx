'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatStreamProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSelectCitation?: (docId: string) => void;
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onSelectCitation,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  /**
   * Parse [Sanity: doc-id] citations in text and turn them into interactive clickable pills
   */
  const renderFormattedContent = (content: string) => {
    const citationRegex = /\[Sanity:\s*([a-zA-Z0-9_-]+)\]/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        parts.push(content.substring(lastIdx, match.index));
      }
      const docId = match[1];
      parts.push(
        <button
          key={`cite-${match.index}`}
          onClick={() => onSelectCitation?.(docId)}
          className="inline-flex items-center space-x-1 px-2 py-0.5 mx-1 rounded bg-[#d4af37]/15 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#d4af37] text-[11px] font-mono transition-colors align-middle shadow-sm"
          title={`Inspect Sanity document: ${docId}`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Sanity: {docId}</span>
        </button>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < content.length) {
      parts.push(content.substring(lastIdx));
    }

    return parts;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c13] overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#1b2133] text-white border border-[#2c354e] rounded-br-none shadow-md'
                  : 'bg-[#131622] text-zinc-200 border border-[#242938] rounded-bl-none shadow-lg'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {renderFormattedContent(m.content)}
              </div>
              <div
                className={`text-[10px] mt-2 font-mono ${
                  m.role === 'user' ? 'text-zinc-400 text-right' : 'text-zinc-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#131622] border border-[#242938] text-xs text-zinc-400 flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
              <span>Querying Sanity Context MCP & synthesizing grounded exegesis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#242938] bg-[#0d0f17]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about classical scholarly opinions, divergences, or verses..."
            disabled={isLoading}
            className="w-full bg-[#131624] text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl pl-4 pr-12 py-3 border border-[#252a3c] focus:outline-none focus:border-[#d4af37]/60 transition-colors shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 p-2 rounded-lg bg-[#d4af37] hover:bg-[#c4a02f] disabled:bg-zinc-800 text-black disabled:text-zinc-500 transition-colors shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
