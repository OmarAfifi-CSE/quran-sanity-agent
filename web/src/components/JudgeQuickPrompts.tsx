'use client';

import React from 'react';
import { Zap, BookOpen, Compass, ShieldAlert, Award } from 'lucide-react';

interface JudgeQuickPromptsProps {
  onSelectPrompt: (promptText: string, surahNumber?: number) => void;
  isLoading: boolean;
}

export const JudgeQuickPrompts: React.FC<JudgeQuickPromptsProps> = ({
  onSelectPrompt,
  isLoading,
}) => {
  const prompts = [
    {
      id: 'fatiha-basmalah',
      title: 'Basmalah in Al-Fatiha',
      badge: 'Contradictory / Ikhtilaf Tadadd',
      badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      icon: BookOpen,
      surahNumber: 1,
      query:
        'Does Surah Al-Fatiha include the Basmalah as Verse 1? Compare the positions and evidence of Ibn Kathir versus Al-Qurtubi.',
      description: 'Side-by-side surface of direct contradictory legal and textual claims.',
    },
    {
      id: 'asr-scope',
      title: "'Al-Asr' Semantic Scope",
      badge: 'Complementary / Ikhtilaf Tanawwu',
      badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: Compass,
      surahNumber: 103,
      query:
        "What is the semantic scope of 'Al-Asr' in Surah 103? Break down scholarly interpretations (Epoch of Time vs Asr Prayer).",
      description: 'Enriching perspectives where classical stances complement each other.',
    },
    {
      id: 'kursi-consensus',
      title: 'Ayah al-Kursi Attributes',
      badge: 'Consensus / Ijma',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      icon: Award,
      surahNumber: 2,
      query:
        'Show the scholarly consensus regarding the divine attributes Al-Hayy and Al-Qayyum in Ayah al-Kursi (2:255).',
      description: 'Granular semantic extraction with unanimous classical consensus.',
    },
    {
      id: 'unindexed-test',
      title: 'Zero-Hallucination Fallback Test',
      badge: 'Safety / Anti-Hallucination',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
      icon: ShieldAlert,
      surahNumber: 18,
      query:
        'What is the tafsir of the opening verses of Surah Al-Kahf?',
      description: 'Tests strict refusal policy when a query is outside the indexed Sanity Lake.',
    },
  ];

  return (
    <div className="bg-[#11131c] border-b border-[#242938] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            Judge & Evaluator One-Click Presets:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {prompts.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPrompt(p.query, p.surahNumber)}
                disabled={isLoading}
                className="group text-left p-2.5 rounded-xl bg-[#151824] hover:bg-[#1c2132] border border-[#262c3e] hover:border-[#d4af37]/50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white group-hover:text-[#d4af37] transition-colors flex items-center space-x-1.5">
                      <Icon className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{p.title}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2 mb-2">
                    {p.description}
                  </p>
                </div>

                <span
                  className={`text-[9.5px] font-mono px-2 py-0.5 rounded-md border self-start ${p.badgeColor}`}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
