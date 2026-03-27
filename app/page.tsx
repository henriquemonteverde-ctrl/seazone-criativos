"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "reading" | "generating" | "reviewing" | "adjusting" | "done" | "error";

interface Result {
  previewUrl: string;
  fileName: string;
  nota: number;
  copyPaste: string;
}

const MAX_TENTATIVAS = 3;

const STATUS_LABELS: Record<Status, string> = {
  idle:       "",
  reading:    "Lendo briefing",
  generating: "Gerando criativo",
  reviewing:  "Revisando qualidade",
  adjusting:  "Ajustando criativo",
  done:       "Aprovado",
  error:      "Falha",
};

const STATUS_PROGRESS: Record<Status, number> = {
  idle: 0, reading: 22, generating: 52,
  reviewing: 78, adjusting: 62, done: 100, error: 0,
};

// Matrix color per agent — the key reactive effect
const MATRIX_COLOR: Record<Status, string> = {
  idle:       "#0C447C",
  reading:    "#378ADD",
  generating: "#FC6058",
  adjusting:  "#FC6058",
  reviewing:  "#1D9E75",
  done:       "#1D9E75",
  error:      "#0C447C",
};

const AGENT_COLOR: Record<string, string> = {
  "1": "#378ADD",
  "2": "#FC6058",
  "3": "#1D9E75",
};

// ─── Matrix Rain ──────────────────────────────────────────────────────────────

const WORDS = ["SPOT","ROI","BRIEFING","SZI","PNG","QA","AGENTE","RENDER","BLOB","SEAZONE","LANÇAMENTO","CRIATIVO","OVERLAY","SHARP","NAVY","16.4%","FLUX"];

// Pre-computed column configs — deterministic, no Math.random
const COLS = Array.from({ length: 22 }, (_, i) => ({
  left:     `${(i / 21) * 96 + 1.5}%`,
  dur:      6 + ((i * 7 + 3) % 9),
  delay:    -((i * 1.9 + 1.1) % 7),
  opacity:  0.55 + (i % 4) * 0.12,
  size:     8 + (i % 3),
  words:    Array.from({ length: 8 }, (_, j) => WORDS[(i * 3 + j * 5 + 2) % WORDS.length]),
}));

