'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ArrowUpRight } from 'lucide-react';

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
   * Helper to detect whether a text block starts primarily with Arabic
   */
  const startsWithArabic = (text: string): boolean => {
    return /^[\s\W\d]*[\u0600-\u06FF]/.test(text);
  };

  /**
   * Detect current input direction
   */
  const isInputArabic = startsWithArabic(input);

  /**
   * Render inline tokens (bold, italics, inline code, and [Sanity: docId] pills)
   */
  const renderInlineTokens = (line: string, lineKey: string | number) => {
    const tokenRegex = /(\[Sanity:\s*[a-zA-Z0-9_-]+\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = line.split(tokenRegex);

    return parts.map((part, idx) => {
      const key = `${lineKey}-tok-${idx}`;
      if (!part) return null;

      // [Sanity: id]
      const sanityMatch = part.match(/^\[Sanity:\s*([a-zA-Z0-9_-]+)\]$/);
      if (sanityMatch) {
        const docId = sanityMatch[1];
        return (
          <button
            key={key}
            onClick={() => onSelectCitation?.(docId)}
            className="inline-flex items-center space-x-1 px-2 py-0.5 mx-1 my-0.5 rounded-md bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 text-[#d4af37] text-[11px] font-mono transition-all align-baseline shadow-sm group"
            title={`Inspect Sanity Document: ${docId}`}
          >
            <Sparkles className="w-3 h-3 text-[#d4af37]" />
            <span className="font-semibold">{docId}</span>
            <ArrowUpRight className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
          </button>
        );
      }

      // **bold**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={key} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // *italic*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={key} className="italic text-zinc-300">
            {part.slice(1, -1)}
          </em>
        );
      }

      // `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={key}
            className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#181d2c] text-[#fceda2] border border-[#2b354e]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={key}>{part}</span>;
    });
  };

  /**
   * Render multi-line markdown block cleanly
   */
  const renderRichMarkdown = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 3: ###
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4);
        return (
          <h3
            key={idx}
            className="text-sm font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-1.5 mt-4 mb-2 first:mt-0 flex items-center gap-1.5"
          >
            <span>{text}</span>
          </h3>
        );
      }

      // Heading 4: ####
      if (trimmed.startsWith('#### ')) {
        const text = trimmed.slice(5);
        return (
          <h4
            key={idx}
            className="text-xs font-semibold text-zinc-100 mt-3 mb-1.5 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
            <span>{renderInlineTokens(text, `h4-${idx}`)}</span>
          </h4>
        );
      }

      // Bullet item: * or -
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const text = trimmed.slice(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 pl-1">
            <span className="text-[#d4af37] text-xs mt-0.5 shrink-0">•</span>
            <div className="flex-1 text-xs leading-relaxed text-zinc-200">
              {renderInlineTokens(text, `bullet-${idx}`)}
            </div>
          </div>
        );
      }

      // Empty line
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-xs sm:text-[13px] leading-relaxed text-zinc-200 my-1">
          {renderInlineTokens(line, `p-${idx}`)}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08090e] overflow-hidden">
      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isArabic = startsWithArabic(m.content);

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#fceda2]/20 via-[#d4af37]/25 to-[#9a7b20]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5 shadow">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                dir={isArabic ? 'rtl' : 'ltr'}
                className={`max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed transition-all ${
                  isArabic ? 'text-right font-arabic' : 'text-left font-sans'
                } ${
                  isUser
                    ? 'bg-[#181d2c] text-white border border-[#2b354e] rounded-br-none shadow-md'
                    : 'bg-[#10131d] text-zinc-200 border border-[#1f2434] rounded-bl-none shadow-lg'
                }`}
              >
                {renderRichMarkdown(m.content)}

                <div
                  dir="ltr"
                  className={`text-[9.5px] mt-2 font-mono ${
                    isUser ? 'text-zinc-400 text-right' : 'text-zinc-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="p-3 rounded-2xl bg-[#10131d] border border-[#1f2434] text-xs text-zinc-400 flex items-center space-x-2 shadow">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
              <span>Querying Sanity Content Lake via MCP & synthesizing grounded exegesis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with Dynamic RTL / LTR Direction */}
      <div className="p-3 sm:p-4 border-t border-[#1f2434] bg-[#0c0e15]/90 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            dir={isInputArabic ? 'rtl' : 'ltr'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isInputArabic
                ? 'اكتب سؤالك عن الآية أو المفسرين...'
                : 'Ask about classical scholarly opinions, divergences, or verses (Arabic / English)...'
            }
            disabled={isLoading}
            className={`w-full bg-[#121520] text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 border border-[#23293a] focus:outline-none focus:border-[#d4af37]/60 transition-colors shadow-inner ${
              isInputArabic ? 'pr-4 pl-12 text-right font-arabic' : 'pl-4 pr-12 text-left font-sans'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute p-1.5 sm:p-2 rounded-lg bg-[#d4af37] hover:bg-[#c4a02f] disabled:bg-zinc-800 text-black disabled:text-zinc-500 transition-colors shadow ${
              isInputArabic ? 'left-2' : 'right-2'
            }`}
            title="Send query"
          >
            <Send className={`w-3.5 h-3.5 ${isInputArabic ? 'rotate-180' : ''}`} />
          </button>
        </form>
      </div>
    </div>
  );
};
