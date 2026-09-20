'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-[#202534] bg-[#090a0f]/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Emblem & Titles */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fceda2]/20 via-[#d4af37]/25 to-[#9a7b20]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-sm shadow-[#d4af37]/20">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-sm font-bold text-white tracking-tight">
              Quran Sanity Agent
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 font-medium">
              MCP Verified
            </span>
          </div>
        </div>

        {/* Live System Status & Studio Deep Link */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* MCP Health Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10.5px]">Sanity MCP: Live</span>
          </div>

          {/* Zero Hallucination Guarantee */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#131622] border border-[#262c3e] text-[11px] text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="font-medium">Strict Grounding</span>
          </div>

          {/* Open Studio Button */}
          <Link
            href={process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333'}
            target="_blank"
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#141724] hover:bg-[#1d2234] border border-[#2a3144] text-xs font-medium text-zinc-200 transition-all shadow-sm group"
          >
            <Database className="w-3 h-3 text-[#d4af37] group-hover:rotate-6 transition-transform" />
            <span>Studio</span>
            <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
          </Link>
        </div>
      </div>
    </header>
  );
};
