"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  Database,
  FileText,
  Globe2,
  Layers3,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { GroundingSourceCitation, ResearchAnswer } from "@/lib/types";

type Turn = {
  id: string;
  question: string;
  answer?: ResearchAnswer;
  error?: string;
};
type Health = {
  origin: "sanity" | "local";
  surahs: number;
  ayahs: number;
  claims: number;
  usableClaims: number;
  sourceCheckedClaims: number;
  specialistReviewedClaims: number;
  contextConfigured: boolean;
  library?: {
    entries: number;
    editions: {
      edition: string;
      entries: number;
      title?: string;
      language?: string;
    }[];
  } | null;
};
const examples = [
  {
    icon: BookOpen,
    label: ["Read a verse", "اقرأ آية"],
    question: ["Show me Ayat al-Kursi (2:255)", "اعرض آية الكرسي ٢:٢٥٥"],
    tag: "02:255",
  },
  {
    icon: Search,
    label: ["Explore a chapter", "تعرّف على سورة"],
    question: ["How many verses are in Al-Kahf?", "كم عدد آيات سورة الكهف؟"],
    tag: "18",
  },
  {
    icon: Layers3,
    label: ["Examine interpretations", "راجع التفسيرات"],
    question: ["Compare interpretations of Al-Asr", "قارن تفسيرات سورة العصر"],
    tag: "103:1",
  },
];

function RichText({
  text,
  onCitation,
  citations = [],
}: {
  text: string;
  onCitation: (id: string) => void;
  citations?: GroundingSourceCitation[];
}) {
  return (
    <div className="answer-prose">
      {text.split("\n\n").map((paragraph, i) => {
        const arabic = /^[^a-zA-Z\u0600-\u06ff]*[\u0600-\u06ff]/.test(
          paragraph,
        );
        return (
          <p
            key={i}
            dir="auto"
            className={arabic ? "arabic-passage" : undefined}
          >
            {paragraph
              .split(/(\[Sanity:\s*[\w.-]+\]|\*\*[^*]+\*\*|_[^_]+_)/g)
              .map((part, j) => {
                const citation = part.match(/^\[Sanity:\s*([\w.-]+)\]$/);
                if (citation)
                  return (
                    <button
                      key={j}
                      className="citation"
                      onClick={() => onCitation(citation[1])}
                      aria-label={`Inspect source ${citations.find(c=>c.documentId===citation[1])?.title || citation[1]}`}
                    >
                      <FileText size={12} />
                      {String(citations.find(c=>c.documentId===citation[1])?.rawJsonSnippet.verseKey || citation[1]
                        .replace("ayah-", "")
                        .replace("surah-", "Chapter ")
                        .replaceAll("-", ":"))}
                      <ArrowUpRight size={11} />
                    </button>
                  );
                if (part.startsWith("**"))
                  return <strong key={j}>{part.slice(2, -2)}</strong>;
                if (part.startsWith("_") && part.endsWith("_"))
                  return <em key={j}>{part.slice(1, -1)}</em>;
                return <span key={j}>{part}</span>;
              })}
          </p>
        );
      })}
    </div>
  );
}

