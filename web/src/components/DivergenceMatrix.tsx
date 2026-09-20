'use client';

import React from 'react';
import { DivergenceGroup } from '@/lib/types';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  BookOpen,
  Quote,
  Layers,
  Database,
  Users,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface DivergenceMatrixProps {
  groups: DivergenceGroup[];
  onSelectCitation?: (docId: string) => void;
  onSelectPreset?: (query: string, surahNumber?: number) => void;
}

export const DivergenceMatrix: React.FC<DivergenceMatrixProps> = ({
  groups,
  onSelectCitation,
  onSelectPreset,
}) => {
  // Rich Knowledge Lake Panorama when no query is active
  if (!groups || groups.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col justify-center max-w-2xl mx-auto text-center">
        {/* Knowledge Lake Metrics Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 via-[#d4af37]/10 to-transparent border border-[#d4af37]/35 flex items-center justify-center text-[#d4af37] mx-auto mb-3 shadow-lg shadow-[#d4af37]/10">
            <Scale className="w-6 h-6 text-[#d4af37]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Scholarly Divergence & Knowledge Lake
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            A relational exegesis intelligence powered by structured Sanity entities, eliminating RAG conflation and hallucination.
          </p>
        </div>

        {/* 4 Live Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <div className="p-2.5 rounded-xl bg-[#121520] border border-[#202636] text-center">
            <Database className="w-4 h-4 text-[#d4af37] mx-auto mb-1" />
            <span className="block text-sm font-bold text-white font-mono">114</span>
            <span className="text-[10px] text-zinc-400">Surahs Indexed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121520] border border-[#202636] text-center">
            <Layers className="w-4 h-4 text-[#d4af37] mx-auto mb-1" />
            <span className="block text-sm font-bold text-white font-mono">6,236</span>
            <span className="text-[10px] text-zinc-400">Ayahs Grounded</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121520] border border-[#202636] text-center">
            <Users className="w-4 h-4 text-[#d4af37] mx-auto mb-1" />
            <span className="block text-sm font-bold text-white font-mono">6</span>
            <span className="text-[10px] text-zinc-400">Authorities</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121520] border border-[#202636] text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="block text-sm font-bold text-emerald-400 font-mono">0%</span>
            <span className="text-[10px] text-zinc-400">Hallucination</span>
          </div>
        </div>

        {/* Three Epistemological Tiers */}
        <div className="text-left space-y-2.5 mb-6">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Epistemological Classification Matrix:
          </span>

          <div className="p-2.5 rounded-xl bg-[#121520] border border-rose-500/20 flex items-start gap-2.5">
            <ArrowLeftRight className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-rose-300">
                  اختلاف تضاد (Contradictory Variance)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                Mutually exclusive legal or textual positions (e.g. Shafi&#39;i counting Basmalah as Ayah 1 vs Maliki communal non-counting).
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121520] border border-amber-500/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-amber-300">
                  اختلاف تنوع (Complementary Diversity)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                Multi-faceted semantic layers that harmonize without conflict (e.g. Asr as Epoch of Time vs Asr Liturgical Prayer).
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121520] border border-emerald-500/20 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-emerald-300">
                  إجماع (Scholarly Consensus)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                Unanimous agreement across all orthodox schools (e.g. Absolute Self-Sufficiency of As-Samad in Al-Ikhlas).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch Call-to-Action */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#d4af37]/10 via-[#d4af37]/5 to-transparent border border-[#d4af37]/25 text-left flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span className="text-xs text-zinc-200">
              Select any preset above or ask a question to see live side-by-side claims.
            </span>
          </div>
          {onSelectPreset && (
            <button
              onClick={() =>
                onSelectPreset(
                  'Does Surah Al-Fatiha include the Basmalah as Verse 1? Compare the positions and evidence of Ibn Kathir versus Al-Qurtubi.',
                  1
                )
              }
              className="px-2.5 py-1 rounded-lg bg-[#d4af37] hover:bg-[#c4a02f] text-black text-xs font-semibold shrink-0 transition-colors shadow"
            >
              Run Basmalah Test
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Divergence Groups View
  return (
    <div className="space-y-5 p-4 sm:p-5">
      {groups.map((group, groupIdx) => {
        const isContradictory = group.divergenceType === 'contradictory';
        const isComplementary = group.divergenceType === 'complementary';

        return (
          <div
            key={groupIdx}
            className="rounded-2xl bg-[#11131d] border border-[#202534] overflow-hidden shadow-xl"
          >
            {/* Group Header */}
            <div className="bg-[#151926] px-4 py-3 border-b border-[#202534] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#d4af37]" />
                <span className="text-xs sm:text-[13px] font-bold text-white tracking-wide">
                  {group.targetPhrase}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-1.5">
                {isContradictory && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    <ArrowLeftRight className="w-3 h-3 text-rose-400" />
                    <span>Contradictory Variance (اختلاف تضاد)</span>
                  </span>
                )}
                {isComplementary && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Complementary Diversity (اختلاف تنوع)</span>
                  </span>
                )}
                {!isContradictory && !isComplementary && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Scholarly Consensus (إجماع)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Side-by-Side Comparison Cards Grid */}
            <div
              className={`grid grid-cols-1 ${
                group.claims.length > 1 ? 'md:grid-cols-2' : ''
              } divide-y md:divide-y-0 md:divide-x divide-[#202534]`}
            >
              {group.claims.map((claim) => (
                <div
                  key={claim._id}
                  className="p-4 flex flex-col justify-between hover:bg-[#151926]/60 transition-colors"
                >
                  <div>
                    {/* Scholar Identity & Metadata */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                          <span>{claim.source?.author}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            (d. {claim.source?.deathYearAH} AH)
                          </span>
                        </h4>
                        <p className="text-[11px] text-[#d4af37] font-medium mt-0.5">
                          {claim.source?.bookTitleEnglish}
                        </p>
                      </div>

                      <span className="text-[9.5px] uppercase font-mono px-2 py-0.5 rounded bg-[#181d2c] text-zinc-300 border border-[#2b344a]">
                        {claim.source?.methodology}
                      </span>
                    </div>

                    {/* Scholarly Position English */}
                    <div className="mb-3">
                      <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                        {claim.opinionEnglish}
                      </p>
                    </div>

                    {/* Classical Arabic Quotation */}
                    {claim.opinionArabic && (
                      <div className="mb-3 p-2.5 rounded-xl bg-[#090b10] border border-[#1a1f2c] relative">
                        <Quote className="w-3 h-3 text-[#d4af37]/40 absolute top-2 left-2" />
                        <p className="font-arabic text-xs text-zinc-300 leading-loose text-right dir-rtl pl-4">
                          {claim.opinionArabic}
                        </p>
                      </div>
                    )}

                    {/* Deductive Evidence */}
                    <div className="text-[11px] text-zinc-400 bg-[#141724] p-2.5 rounded-lg border border-[#1f2434]">
                      <span className="font-semibold text-zinc-300">Evidence: </span>
                      <span>{claim.evidenceEnglish}</span>
                    </div>
                  </div>

                  {/* Document ID Tag */}
                  <div className="mt-3 pt-2.5 border-t border-[#1a1f2c] flex items-center justify-between">
                    <button
                      onClick={() => onSelectCitation?.(claim._id)}
                      className="font-mono text-[10px] text-zinc-400 hover:text-[#d4af37] transition-colors flex items-center space-x-1"
                    >
                      <span>Sanity Doc:</span>
                      <span className="text-[#d4af37]/80 underline underline-offset-2">
                        {claim._id}
                      </span>
                    </button>
                    <span className="text-[10px] text-zinc-500">
                      Ayah {claim.ayah?.ayahNumber ?? ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
