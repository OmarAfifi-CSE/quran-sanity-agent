'use client';

import React from 'react';
import { DivergenceGroup } from '@/lib/types';
import { Scale, CheckCircle2, AlertCircle, ArrowLeftRight, BookOpen, Quote } from 'lucide-react';

interface DivergenceMatrixProps {
  groups: DivergenceGroup[];
  onSelectCitation?: (docId: string) => void;
}

export const DivergenceMatrix: React.FC<DivergenceMatrixProps> = ({
  groups,
  onSelectCitation,
}) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <Scale className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-600 animate-pulse" />
        <p className="text-sm font-medium text-zinc-400">
          No Divergence Analysis Active
        </p>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Select a judge preset query above or ask a question to surface side-by-side classical claims.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {groups.map((group, groupIdx) => {
        const isContradictory = group.divergenceType === 'contradictory';
        const isComplementary = group.divergenceType === 'complementary';

        return (
          <div
            key={groupIdx}
            className="rounded-2xl bg-[#131622] border border-[#262c3e] overflow-hidden shadow-xl"
          >
            {/* Group Header */}
            <div className="bg-[#181b29] px-4 py-3 border-b border-[#262c3e] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#d4af37]" />
                <span className="text-xs font-bold text-white tracking-wide">
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
              } divide-y md:divide-y-0 md:divide-x divide-[#262c3e]`}
            >
              {group.claims.map((claim) => (
                <div
                  key={claim._id}
                  className="p-4 flex flex-col justify-between hover:bg-[#161a29]/50 transition-colors"
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

                      <span className="text-[9.5px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
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
                      <div className="mb-3 p-2.5 rounded-xl bg-[#0d0f17] border border-[#1f2434] relative">
                        <Quote className="w-3 h-3 text-[#d4af37]/40 absolute top-2 left-2" />
                        <p className="font-arabic text-xs text-zinc-300 leading-loose text-right dir-rtl pl-4">
                          {claim.opinionArabic}
                        </p>
                      </div>
                    )}

                    {/* Deductive Evidence */}
                    <div className="text-[11px] text-zinc-400 bg-[#161926]/70 p-2.5 rounded-lg border border-[#212638]">
                      <span className="font-semibold text-zinc-300">Evidence: </span>
                      <span>{claim.evidenceEnglish}</span>
                    </div>
                  </div>

                  {/* Document ID Tag */}
                  <div className="mt-3 pt-2.5 border-t border-[#1f2434] flex items-center justify-between">
                    <button
                      onClick={() => onSelectCitation?.(claim._id)}
                      className="font-mono text-[10px] text-zinc-400 hover:text-[#d4af37] transition-colors flex items-center space-x-1"
                    >
                      <span>Sanity Doc:</span>
                      <span className="text-zinc-300 underline underline-offset-2">
                        {claim._id}
                      </span>
                    </button>
                    <span className="text-[10px] text-zinc-500">
                      v. {claim.ayah?.ayahNumber}
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