function MatrixRain({ color }: { color: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {COLS.map((col, i) => (
        <div
          key={i}
          style={{
            position: "absolute", top: 0, left: col.left,
            display: "flex", flexDirection: "column", gap: 26,
            animation: `mfall ${col.dur}s linear ${col.delay}s infinite`,
            willChange: "transform",
          }}
        >
          {col.words.map((w, j) => (
            <span key={j} style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: col.size, fontWeight: 700, letterSpacing: "0.1em",
              color, opacity: col.opacity,
              filter: "blur(0.9px)",
              whiteSpace: "nowrap", userSelect: "none",
              transition: "color 1.2s ease",
            }}>
              {w}
            </span>
          ))}
        </div>
      ))}
      {/* Vignette — darkens edges so card pops */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 65% 65% at 60% 50%, transparent 15%, #0a0a0f 78%)",
      }} />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Dashboard",     d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { label: "Criativos",     d: "M3 3h18v14H3zM7 21h10M12 17v4", active: true },
  { label: "Assets",        d: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" },
  { label: "Config",        d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

const AGENTS_DEF = [
  { n: "1", label: "Briefing",  activeOn: ["reading"] },
  { n: "2", label: "Produtor",  activeOn: ["generating", "adjusting"] },
  { n: "3", label: "Revisor QA",activeOn: ["reviewing"] },
];

function Sidebar({ status }: { status: Status }) {
  const prog = STATUS_PROGRESS[status];

  return (
    <aside style={{
      width: 216, flexShrink: 0, position: "relative", zIndex: 20,
      background: "rgba(0,20,61,0.88)",
      borderRight: "1px solid rgba(55,138,221,0.13)",
      backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Logo block */}
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(55,138,221,0.1)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://qrapd3qjiankddu3.public.blob.vercel-storage.com/logos/logo%20seazone%20full%20branca.png"
          alt="Seazone"
          style={{ height: 20, objectFit: "contain", display: "block" }}
        />
        <div style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 6,
          fontFamily: "'Chakra Petch', monospace",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FC6058", boxShadow: "0 0 6px #FC6058" }} />
          <span style={{ fontSize: 9, color: "#FC6058", letterSpacing: "0.28em", fontWeight: 600, textTransform: "uppercase" }}>
            Creative Generator
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "14px 10px", flex: 1 }}>
        <p style={{ fontSize: 8, color: "rgba(55,138,221,0.35)", letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase", padding: "0 8px", marginBottom: 8, fontFamily: "'Chakra Petch', monospace" }}>
          Menu
        </p>
        {NAV.map(({ label, d, active }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "8px 10px", borderRadius: 7, marginBottom: 1,
            background: active ? "rgba(55,138,221,0.12)" : "transparent",
            borderLeft: active ? "2px solid #378ADD" : "2px solid transparent",
            cursor: "default",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={active ? "#378ADD" : "rgba(255,255,255,0.25)"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
            <span style={{
              fontSize: 11, fontWeight: active ? 600 : 400,
              color: active ? "#fff" : "rgba(255,255,255,0.28)",
              fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.03em",
            }}>
              {label}
            </span>
          </div>
        ))}
      </nav>

      {/* Agent dots */}
      <div style={{ padding: "14px 18px 22px", borderTop: "1px solid rgba(55,138,221,0.1)" }}>
        <p style={{ fontSize: 8, color: "rgba(55,138,221,0.35)", letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase", marginBottom: 14, fontFamily: "'Chakra Petch', monospace" }}>
          Agentes
        </p>
        {AGENTS_DEF.map(({ n, label, activeOn }) => {
          const isActive = (activeOn as string[]).includes(status);
          const isDone   = prog > ({ "1": 22, "2": 52, "3": 78 } as Record<string, number>)[n];
          const col      = AGENT_COLOR[n];
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: isActive || isDone ? col : "rgba(255,255,255,0.1)",
                boxShadow: isActive ? `0 0 8px 2px ${col}` : "none",
                animation: isActive ? "dot-pulse 1.1s ease-in-out infinite" : "none",
                transition: "background 0.5s, box-shadow 0.5s",
              }} />
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? "#fff" : isDone ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)", fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.04em", transition: "color 0.4s" }}>
                  A{n} — {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Agent Status Cards ───────────────────────────────────────────────────────

function AgentCards({ status }: { status: Status }) {
  const prog = STATUS_PROGRESS[status];
  const cards = [
    { n: "1", title: "Agente 1", sub: "Analista de Briefing",   activeOn: ["reading"],               threshold: 22 },
    { n: "2", title: "Agente 2", sub: "Produtor de Criativos",  activeOn: ["generating","adjusting"], threshold: 52 },
    { n: "3", title: "Agente 3", sub: "Revisor QA",             activeOn: ["reviewing"],              threshold: 78 },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, width: "100%" }}>
      {cards.map(({ n, title, sub, activeOn, threshold }) => {
        const active = (activeOn as string[]).includes(status);
        const done   = prog > threshold || status === "done";
        const col    = AGENT_COLOR[n];
        return (
          <div key={n} style={{
            flex: 1, padding: "10px 12px", borderRadius: 10,
            background: active
              ? `linear-gradient(135deg, ${col}18 0%, ${col}08 100%)`
              : done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
            border: `1px solid ${active ? col + "50" : done ? col + "28" : "rgba(255,255,255,0.05)"}`,
            transition: "all 0.45s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: active || done ? col : "rgba(255,255,255,0.12)",
                boxShadow: active ? `0 0 5px ${col}` : "none",
                animation: active ? "dot-pulse 1s ease-in-out infinite" : "none",
                transition: "all 0.4s",
              }} />
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: active ? col : done ? col + "cc" : "rgba(255,255,255,0.2)",
                fontFamily: "'Chakra Petch', monospace", transition: "color 0.4s",
              }}>
                {title}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 9.5, color: active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)", transition: "color 0.4s", fontFamily: "'JetBrains Mono', monospace" }}>
              {sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ status, tentativa }: { status: Status; tentativa: number }) {
  const prog  = STATUS_PROGRESS[status];
  const color = MATRIX_COLOR[status];
  const label = STATUS_LABELS[status];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color, transition: "color 0.6s",
          fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, animation: "dot-pulse 1s infinite" }} />
          {label}
          {tentativa > 1 && (
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 400, fontFamily: "'JetBrains Mono', monospace" }}>
              · tentativa {tentativa}/{MAX_TENTATIVAS}
            </span>
          )}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          {prog}%
        </span>
      </div>

      {/* Track */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
        <div style={{
          height: "100%", width: `${prog}%`,
          background: `linear-gradient(90deg, #0055FF, ${color})`,
          borderRadius: 99,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.6s",
          boxShadow: `0 0 10px ${color}99`,
        }} />
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {[
          { label: "Briefing",  p: 22  },
          { label: "Criativo",  p: 52  },
          { label: "Revisão",   p: 78  },
          { label: "Pronto",    p: 100 },
        ].map(({ label: l, p }) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 4, height: 4, borderRadius: "50%",
              background: prog >= p ? color : "rgba(255,255,255,0.1)",
              boxShadow: prog >= p ? `0 0 5px ${color}` : "none",
              transition: "all 0.5s",
            }} />
            <span style={{
              fontSize: 8, letterSpacing: "0.06em",
              color: prog >= p ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
              fontFamily: "'JetBrains Mono', monospace", transition: "color 0.5s",
            }}>
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [link, setLink]           = useState("");
  const [status, setStatus]       = useState<Status>("idle");
  const [result, setResult]       = useState<Result | null>(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [copied, setCopied]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const copyRef  = useRef<HTMLTextAreaElement>(null);

  const isRunning = !["idle", "done", "error"].includes(status);
  const matrixCol = MATRIX_COLOR[status];

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Pipeline ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!link.trim() || isRunning) return;
    setResult(null); setErrorMsg(""); setTentativa(0);

    try {
      setStatus("reading");
      const br = await fetch("/api/ler-briefing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      if (!br.ok) { const e = await br.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? "Falha ao ler briefing"); }
      const briefing = await br.json();

      let finalImageUrl = "", fileName = "", nota = 0;

      for (let t = 1; t <= MAX_TENTATIVAS; t++) {
        setTentativa(t);
        setStatus(t === 1 ? "generating" : "adjusting");

        const mr = await fetch("/api/montar-criativo", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ briefing, formato: "feed", estrutura: t }),
        });
        if (!mr.ok) { const e = await mr.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? "Falha ao montar criativo"); }
        const montado = await mr.json();
        finalImageUrl = montado.finalImageUrl; fileName = montado.fileName;

        setStatus("reviewing");
        const rr = await fetch("/api/revisar-criativo", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalImageUrl, briefing, fileName }),
        });
        if (!rr.ok) { break; } // revisão indisponível — aceita criativo gerado
        const rev = await rr.json();
        nota = rev.nota;
        if (rev.aprovado) break;
      }

      setResult({ previewUrl: finalImageUrl, fileName, nota, copyPaste: briefing.copy_paste ?? "" });
      setStatus("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle"); setResult(null); setErrorMsg(""); setLink(""); setTentativa(0);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function handleCopy() {
    if (!result?.copyPaste) return;
    try { await navigator.clipboard.writeText(result.copyPaste); }
    catch { copyRef.current?.select(); document.execCommand("copy"); }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Google Fonts + keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

        @keyframes mfall {
          0%   { transform: translateY(-140%); opacity: 0; }
          7%   { opacity: 1; }
          88%  { opacity: 0.8; }
          100% { transform: translateY(108vh); opacity: 0; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.55); opacity: 0.65; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(55,138,221,0.25); border-radius: 99px; }

        ::placeholder { color: rgba(255,255,255,0.18) !important; }

        input:focus { border-color: rgba(55,138,221,0.5) !important; background: rgba(55,138,221,0.05) !important; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", background: "#0a0a0f",
        fontFamily: "'Chakra Petch', monospace",
      }}>
        {/* Matrix */}
        <MatrixRain color={matrixCol} />

        {/* Sidebar */}
        <Sidebar status={status} />

        {/* Content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "24px 40px", overflowY: "auto",
          position: "relative", zIndex: 10,
        }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.35em",
              color: "rgba(55,138,221,0.6)", textTransform: "uppercase", marginBottom: 4,
            }}>
              Máquina de Criativos
            </h1>
            <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.18em", fontFamily: "'JetBrains Mono', monospace" }}>
              pipeline autônomo · 3 agentes · SZI investimentos
            </p>
          </div>

          {/* Agent cards — visible once running */}
          {status !== "idle" && status !== "error" && (
            <div style={{ width: "100%", maxWidth: 520, animation: "fadein 0.35s ease" }}>
              <AgentCards status={status} />
            </div>
          )}

          {/* Glassmorphism card */}
          <div style={{
            width: "100%", maxWidth: 520,
            background: "rgba(0,20,61,0.5)",
            border: "1px solid rgba(55,138,221,0.25)",
            borderRadius: 18,
            padding: "28px 28px 24px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(55,138,221,0.08)",
          }}>

            {/* ── DONE ── */}
            {status === "done" && result ? (
              <div style={{ animation: "fadein 0.4s ease" }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(29,158,117,0.15)", border: "1px solid rgba(29,158,117,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>Criativo aprovado</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.02em" }}>
                      {result.fileName}
                    </p>
                  </div>
                  {/* Nota badge */}
                  <div style={{
                    background: "rgba(252,96,88,0.1)", border: "1px solid rgba(252,96,88,0.32)",
                    borderRadius: 10, padding: "7px 13px", textAlign: "center", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#FC6058", lineHeight: 1, letterSpacing: "-0.04em" }}>{result.nota}</div>
                    <div style={{ fontSize: 8, color: "rgba(252,96,88,0.55)", fontWeight: 600, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>/10</div>
                  </div>
                </div>

                {/* Preview */}
                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(55,138,221,0.18)", marginBottom: 14, maxHeight: 380 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.previewUrl} alt="Preview" style={{ width: "100%", display: "block", objectFit: "cover" }} />
                </div>

                {/* Download */}
                <a
                  href={result.previewUrl}
                  download={result.fileName}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", background: "#FC6058",
                    padding: "12px 0", borderRadius: 10, marginBottom: 10,
                    color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                    textDecoration: "none", fontFamily: "'Chakra Petch', monospace",
                    boxShadow: "0 4px 24px rgba(252,96,88,0.28)",
                    textTransform: "uppercase",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Baixar PNG
                </a>

                {/* Nomenclatura copy */}
                {result.copyPaste && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                      <span style={{ fontSize: 8, color: "rgba(55,138,221,0.5)", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase" }}>
                        Nomenclatura
                      </span>
                      <button
                        onClick={handleCopy}
                        style={{
                          fontSize: 9.5, color: copied ? "#1D9E75" : "#378ADD",
                          background: "none", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                          fontFamily: "'JetBrains Mono', monospace", transition: "color 0.25s",
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          {copied
                            ? <polyline points="20 6 9 17 4 12" />
                            : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>
                          }
                        </svg>
                        {copied ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <textarea
                      ref={copyRef}
                      readOnly
                      value={result.copyPaste}
                      rows={7}
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(55,138,221,0.12)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: "rgba(55,138,221,0.75)",
                        fontSize: 9.5,
                        fontFamily: "'JetBrains Mono', monospace",
                        lineHeight: 1.75,
                        resize: "none",
                        outline: "none",
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={handleReset}
                  style={{
                    width: "100%", background: "none", border: "none",
                    color: "rgba(255,255,255,0.22)", fontSize: 10, cursor: "pointer",
                    padding: "7px 0", fontFamily: "'Chakra Petch', monospace",
                    letterSpacing: "0.08em", transition: "color 0.2s",
                  }}
                >
                  Gerar outro criativo
                </button>
              </div>

            ) : status === "error" ? (
              /* ── ERROR ── */
              <div style={{ textAlign: "center", animation: "fadein 0.35s ease" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 8, letterSpacing: "0.03em" }}>Falha no pipeline</p>
                <p style={{ color: "rgba(239,68,68,0.7)", fontSize: 11, marginBottom: 20, lineHeight: 1.65, fontFamily: "'JetBrains Mono', monospace" }}>{errorMsg}</p>
                <button
                  onClick={handleReset}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer", fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.06em" }}
                >
                  Tentar novamente
                </button>
              </div>

            ) : (
              /* ── IDLE / RUNNING ── */
              <>
                <label style={{
                  display: "block", fontSize: 8, color: "rgba(55,138,221,0.55)",
                  letterSpacing: "0.24em", fontWeight: 700, textTransform: "uppercase", marginBottom: 9,
                }}>
                  Link do briefing
                </label>

                <input
                  ref={inputRef}
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="docs.google.com/… ou lovable.app/…"
                  disabled={isRunning}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(55,138,221,0.2)", borderRadius: 10,
                    padding: "12px 15px", color: "#fff", fontSize: 13,
                    outline: "none", fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: isRunning ? 18 : 16, opacity: isRunning ? 0.38 : 1,
                    transition: "border-color 0.25s, background 0.25s, opacity 0.3s",
                  }}
                />

                {/* Progress */}
                {isRunning && <ProgressBar status={status} tentativa={tentativa} />}

                {/* CTA */}
                <button
                  onClick={handleGenerate}
                  disabled={!link.trim() || isRunning}
                  style={{
                    width: "100%",
                    background: (!link.trim() || isRunning) ? "rgba(252,96,88,0.18)" : "#FC6058",
                    border: "none", borderRadius: 10, color: "#fff",
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "13px 0", cursor: (!link.trim() || isRunning) ? "not-allowed" : "pointer",
                    fontFamily: "'Chakra Petch', monospace",
                    boxShadow: (!link.trim() || isRunning) ? "none" : "0 4px 22px rgba(252,96,88,0.28)",
                    transition: "background 0.25s, box-shadow 0.25s",
                  }}
                >
                  {isRunning ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <svg style={{ animation: "spin 0.75s linear infinite" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Processando
                    </span>
                  ) : "Gerar Criativo"}
                </button>

                <p style={{ textAlign: "center", marginTop: 12, fontSize: 8.5, color: "rgba(255,255,255,0.14)", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace" }}>
                  Google Doc · Lovable · Link de briefing
                </p>
              </>
            )}
          </div>

          <p style={{ marginTop: 18, fontSize: 8, color: "rgba(255,255,255,0.08)", letterSpacing: "0.28em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
            Seazone Investimentos — Uso Interno
          </p>
        </div>
      </div>
    </>
  );
}
