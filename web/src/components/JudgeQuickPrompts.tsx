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
      titleEnglish: 'Basmalah in Al-Fatiha',
      titleArabic: 'البسملة في الفاتحة',
      badge: 'Contradictory / اختلاف تضاد',
      badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      icon: BookOpen,
      surahNumber: 1,
      query:
        'Does Surah Al-Fatiha include the Basmalah as Verse 1? Compare the positions and evidence of Ibn Kathir versus Al-Qurtubi.',
    },
    {
      id: 'asr-scope',
      titleEnglish: "'Al-Asr' Semantic Scope",
      titleArabic: 'دلالة العصر',
      badge: 'Complementary / اختلاف تنوع',
      badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: Compass,
      surahNumber: 103,
      query:
        "What is the semantic scope of 'Al-Asr' in Surah 103? Break down scholarly interpretations (Epoch of Time vs Asr Prayer).",
    },
    {
      id: 'kursi-consensus',
      titleEnglish: 'Ayah al-Kursi (Attributes)',
      titleArabic: 'آية الكرسي',
      badge: 'Consensus / إجماع',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      icon: Award,
      surahNumber: 2,
      query:
        'Show the scholarly consensus regarding the divine attributes Al-Hayy and Al-Qayyum in Ayah al-Kursi (2:255).',
    },
    {
      id: 'unindexed-test',
      titleEnglish: 'Refusal Policy Test',
      titleArabic: 'فحص الأمان',
      badge: 'Anti-Hallucination / منع الهلوسة',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
      icon: ShieldAlert,
      surahNumber: 18,
      query:
        'What is the tafsir of the opening verses of Surah Al-Kahf?',
    },
  ];

  return (
    <div className="bg-[#0e1017] border-b border-[#202534] px-4 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Leading Prompt Label */}
        <div className="flex items-center space-x-1.5 shrink-0 pr-1 text-zinc-400">
          <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider hidden md:inline">
            Evaluator Presets:
          </span>
        </div>

        {/* Compact Horizontal Quick-Pill Carousels */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {prompts.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPrompt(p.query, p.surahNumber)}
                disabled={isLoading}
                className="group shrink-0 inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1c2234] border border-[#252c3e] hover:border-[#d4af37]/50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-left"
                title={p.query}
              >
                <Icon className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors whitespace-nowrap">
                  {p.titleEnglish}
                </span>
                <span className="text-[10px] font-arabic text-[#d4af37]/70 hidden sm:inline">
                  ({p.titleArabic})
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md border whitespace-nowrap ${p.badgeColor}`}
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