export function ResearchWorkspace() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const ar = lang === "ar";
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [panel, setPanel] = useState<{
    answer: ResearchAnswer;
    selected?: string;
  } | null>(null);
  const [about, setAbout] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/health", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setHealth)
      .catch((e) => {
        if (e.name !== "AbortError") setHealthError(true);
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? "rtl" : "ltr";
  }, [lang, ar]);
  useEffect(() => {
    if (turns.length)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, loading]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!panel && !about) return;
    previousFocus.current = document.activeElement as HTMLElement;
    drawerRef.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        setAbout(false);
      }
      if (event.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, a[href], summary, [tabindex="0"]',
        );
        if (!focusable?.length) return;
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === drawerRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previousFocus.current?.focus();
    };
  }, [panel, about]);

  async function send(question: string) {
    if (busy.current || !question.trim()) return;
    busy.current = true;
    setLoading(true);
    setInput("");
    setPanel(null);
    const id = crypto.randomUUID();
    setTurns((prev) => [...prev, { id, question: question.trim() }]);
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 55000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
        signal: abort.signal,
      });
      const answer = await response.json();
      if (!response.ok) throw new Error(answer.error || "Request failed");
      setTurns((prev) =>
        prev.map((turn) => (turn.id === id ? { ...turn, answer } : turn)),
      );
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? t(
              "The request was stopped. You can try again.",
              "تم إيقاف الطلب. يمكنك المحاولة مجددًا.",
            )
          : t(
              "Could not reach the research service. Please retry.",
              "تعذر الاتصال بخدمة البحث. حاول مجددًا.",
            );
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === id ? { ...turn, error: message } : turn,
        ),
      );
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      setLoading(false);
      controller.current = null;
      inputRef.current?.focus();
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }
  async function copy(turn: Turn) {
    try {
      await navigator.clipboard.writeText(
        `${turn.question}\n\n${turn.answer?.researchNotes ? turn.answer.researchNotes.points.map(p=>`${p.text}\n${p.evidence.map(e=>`${e.quote}\n${turn.answer!.citations.find(c=>c.documentId===e.documentId)?.title || e.documentId}`).join('\n')}`).join('\n\n') : turn.answer?.text || ""}`,
      );
      setCopied(turn.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("failed");
    }
  }
  function inspect(answer: ResearchAnswer, selected?: string) {
    setAbout(false);
    setPanel({ answer, selected });
  }
  const activeCitation: GroundingSourceCitation | undefined =
    panel?.answer.citations.find((c) => c.documentId === panel.selected) ||
    panel?.answer.citations[0];

  return (
    <div className="workspace">
      <a className="skip-link" href="#question">
        {t("Skip to question", "انتقل إلى السؤال")}
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Quran Sanity Agent home">
          <span className="brand-icon">
            <BookOpen size={23} />
          </span>
          <span>
            Quran<span className="brand-sub">SANITY AGENT</span>
          </span>
        </Link>
        <button
          className="new-research"
          disabled={loading}
          onClick={() => {
            setTurns([]);
            setPanel(null);
            inputRef.current?.focus();
          }}
        >
          <Plus size={17} />
          {t("New research", "بحث جديد")}
          <span>↗</span>
        </button>
        <div className="sidebar-label">{t("WORKSPACE", "مساحة البحث")}</div>
        <button
          className="nav-item active"
          onClick={() => inputRef.current?.focus()}
        >
          <Search size={17} />
          {t("Ask the Quran", "اسأل عن القرآن")}
          <span className="active-dot" />
        </button>
        <button
          className="nav-item"
          onClick={() => {
            setPanel(null);
            setAbout(true);
          }}
        >
          <Database size={17} />
          {t("Library & sources", "المكتبة والمصادر")}
          <ArrowUpRight size={14} />
        </button>
        {turns.length > 0 && (
          <div className="recent">
            <div className="sidebar-label">
              {t("THIS SESSION", "هذه الجلسة")}
            </div>
            {turns
              .slice(-5)
              .reverse()
              .map((turn) => (
                <button
                  key={turn.id}
                  onClick={() =>
                    document
                      .getElementById(turn.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <FileText size={14} />
                  <span dir="auto">{turn.question}</span>
                </button>
              ))}
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="source-status">
            <span className={`status-dot ${healthError ? "offline" : ""}`} />
            {health
              ? health.origin === "sanity"
                ? t("Connected to Sanity", "متصل بـ Sanity")
                : t("Local library", "مكتبة محلية")
              : healthError
                ? t("Connection unavailable", "الاتصال غير متاح")
                : t("Checking library…", "جارٍ فحص المكتبة…")}
          </div>
          <p>
            {t("Every answer starts with a source.", "كل إجابة تبدأ بمصدر.")}
          </p>
          <button
            className="quiet-button"
            onClick={() => {
              setPanel(null);
              setAbout(true);
            }}
          >
            <CircleHelp size={15} />
            {t("How it works", "كيف يعمل")}
            <ArrowUpRight size={13} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="mobile-brand">
              <BookOpen size={20} />
            </span>
            {t("Research workspace", "مساحة البحث")}
            <ChevronRight size={13} />
            <span>{t("Quran & interpretation", "القرآن والتفسير")}</span>
          </div>
          <div className="top-actions">
            <span className="edition">
              {t("A source-first reading experience", "قراءة تبدأ من المصدر")}
            </span>
            <button
              className="language-toggle"
              onClick={() => setLang(ar ? "en" : "ar")}
              aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe2 size={15} />
              {ar ? "English" : "العربية"}
            </button>
          </div>
        </header>
        <main
          id="main-content"
          className={turns.length ? "main-content has-turns" : "main-content"}
        >
          {turns.length === 0 ? (
            <div className="welcome">
              <div className="hero-emblem" aria-hidden="true">
                <div />
                <BookOpen size={33} strokeWidth={1.2} />
              </div>
              <div className="eyebrow">
                <span />
                {t("UNDERSTANDING, WITH EVIDENCE", "فهمٌ يستند إلى الدليل")}
              </div>
              <h1>
                {t("A deeper understanding.", "فهمٌ أعمق.")}
                <br />
                <span>
                  {t("A source for every answer.", "ومصدرٌ لكل إجابة.")}
                </span>
              </h1>
              <p className="hero-description">
                {t(
                  "Explore the Quran, trace an interpretation, and read the evidence.",
                  "استكشف القرآن، وتتبّع التفسير، واقرأ الدليل.",
                )}
                <br />
                {t("Ask in English or Arabic.", "اسأل بالعربية أو الإنجليزية.")}
              </p>
              <div className="example-grid">
                {examples.map((item, i) => (
                  <button
                    key={item.tag}
                    className="example-card"
                    onClick={() => void send(item.question[ar ? 1 : 0])}
                    disabled={loading}
                  >
                    <div className="example-top">
                      <item.icon size={18} strokeWidth={1.5} />
                      <span>0{i + 1}</span>
                    </div>
                    <span className="example-label">
                      {item.label[ar ? 1 : 0]}
                    </span>
                    <span className="example-question">
                      {item.question[ar ? 1 : 0]}
                    </span>
                    <ArrowUpRight className="example-arrow" size={16} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="conversation"
              aria-live="polite"
              aria-busy={loading}
            >
              <div className="session-heading">
                <span className="eyebrow">{t("YOUR RESEARCH", "بحثك")}</span>
                <button
                  className="quiet-button"
                  disabled={loading}
                  onClick={() => {
                    setTurns([]);
                    setPanel(null);
                  }}
                >
                  <Plus size={14} />
                  {t("Start fresh", "بحث جديد")}
                </button>
              </div>
              {turns.map((turn) => (
                <article className="research-turn" id={turn.id} key={turn.id}>
                  <div className="question-label">
                    {t("YOU ASKED", "سؤالك")}
                  </div>
                  <h2 dir="auto">{turn.question}</h2>
                  {turn.answer ? (
                    <div className="answer-card">
                      <div className="answer-heading">
                        <span className="answer-mark">
                          <BookOpen size={17} />
                        </span>
                        <strong>
                          {t("Quran Sanity Agent", "باحث القرآن")}
                        </strong>
                        <span
                          className={`answer-status ${turn.answer.status === "answered" ? "complete" : ""}`}
                        >
                          {turn.answer.status === "answered"
                            ? t("Source-backed", "مستند إلى المصدر")
                            : turn.answer.totalClaims > 0
                              ? t(
                                  "Source-checked extracts",
                                  "نقول مقارَنة بالمصدر",
                                )
                              : turn.answer.status === "clarify"
                                ? t(
                                    "A little more detail",
                                    "نحتاج تحديدًا أكثر",
                                  )
                                : t("Evidence limited", "أدلة محدودة")}
                        </span>
                      </div>
                      {turn.answer.researchNotes ? (
                        <div className="research-notes">
                          <p className="notes-label">{t('AI reading notes · quotes checked against sources', 'قراءة بمساعدة الذكاء الاصطناعي · اقتباسات مطابقة للمصادر')}</p>
                          {turn.answer.researchNotes.points.map((point,index)=>(
                            <section className="research-point" key={index}>
                              <p dir="auto">{point.text}</p>
                              <div className="point-sources">{point.evidence.map((e,i)=>{
                                const citation=turn.answer!.citations.find(c=>c.documentId===e.documentId)!;
                                return <button className="citation" key={i} onClick={()=>inspect(turn.answer!,e.documentId)} aria-label={t(`Inspect ${citation.title}`,`راجع ${citation.title}`)}><FileText size={12}/>{String(citation.rawJsonSnippet.verseKey || citation.title)}<ArrowUpRight size={12}/></button>;
                              })}</div>
                              <details className="supporting-quotes"><summary>{t('Read supporting excerpts','اقرأ النصوص الداعمة')}</summary>{point.evidence.map((e,i)=><blockquote dir="auto" key={i}>{e.quote}</blockquote>)}</details>
                            </section>
                          ))}
                          {turn.answer.researchNotes.gaps.length>0&&<p className="notes-gap" dir="auto">{turn.answer.researchNotes.gaps.join(' ')}</p>}
                          <p className="notes-label">{t('A source-linked reading, awaiting specialist review.','قراءة مرتبطة بالمصادر، وليست مراجعة من متخصص.')}</p>
                        </div>
                      ) : turn.answer.status==='limited'&&turn.answer.citations.length>0 ? (
                        <div className="evidence-preview">
                          <p>{t('Relevant source passages are available. A supported research summary is not available for this question yet.','توجد مقاطع من المصادر. لا تتوفر حاليًا خلاصة بحثية مدعومة لهذا السؤال.')}</p>
                          {turn.answer.citations.slice(0,4).map(c=><button key={c.documentId} onClick={()=>inspect(turn.answer!,c.documentId)}><BookOpen size={15}/><span>{c.title}</span><ArrowUpRight size={14}/></button>)}
                        </div>
                      ) : <RichText text={turn.answer.text} citations={turn.answer.citations} onCitation={(id)=>inspect(turn.answer!,id)}/>}
                      {turn.answer.status==='limited'&&turn.answer.citations.length>0&&<details className="retrieved-passages"><summary>{t('Read all retrieved passages','اقرأ كل المقاطع المسترجعة')}</summary><RichText text={turn.answer.text} citations={turn.answer.citations} onCitation={(id)=>inspect(turn.answer!,id)}/></details>}
                      {turn.answer.pendingReview > 0 && (
                        <div className="review-note">
                          <ShieldCheck size={15} />
                          {t(
                            `${turn.answer.pendingReview} commentary records await source review and were excluded.`,
                            `${turn.answer.pendingReview} سجلات تفسيرية تنتظر مراجعة المصادر ولم تُستخدم في الإجابة.`,
                          )}
                        </div>
                      )}
                      {turn.answer.divergenceGroups.length > 0 && (
                        <details className="comparison">
                          <summary>
                            {t(
                              "Compare recorded positions",
                              "قارن الأقوال المسجّلة",
                            )}
                          </summary>
                          {turn.answer.divergenceGroups.map((group) => (
                            <section key={group.targetPhrase}>
                              <h3 dir="auto">{group.targetPhrase}</h3>
                              <div className="comparison-grid">
                                {group.claims.map((claim) => (
                                  <div key={claim._id}>
                                    <strong>{claim.source.author}</strong>
                                    <p dir="auto">
                                      {ar
                                        ? claim.opinionArabic
                                        : claim.opinionEnglish}
                                    </p>
                                    <button
                                      onClick={() =>
                                        inspect(turn.answer!, claim._id)
                                      }
                                    >
                                      {t("Inspect source", "راجع المصدر")}
                                      <ArrowUpRight size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </section>
                          ))}
                        </details>
                      )}
                      <div className="answer-footer">
                        <button
                          className="sources-button"
                          onClick={() => inspect(turn.answer!)}
                        >
                          <Layers3 size={15} />
                          {turn.answer.citations.length}{" "}
                          {t(
                            turn.answer.citations.length === 1
                              ? "source"
                              : "sources",
                            turn.answer.citations.length === 1
                              ? "مصدر"
                              : "مصادر",
                          )}
                          <ArrowUpRight size={13} />
                        </button>
                        <span>
                          {turn.answer.origin === "sanity"
                            ? "Sanity Content Lake"
                            : t("Local library", "مكتبة محلية")}
                        </span>
                        <button
                          className="copy-button"
                          aria-label={t("Copy answer", "نسخ الإجابة")}
                          onClick={() => void copy(turn)}
                        >
                          {copied === turn.id ? (
                            <Check size={15} />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : turn.error ? (
                    <div className="error-card" role="alert">
                      <p>{turn.error}</p>
                      <button
                        onClick={() => void send(turn.question)}
                        disabled={loading}
                      >
                        {t("Try again", "حاول مجددًا")}
                      </button>
                    </div>
                  ) : (
                    <div className="loading-card" role="status">
                      <LoaderCircle className="spin" size={18} />
                      {t(
                        "Reading the source records…",
                        "جارٍ قراءة سجلات المصادر…",
                      )}
                      <button onClick={() => controller.current?.abort()}>
                        {t("Stop", "إيقاف")}
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {copied === "failed" && (
                <p role="status">
                  {t(
                    "Clipboard unavailable. Select the answer text to copy it.",
                    "النسخ غير متاح. يمكنك تحديد النص ونسخه.",
                  )}
                </p>
              )}
              <div ref={endRef} />
            </div>
          )}
          <div className="composer-area">
            <form className="composer" onSubmit={submit}>
              <label htmlFor="question" className="sr-only">
                {t("Your Quran question", "سؤالك عن القرآن")}
              </label>
              <textarea
                id="question"
                ref={inputRef}
                value={input}
                maxLength={2000}
                dir="auto"
                rows={2}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    if (!loading) void send(input);
                  }
                }}
                placeholder={t(
                  "What would you like to understand?",
                  "ما الذي تريد أن تفهمه؟",
                )}
                disabled={loading}
              />
              <div className="composer-bottom">
                <span>
                  <Sparkles size={13} />
                  {t(
                    "Ask a question or enter a verse · 2:255",
                    "اسأل أو اكتب مرجع آية · ٢:٢٥٥",
                  )}
                </span>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label={t("Send question", "إرسال السؤال")}
                >
                  {loading ? (
                    <LoaderCircle size={18} className="spin" />
                  ) : (
                    <ArrowUp size={20} />
                  )}
                </button>
              </div>
            </form>
            <p className="composer-note">
              <ShieldCheck size={13} />
              {t(
                "Sources are shown. Gaps are acknowledged. Interpretations require review.",
                "المصادر ظاهرة، وحدود المعرفة واضحة، والتفسير يحتاج مراجعة.",
              )}
            </p>
          </div>
          {turns.length === 0 && (
            <div className="library-strip">
              <div>
                <BookOpen size={15} />
                <strong>{health ? health.surahs.toLocaleString() : "—"}</strong>
                {t("chapters", "سورة")}
              </div>
              <span />
              <div>
                <FileText size={15} />
                <strong>{health ? health.ayahs.toLocaleString() : "—"}</strong>
                {t("verses in the library", "آية في المكتبة")}
              </div>
              <span />
              <button onClick={() => setAbout(true)}>
                {t("Explore the sources", "اطّلع على المصادر")}
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}
        </main>
        <footer className="page-footer">
          <span>QURAN SANITY AGENT</span>
          <nav aria-label={t('Site information','معلومات الموقع')}><a href="/privacy">{t('Privacy','الخصوصية')}</a><span> · </span><a href="/terms">{t('Sources & terms','المصادر والاستخدام')}</a></nav>
          <span>
            {t(
              "Built with structured content. Powered by Sanity.",
              "مبني على بيانات منظّمة. مدعوم بـ Sanity.",
            )}
          </span>
        </footer>
      </div>
      {(panel || about) && (
        <div
          className="drawer-backdrop"
          onClick={() => {
            setPanel(null);
            setAbout(false);
          }}
        >
          <aside
            className="evidence-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            ref={drawerRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <div className="eyebrow">
                  {t("BEHIND THE ANSWER", "وراء الإجابة")}
                </div>
                <h2 id="drawer-title">
                  {about
                    ? t("Library & sources", "المكتبة والمصادر")
                    : t("Follow the evidence", "تتبّع الدليل")}
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  setPanel(null);
                  setAbout(false);
                }}
                aria-label={t("Close sources", "إغلاق المصادر")}
              >
                <X size={20} />
              </button>
            </header>
            {about ? (
              <div className="about-content">
                <div className="about-icon">
                  <Database size={26} />
                </div>
                <h3>
                  {t("A library you can inspect.", "مكتبة يمكنك مراجعتها.")}
                </h3>
                <p>
                  {t(
                    "Verse text and chapter facts are read directly from structured records. Each citation opens the exact record used for that answer.",
                    "نصوص الآيات ومعلومات السور تُقرأ مباشرة من سجلات منظّمة. كل استشهاد يفتح السجل المستخدم في الإجابة.",
                  )}
                </p>
                <dl>
                  <div>
                    <dt>{t("Data connection", "اتصال البيانات")}</dt>
                    <dd>
                      {health?.origin === "sanity"
                        ? "Sanity Content Lake"
                        : health
                          ? "Local"
                          : "Unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {t(
                        "Source-checked commentary",
                        "تفسيرات مقارَنة بالمصدر",
                      )}
                    </dt>
                    <dd>
                      {health
                        ? `${health.usableClaims} / ${health.claims}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Context MCP</dt>
                    <dd>
                      {health?.contextConfigured
                        ? t(
                            "Configured; checked per query",
                            "مُعدّ؛ يُفحص عند الطلب",
                          )
                        : t("Not configured", "غير مُعدّ")}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {t(
                        "Imported library entries",
                        "مدخلات المكتبة المستوردة",
                      )}
                    </dt>
                    <dd>{health?.library?.entries.toLocaleString() || "—"}</dd>
                  </div>
                </dl>
                {health?.library && (
                  <details>
                    <summary>
                      {t("Browse source coverage", "تصفّح تغطية المصادر")}
                    </summary>
                    <p>
                      {t(
                        "Counts include overlapping source copies. They describe imported records, not unique verses or scholarly approvals. Research answers currently use Arabic and English commentary.",
                        "الأعداد تشمل نسخ مصادر متداخلة؛ وهي سجلات مستوردة وليست آيات فريدة أو اعتمادًا علميًا. إجابات البحث تستخدم حاليًا التفسير العربي والإنجليزي.",
                      )}
                    </p>
                    <dl>
                      {health.library.editions.map((source) => (
                        <div key={source.edition}>
                          <dt>
                            {source.title || source.edition} ({source.language})
                          </dt>
                          <dd>{source.entries.toLocaleString()}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
                <h3>
                  {t(
                    "What “source-backed” means",
                    "ماذا يعني الاستناد إلى المصدر؟",
                  )}
                </h3>
                <p>
                  {t(
                    "It means the displayed information comes from an inspectable record. It does not certify every record as correct. Commentary needs a source URL, a passage locator, an exact excerpt, and a recorded check. Automated checks are distinguished from specialist review.",
                    "يعني أن المعلومات المعروضة مصدرها سجل يمكن فحصه، وليس ضمانًا بصحة كل سجل. لا يُستخدم التفسير إلا مع رابط مصدر وموضع محدد ونص مقتبس وفحص مسجّل، مع توضيح الفرق بين الفحص الآلي ومراجعة المختص.",
                  )}
                </p>
                <p>
                  {t(
                    "English rendering: Saheeh International, Quran.com resource 20; all 6,236 stored passages were compared exactly. Translations convey meaning. Printed-edition details and reuse permissions are separate from text identity.",
                    "الترجمة الإنجليزية: صحيح إنترناشيونال، المورد 20 من Quran.com؛ قورنت النصوص المخزنة الـ6236 حرفيًا. الترجمة نقل للمعنى، وتفاصيل الطبعة الورقية وتصاريح الاستخدام منفصلة عن إثبات هوية النص.",
                  )}
                </p>
                <a href="https://tanzil.net" target="_blank" rel="noreferrer">
                  {t(
                    "Quran text reference: Tanzil",
                    "مرجع النص القرآني: تنزيل",
                  )}
                  <ArrowUpRight size={14} />
                </a>
              </div>
            ) : (
              <div className="evidence-content">
                <p className="drawer-description">
                  {t(
                    "These records belong to this answer only.",
                    "هذه السجلات تخص هذه الإجابة فقط.",
                  )}
                </p>
                {panel!.answer.citations.length === 0 ? (
                  <div className="no-evidence">
                    <Search size={27} />
                    <h3>{t("No supporting records", "لا توجد سجلات داعمة")}</h3>
                    <p>
                      {t(
                        "This answer asks for clarification or acknowledges an evidence gap.",
                        "هذه الإجابة تطلب توضيحًا أو تُقرّ بنقص الأدلة.",
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="source-list">
                      {panel!.answer.citations.map((c) => (
                        <button
                          className={
                            activeCitation?.documentId === c.documentId
                              ? "selected"
                              : ""
                          }
                          key={c.documentId}
                          onClick={() =>
                            setPanel({ ...panel!, selected: c.documentId })
                          }
                        >
                          <span className="source-type">
                            {c.documentType === "ayah" ? (
                              <BookOpen size={16} />
                            ) : (
                              <FileText size={16} />
                            )}
                          </span>
                          <span>
                            <strong>{c.title}</strong>
                            <small>{c.documentId}</small>
                          </span>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                    </div>
                    {activeCitation && (
                      <section className="record-detail">
                        <div className="record-label">
                          <span className="status-dot" />
                          {activeCitation.origin === "sanity"
                            ? t("Retrieved from Sanity", "مسترجَع من Sanity")
                            : t("Local record", "سجل محلي")}
                        </div>
                        <h3>{activeCitation.title}</h3>
                        {typeof activeCitation.rawJsonSnippet.textUthmani ===
                          "string" && (
                          <p className="record-arabic" dir="rtl">
                            {activeCitation.rawJsonSnippet.textUthmani}
                          </p>
                        )}
                        {typeof activeCitation.rawJsonSnippet.primaryExcerpt ===
                          "string" && (
                          <>
                            <h4>
                              {t("Primary source excerpt", "نص المصدر الأصلي")}
                            </h4>
                            <blockquote className={/[\u0600-\u06ff]/.test(activeCitation.rawJsonSnippet.primaryExcerpt)?'record-arabic':undefined} dir="auto">
                              {activeCitation.rawJsonSnippet.primaryExcerpt}
                            </blockquote>
                            <p className="drawer-description">
                              {String(
                                activeCitation.rawJsonSnippet.reviewedBy || "",
                              )}
                            </p>
                          </>
                        )}
                        {activeCitation.sourceUrl && (
                          <a
                            href={activeCitation.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("Read primary source", "اقرأ المصدر الأصلي")}
                            <ArrowUpRight size={14} />
                          </a>
                        )}
                        <details>
                          <summary>
                            {t(
                              "View source record (JSON)",
                              "عرض السجل الأصلي (JSON)",
                            )}
                          </summary>
                          <pre dir="ltr">
                            {JSON.stringify(
                              activeCitation.rawJsonSnippet,
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                      </section>
                    )}
                  </>
                )}
                {panel!.answer.contextTools?.length ? (
                  <p className="context-trace">
                    Context MCP: {panel!.answer.contextTools.join(" → ")}
                    {panel!.answer.contextStrategy==='semantic' ? t(' · semantic search',' · بحث دلالي') : panel!.answer.contextStrategy==='exact_anchor' ? t(' · exact verse anchors',' · مراجع آيات محددة') : ''}
                  </p>
                ) : null}
                {panel!.answer.contextStatus === "empty" && (
                  <p className="context-trace">
                    {t(
                      "Context connected · Knowledge Base has no built entries yet",
                      "Context متصل · قاعدة المعرفة لم تُبنَ بعد",
                    )}
                  </p>
                )}
                {panel!.answer.contextStatus === "unavailable" && (
                  <p className="context-trace">
                    {t(
                      "Context retrieval unavailable · showing other retrieved sources",
                      "استرجاع Context غير متاح · المصادر المعروضة من مسارات البحث الأخرى",
                    )}
                  </p>
                )}
                {panel!.answer.libraryStatus && (
                  <p className="context-trace">
                    {t("Library retrieval", "استرجاع المكتبة")}:{" "}
                    {panel!.answer.libraryStatus === "unavailable"
                      ? t(
                          "Unavailable; these results may be incomplete",
                          "غير متاح؛ النتائج قد تكون غير مكتملة",
                        )
                      : panel!.answer.libraryPlanner === "ai_query_expansion"
                        ? t(
                            "AI-assisted search · exact source extracts",
                            "بحث بمساعدة الذكاء الاصطناعي · نصوص من المصدر",
                          )
                        : t(
                            "Keyword search · exact source extracts",
                            "بحث بالكلمات · نصوص من المصدر",
                          )}
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
