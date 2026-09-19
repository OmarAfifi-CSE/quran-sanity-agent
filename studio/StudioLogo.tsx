import React from 'react';

export function StudioLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px' }}>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: '#065f46',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: '13px',
            letterSpacing: '0.04em',
            color: '#065f46',
            lineHeight: 1.1,
          }}
        >
          QURAN SANITY
        </span>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#64748b',
          }}
        >
          Knowledge Lake
        </span>
      </div>
    </div>
  );
}
