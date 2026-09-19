'use client';

import React, { useState } from 'react';
import { GroundingSourceCitation } from '@/lib/types';
import { Code2, Copy, Check, ExternalLink, FileJson, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface GroundingInspectorProps {
  citations: GroundingSourceCitation[];
  selectedDocId?: string;
}

export const GroundingInspector: React.FC<GroundingInspectorProps> = ({
  citations,
  selectedDocId,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>(
    selectedDocId || citations[0]?.documentId || ''
  );

  const activeCitation =
    citations.find((c) => c.documentId === activeTabId) || citations[0];

  const handleCopy = (docId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!citations || citations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <FileJson className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-600 animate-pulse" />
        <p className="text-sm font-medium text-zinc-400">
          Sanity Grounding Lake Inactive
        </p>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Execute a query to inspect live structured JSON documents retrieved from the Sanity Content Lake.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] border-l border-[#242938]">
      {/* Inspector Header */}
      <div className="px-4 py-3 border-b border-[#242938] bg-[#121520] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-bold text-white tracking-wide">
            Sanity Grounding Inspector
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            {citations.length} Verified Docs
          </span>
        </div>

        {activeCitation && (
          <Link
            href={`${process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333'}/structure/interpretiveClaim;${activeCitation.documentId}`}
            target="_blank"
            className="text-[11px] text-zinc-400 hover:text-[#d4af37] flex items-center space-x-1 transition-colors"
          >
            <span>Edit in Studio</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Document Tabs */}
      <div className="flex items-center space-x-1 p-2 bg-[#10121a] border-b border-[#242938] overflow-x-auto">
        {citations.map((c) => (
          <button
            key={c.documentId}
            onClick={() => setActiveTabId(c.documentId)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTabId === c.documentId
                ? 'bg-[#1c2132] text-[#d4af37] border border-[#d4af37]/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161a28]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{c.documentId}</span>
          </button>
        ))}
      </div>

      {/* Document Detail & JSON Viewer */}
      {activeCitation && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Metadata Card */}
          <div className="p-3 rounded-xl bg-[#141724] border border-[#262c3e] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">
                {activeCitation.title}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Type: {activeCitation.documentType} | ID: {activeCitation.documentId}
              </p>
            </div>

            <button
              onClick={() =>
                handleCopy(
                  activeCitation.documentId,
                  JSON.stringify(activeCitation.rawJsonSnippet, null, 2)
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#1b2030] hover:bg-[#252b40] text-zinc-300 text-xs flex items-center space-x-1.5 border border-[#2d3448] transition-colors"
            >
              {copiedId === activeCitation.documentId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          {/* Raw JSON Code Block */}
          <div className="relative rounded-xl bg-[#090b10] border border-[#1e2333] p-3.5 font-mono text-[11px] leading-relaxed text-emerald-400/90 overflow-x-auto shadow-inner">
            <pre>
              {JSON.stringify(activeCitation.rawJsonSnippet, null, 2)}
            </pre>
          </div>

          {/* Grounding Verification Seal */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start space-x-2 text-xs text-emerald-400/90">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-normal">
              <strong>Grounding Guarantee:</strong> This atomic JSON record was verified directly from the Sanity Content Lake. The LLM is programmatically constrained to synthesize only from these fields.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
