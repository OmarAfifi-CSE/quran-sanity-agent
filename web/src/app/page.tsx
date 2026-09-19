'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { JudgeQuickPrompts } from '@/components/JudgeQuickPrompts';
import { ChatStream, ChatMessage } from '@/components/ChatStream';
import { DivergenceMatrix } from '@/components/DivergenceMatrix';
import { GroundingInspector } from '@/components/GroundingInspector';
import { DivergenceGroup, GroundingSourceCitation } from '@/lib/types';
import { Scale, FileJson, Sparkles } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Welcome to the **Quran Sanity Agent** — a research-grade exegesis intelligence powered by **Sanity Context** and the **Model Context Protocol (MCP)**.

Classical exegesis is an archetype of knowledge where **hallucination is intolerable**. When classical authorities diverge (such as the status of the Basmalah in Al-Fatiha between Shafi'i and Maliki jurists), traditional vector search conflates their views. Here, our relational Sanity schema surfaces their claims **side by side with explicit source citations**.

Click one of the **Judge Presets** above or ask any question to inspect live grounded results.`,
      timestamp: 'Just now',
    },
  ]);

  const [divergenceGroups, setDivergenceGroups] = useState<DivergenceGroup[]>([]);
  const [citations, setCitations] = useState<GroundingSourceCitation[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
  const [activeRightTab, setActiveRightTab] = useState<'divergence' | 'inspector'>('divergence');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (userText: string, surahNumber?: number) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          surahNumber,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.divergenceGroups && data.divergenceGroups.length > 0) {
        setDivergenceGroups(data.divergenceGroups);
        setActiveRightTab('divergence');
      }

      if (data.citations && data.citations.length > 0) {
        setCitations(data.citations);
      }
    } catch (err: unknown) {
      console.error('[Chat Error]:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `An error occurred while querying the Sanity Context MCP endpoint: ${errorMessage}`,
          timestamp: 'Error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCitation = (docId: string) => {
    setSelectedDocId(docId);
    setActiveRightTab('inspector');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090a0f]">
      {/* 1. Top Global Navigation */}
      <Header />

      {/* 2. One-Click Judge Presets */}
      <JudgeQuickPrompts
        onSelectPrompt={handleSendMessage}
        isLoading={isLoading}
      />

      {/* 3. Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Conversational Stream */}
        <div className="w-full lg:w-1/2 h-full flex flex-col border-r border-[#242938]">
          <ChatStream
            messages={messages}
            isLoading={isLoading}
            onSendMessage={(text) => handleSendMessage(text)}
            onSelectCitation={handleSelectCitation}
          />
        </div>

        {/* Right Column: Grounding & Divergence Workspace */}
        <div className="w-full lg:w-1/2 h-full flex flex-col bg-[#0e1017]">
          {/* Right Pane Tab Navigation */}
          <div className="px-4 py-2 bg-[#12141e] border-b border-[#242938] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveRightTab('divergence')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeRightTab === 'divergence'
                    ? 'bg-[#1e2334] text-[#d4af37] border border-[#d4af37]/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161a28]'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Scholarly Divergence Matrix</span>
                {divergenceGroups.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] ml-1" />
                )}
              </button>

              <button
                onClick={() => setActiveRightTab('inspector')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeRightTab === 'inspector'
                    ? 'bg-[#1e2334] text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161a28]'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Sanity Grounding Lake</span>
                {citations.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 ml-1">
                    {citations.length}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-zinc-400">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>Real-Time Model Context Protocol</span>
            </div>
          </div>

          {/* Right Pane Active View */}
          <div className="flex-1 overflow-y-auto">
            {activeRightTab === 'divergence' ? (
              <DivergenceMatrix
                groups={divergenceGroups}
                onSelectCitation={handleSelectCitation}
              />
            ) : (
              <GroundingInspector
                citations={citations}
                selectedDocId={selectedDocId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
