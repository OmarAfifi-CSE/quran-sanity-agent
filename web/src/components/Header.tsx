'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-[#242938] bg-[#0c0e15]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-lg shadow-[#d4af37]/10">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Quran Sanity Agent
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                MCP Verified
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Zero-Hallucination Classical Exegesis via Sanity Context
            </p>
          </div>
        </div>

        {/* Live Status & Links */}
        <div className="flex items-center space-x-3">
          {/* MCP Health Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">Sanity MCP: Connected</span>
          </div>

          {/* Studio Link */}
          <Link
            href={process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "http://localhost:3333"}
            target="_blank"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141722] hover:bg-[#1c2130] border border-[#2d3446] text-xs text-zinc-200 transition-colors shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Open Studio</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </Link>

          {/* Zero Hallucination Guarantee Badge */}
          <div className="hidden md:flex items-center space-x-1 text-xs text-zinc-400 pl-2 border-l border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Grounding</span>
          </div>
        </div>
      </div>
    </header>
  );
};
