# 📖 Quran Sanity Agent

> **Zero-Hallucination Quranic Exegesis Intelligence & Scholarly Divergence Studio**  
> *Built for the [Sanity Challenge: Path One (Ship an Agent That Queries Real Content)](https://dev.to/challenges/sanity-2026-09-16)*

[![Next.js 15](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![Sanity Studio v3](https://img.shields.io/badge/Sanity-Studio%20v3-F03E2F?logo=sanity)](https://www.sanity.io/)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP-blue)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview: The "Cannot Afford to Get Wrong" Imperative

In traditional LLMs and standard vector search (RAG), religious and classical legal texts represent an archetype where **hallucination is catastrophic**:
- Models conflate distinct classical legal methodologies (e.g. attributing Shafi'i textual deductions to Maliki jurists).
- Keyword search fails to distinguish between **Consensus (*Ijma'*)**, **Complementary Diversity (*Ikhtilaf Tanawwu'*)**, and **Contradictory Variance (*Ikhtilaf Tadadd*)**.

**Quran Sanity Agent** solves this through **Sanity Context** and the **Model Context Protocol (MCP)**:
1. Every Surah, Ayah, classical authority, and exegetical assertion is modeled as an atomic JSON document in the **Sanity Content Lake**.
2. The agent queries Sanity Context through MCP, fetching structured evidence with explicit source citations.
3. Divergences are detected and presented **side by side with their primary sources**.
4. The user can inspect the live Sanity JSON documents directly inside the interactive **Grounding Inspector**.

---

## 🏛️ System Architecture

```
                 +---------------------------------------+
                 |       Browser (Judge / Evaluator)     |
                 |  One-Click Presets & Split Workspace  |
                 +---------------------------------------+
                                     |
                                     v
                 +---------------------------------------+
                 |   Next.js 15 App (/api/chat Route)    |
                 |     Zero-Hallucination System Gate    |
                 +---------------------------------------+
                                     |
                          Model Context Protocol (MCP)
                                     v
                 +---------------------------------------+
                 |       Sanity Context MCP Bridge       |
                 +---------------------------------------+
                                     |
                              GROQ Queries
                                     v
                 +---------------------------------------+
                 |          Sanity Content Lake          |
                 |  - surahType                          |
                 |  - ayahType                           |
                 |  - tafsirSourceType                   |
                 |  - interpretiveClaimType              |
                 +---------------------------------------+
```

---

## 🎯 Key Capabilities

- ⚡ **One-Click Evaluator Presets:** Instant evaluation for judges without typing.
- ⚖️ **Scholarly Divergence Matrix:** Contrasting opinions (e.g., *Ibn Kathir* vs *Al-Qurtubi* on the Basmalah) displayed side by side.
- 🔍 **Live Sanity Grounding Inspector:** Direct inspection of the raw JSON documents backing each claim, with active Document IDs and Studio editing links.
- 🛡️ **Zero-Hallucination Fallback:** Queries outside the indexed Sanity Lake are explicitly refused rather than fabricated.
- 🎨 **Embedded Sanity Studio:** Live content management studio mounted natively at `/studio`.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/OmarAfifi-CSE/quran-sanity-agent.git
cd quran-sanity-agent
npm install
```

### 2. Environment Variables (Optional)
Copy `.env.example` to `.env.local`:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
```
*(Note: The project includes a fully verified, zero-dependency local seed engine. It runs out of the box even without API keys!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the research interface, or [http://localhost:3000/studio](http://localhost:3000/studio) for the embedded Sanity Studio.

### 4. Run Automated Verification Tests
```bash
npx tsx scripts/test-verification.ts
```

---

## 📜 License
MIT License. Open source and open to the world.
