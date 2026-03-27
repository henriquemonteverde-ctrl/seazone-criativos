"use client";

import { useState, useRef } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Status =
  | "idle"
  | "reading"
  | "generating"
  | "reviewing"
  | "adjusting"
  | "done"
  | "error";

interface Result {
  previewUrl: string;
  fileName: string;
  nota: number;
  copyPaste: string;
}

const MAX_TENTATIVAS = 3;

const STATUS_LABELS: Record<Status, string> = {
  idle:       "",
  reading:    "Lendo briefing…",
  generating: "Gerando criativo…",
  reviewing:  "Revisando qualidade…",
  adjusting:  "Ajustando criativo…",
  done:       "Pronto!",
  error:      "Erro no processo",
};

const STATUS_PROGRESS: Record<Status, number> = {
  idle:       0,
  reading:    22,
  generating: 52,
  reviewing:  78,
  adjusting:  62,
  done:       100,
  error:      0,
};

// ─── Matrix background ────────────────────────────────────────────────────────

const MATRIX_WORDS = [
  "SPOT", "ROI", "BRIEFING", "AGENTE", "SZI", "PNG",
  "CRIATIVO", "RENDER", "BLOB", "SEAZONE", "SHARP",
  "OVERLAY", "NAVY", "FLUX", "QA", "16.4%", "LANÇAMENTO",
];

const COLUMNS = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i / 19) * 96 + 1.5}%`,
  words: Array.from({ length: 7 }, (_, j) => MATRIX_WORDS[(i * 3 + j * 5) % MATRIX_WORDS.length]),
  duration: 7 + ((i * 11) % 9),
  delay: -((i * 1.7) % 6),
  fontSize: 9 + (i % 3),
  opacity: 0.12 + (i % 4) * 0.055,
}));

function MatrixBg() {
  return (
    <>
      <style>{`
        @keyframes matrix-fall {
          0%   { transform: translateY(-120%); opacity: 0; }
          8%   { opacity: 1; }
          88%  { opacity: 0.7; }
          100% { transform: translateY(105vh); opacity: 0; }
        }
        @keyframes agent-pulse {
          0%, 100% { transform: scale(1);   box-shadow: 0 0 0   0 currentColor; }
          50%       { transform: scale(1.35); box-shadow: 0 0 10px 4px currentColor; }
        }
        @keyframes glow-in {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes progress-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        {COLUMNS.map((col, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: col.left,
              display: "flex",
              flexDirection: "column",
              gap: 28,
              animation: `matrix-fall ${col.duration}s linear ${col.delay}s infinite`,
              willChange: "transform",
            }}
          >
            {col.words.map((w, j) => (
              <span
                key={j}
                style={{
                  fontFamily: "monospace",
                  fontSize: col.fontSize,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#378ADD",
                  opacity: col.opacity,
                  filter: "blur(0.8px)",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                {w}
              </span>
            ))}
          </div>
        ))}

        {/* Radial vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 70% at 55% 50%, transparent 20%, #0a0a0f 80%)",
        }} />
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const AGENT_COLORS = {
  reading:    "#378ADD",
  generating: "#FC6058",
  adjusting:  "#FC6058",
  reviewing:  "#4ade80",
  done:       "#4ade80",
  idle:       "transparent",
  error:      "transparent",
};

const NAV_ITEMS = [
  { label: "Dashboard",           icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { label: "Criativos Estáticos", icon: "M3 3h18v14H3zM7 21h10M12 17v4", active: true },
  { label: "Assets",              icon: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" },
  { label: "Configurações",       icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

const AGENTS = [
  { n: 1, label: "Briefing",  activeOn: ["reading"],              color: "#378ADD" },
  { n: 2, label: "Produtor",  activeOn: ["generating", "adjusting"], color: "#FC6058" },
  { n: 3, label: "Revisor QA", activeOn: ["reviewing"],           color: "#4ade80" },
];

function Sidebar({ status }: { status: Status }) {
  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: "rgba(0,20,61,0.85)",
      borderRight: "1px solid rgba(55,138,221,0.15)",
      backdropFilter: "blur(16px)",
      display: "flex",
      flexDirection: "column",
      zIndex: 20,
      position: "relative",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(55,138,221,0.12)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://qrapd3qjiankddu3.public.blob.vercel-storage.com/logos/logo%20seazone%20full%20branca.png"
          alt="Seazone"
          style={{ height: 22, objectFit: "contain" }}
        />
        <p style={{ fontSize: 9, color: "#FC6058", letterSpacing: "0.25em", fontWeight: 600, marginTop: 6, textTransform: "uppercase" }}>
          Creative Generator
        </p>
      </div>

      {/* Nav */}
      <nav style={{ padding: "16px 10px", flex: 1 }}>
        <p style={{ fontSize: 9, color: "rgba(55,138,221,0.4)", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", padding: "0 10px", marginBottom: 8 }}>
          Menu
        </p>
        {NAV_ITEMS.map(({ label, icon, active }) => (
          <div
            key={label}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 8, marginBottom: 2,
              background: active ? "rgba(55,138,221,0.15)" : "transparent",
              border: active ? "1px solid rgba(55,138,221,0.25)" : "1px solid transparent",
              cursor: "default",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#378ADD" : "rgba(255,255,255,0.3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
            <span style={{ fontSize: 12, color: active ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </div>
        ))}
      </nav>

      {/* Agent status dots */}
      <div style={{ padding: "16px 20px 24px", borderTop: "1px solid rgba(55,138,221,0.12)" }}>
        <p style={{ fontSize: 9, color: "rgba(55,138,221,0.4)", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: 14 }}>
          Agentes
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {AGENTS.map(({ n, label, activeOn, color }) => {
            const isActive = (activeOn as string[]).includes(status);
            const isDone   = status === "done" || STATUS_PROGRESS[status] > (n === 1 ? 22 : n === 2 ? 52 : 78);
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: "50%",
                  background: isActive ? color : isDone ? color : "rgba(255,255,255,0.12)",
                  color: isActive ? color : "transparent",
                  flexShrink: 0,
                  animation: isActive ? `agent-pulse 1.2s ease-in-out infinite` : "none",
                  transition: "background 0.4s",
                  boxShadow: isActive ? `0 0 8px 2px ${color}` : "none",
                }} />
                <span style={{ fontSize: 11, color: isActive ? "#fff" : isDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", fontWeight: isActive ? 600 : 400, transition: "color 0.3s" }}>
                  Agente {n} — {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ─── Agent cards ──────────────────────────────────────────────────────────────

function AgentCards({ status }: { status: Status }) {
  const progress = STATUS_PROGRESS[status];
  const agents = [
    { n: 1, label: "Agente 1",  sub: "Analista de Briefing", threshold: 22, activeOn: ["reading"],               color: "#378ADD" },
    { n: 2, label: "Agente 2",  sub: "Produtor de Criativos", threshold: 52, activeOn: ["generating", "adjusting"], color: "#FC6058" },
    { n: 3, label: "Agente 3",  sub: "Revisor QA",            threshold: 78, activeOn: ["reviewing"],             color: "#4ade80" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      {agents.map(({ n, label, sub, threshold, activeOn, color }) => {
        const isActive = (activeOn as string[]).includes(status);
        const isDone   = progress > threshold || status === "done";
        const dimmed   = !isActive && !isDone;
        return (
          <div
            key={n}
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 12,
              background: isActive ? `rgba(${color === "#378ADD" ? "55,138,221" : color === "#FC6058" ? "252,96,88" : "74,222,128"},0.1)` : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? color + "55" : isDone ? color + "33" : "rgba(255,255,255,0.06)"}`,
              transition: "all 0.4s ease",
              animation: isActive ? "glow-in 0.35s ease" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: isActive ? color : isDone ? color : "rgba(255,255,255,0.15)",
                boxShadow: isActive ? `0 0 6px 2px ${color}` : "none",
                animation: isActive ? "agent-pulse 1s ease-in-out infinite" : "none",
                transition: "background 0.3s",
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? color : isDone ? color : "rgba(255,255,255,0.25)", letterSpacing: "0.05em", transition: "color 0.3s" }}>
                {label}
              </span>
            </div>
            <p style={{ fontSize: 10, color: dimmed ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.5)", margin: 0, transition: "color 0.3s" }}>
              {sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Home() {
  const [link, setLink]         = useState("");
  const [status, setStatus]     = useState<Status>("idle");
  const [result, setResult]     = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const copyRef  = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied]     = useState(false);

  const isRunning = !["idle", "done", "error"].includes(status);
  const progress  = STATUS_PROGRESS[status];

  // ── Pipeline ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!link.trim() || isRunning) return;
    setResult(null);
    setErrorMsg("");
    setTentativa(0);

    try {
      // Agente 1
      setStatus("reading");
      const briefingRes = await fetch("/api/ler-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      if (!briefingRes.ok) {
        const e = await briefingRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Falha ao ler o briefing");
      }
      const briefing = await briefingRes.json();

      // Loop Agente 2 + 3
      let finalImageUrl = "";
      let fileName      = "";
      let nota          = 0;

      for (let t = 1; t <= MAX_TENTATIVAS; t++) {
        setTentativa(t);

        // Agente 2
        setStatus(t === 1 ? "generating" : "adjusting");
        const montarRes = await fetch("/api/montar-criativo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ briefing, formato: "feed", estrutura: t }),
        });
        if (!montarRes.ok) {
          const e = await montarRes.json().catch(() => ({}));
          throw new Error((e as { error?: string }).error ?? "Falha ao montar o criativo");
        }
        const montado = await montarRes.json();
        finalImageUrl = montado.finalImageUrl;
        fileName      = montado.fileName;

        // Agente 3
        setStatus("reviewing");
        const revisarRes = await fetch("/api/revisar-criativo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalImageUrl, briefing, fileName }),
        });
        if (!revisarRes.ok) {
          const e = await revisarRes.json().catch(() => ({}));
          throw new Error((e as { error?: string }).error ?? "Falha ao revisar o criativo");
        }
        const revisao = await revisarRes.json();
        nota = revisao.nota;
        if (revisao.aprovado) break;
      }

      setResult({
        previewUrl: finalImageUrl,
        fileName,
        nota,
        copyPaste: briefing.copy_paste ?? "",
      });
      setStatus("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setLink("");
    setTentativa(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleCopy() {
    if (!result?.copyPaste) return;
    try {
      await navigator.clipboard.writeText(result.copyPaste);
    } catch {
      copyRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Status bar color
  const statusColor =
    ["reading"].includes(status)               ? "#378ADD"
    : ["generating", "adjusting"].includes(status) ? "#FC6058"
    : ["reviewing", "done"].includes(status)   ? "#4ade80"
    : "#378ADD";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", background: "#0a0a0f", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
      <MatrixBg />

      {/* Sidebar */}
      <Sidebar status={status} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 32px", overflowY: "auto", position: "relative", zIndex: 10 }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.3em", color: "rgba(55,138,221,0.7)", textTransform: "uppercase", margin: 0, marginBottom: 4 }}>
            Máquina de Criativos
          </h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0, letterSpacing: "0.15em" }}>
            Pipeline autônomo · 3 agentes · SZI Investimentos
          </p>
        </div>

        {/* Agent cards — só visíveis quando rodando ou concluído */}
        {status !== "idle" && status !== "error" && (
          <div style={{ width: "100%", maxWidth: 520, animation: "glow-in 0.3s ease" }}>
            <AgentCards status={status} />
          </div>
        )}

        {/* Glassmorphism card */}
        <div style={{
          width: "100%", maxWidth: 520,
          background: "rgba(0,20,61,0.5)",
          border: "1px solid rgba(55,138,221,0.25)",
          borderRadius: 20,
          padding: 32,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(55,138,221,0.1)",
        }}>

          {/* ── Done ── */}
          {status === "done" && result ? (
            <div style={{ animation: "glow-in 0.4s ease" }}>
              {/* Cabeçalho */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14 }}>Criativo aprovado!</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2, fontFamily: "monospace" }}>{result.fileName}</p>
                </div>
                {/* Badge nota */}
                <div style={{ background: "rgba(252,96,88,0.12)", border: "1px solid rgba(252,96,88,0.3)", borderRadius: 10, padding: "6px 12px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#FC6058", lineHeight: 1, letterSpacing: "-0.03em" }}>{result.nota}</div>
                  <div style={{ fontSize: 9, color: "rgba(252,96,88,0.6)", fontWeight: 600, letterSpacing: "0.1em" }}>/10</div>
                </div>
              </div>

              {/* Preview */}
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(55,138,221,0.2)", marginBottom: 16, maxHeight: 400 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.previewUrl} alt="Preview" style={{ width: "100%", display: "block", objectFit: "cover" }} />
              </div>

              {/* Baixar */}
              <a
                href={result.previewUrl}
                download={result.fileName}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", background: "#FC6058", color: "#fff",
                  padding: "13px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  textDecoration: "none", marginBottom: 12,
                  boxShadow: "0 4px 20px rgba(252,96,88,0.3)",
                  transition: "background 0.2s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Baixar PNG
              </a>

              {/* Nomenclatura */}
              {result.copyPaste && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: "rgba(55,138,221,0.6)", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase" }}>
                      Nomenclatura / Copy paste
                    </span>
                    <button
                      onClick={handleCopy}
                      style={{
                        fontSize: 10, color: copied ? "#4ade80" : "#378ADD", background: "none", border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, fontFamily: "inherit", transition: "color 0.2s",
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                      width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(55,138,221,0.15)",
                      borderRadius: 10, padding: "12px 14px", color: "rgba(55,138,221,0.8)", fontSize: 10,
                      fontFamily: "monospace", lineHeight: 1.7, resize: "none", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              <button
                onClick={handleReset}
                style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", padding: "8px 0", fontFamily: "inherit", transition: "color 0.2s" }}
              >
                Gerar outro criativo
              </button>
            </div>

          ) : status === "error" ? (
            /* ── Error ── */
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: "0 0 8px" }}>Algo deu errado</p>
              <p style={{ color: "rgba(239,68,68,0.75)", fontSize: 12, margin: "0 0 20px", lineHeight: 1.6 }}>{errorMsg}</p>
              <button onClick={handleReset} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                Tentar novamente
              </button>
            </div>

          ) : (
            /* ── Idle / Running ── */
            <>
              <label style={{ display: "block", fontSize: 9, color: "rgba(55,138,221,0.6)", letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
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
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(55,138,221,0.2)",
                  borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 13,
                  outline: "none", fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box",
                  opacity: isRunning ? 0.4 : 1, transition: "border-color 0.2s",
                }}
              />

              {/* Progresso */}
              {isRunning && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 600, transition: "color 0.4s", display: "flex", alignItems: "center", gap: 6 }}>
                      {STATUS_LABELS[status]}
                      {tentativa > 1 && (
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>
                          · tentativa {tentativa}/{MAX_TENTATIVAS}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{progress}%</span>
                  </div>

                  {/* Barra */}
                  <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, #0055FF, ${statusColor})`,
                      borderRadius: 99,
                      transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                      boxShadow: `0 0 8px ${statusColor}88`,
                    }} />
                  </div>

                  {/* Micro dots de etapa */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
                    {[
                      { label: "Briefing",  p: 22  },
                      { label: "Criativo",  p: 52  },
                      { label: "Revisão",   p: 78  },
                      { label: "Concluído", p: 100 },
                    ].map(({ label, p }) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: progress >= p ? statusColor : "rgba(255,255,255,0.12)",
                          boxShadow: progress >= p ? `0 0 4px ${statusColor}` : "none",
                          transition: "background 0.4s, box-shadow 0.4s",
                        }} />
                        <span style={{ fontSize: 8.5, color: progress >= p ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)", letterSpacing: "0.05em", transition: "color 0.4s" }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão */}
              <button
                onClick={handleGenerate}
                disabled={!link.trim() || isRunning}
                style={{
                  width: "100%", background: (!link.trim() || isRunning) ? "rgba(252,96,88,0.25)" : "#FC6058",
                  border: "none", borderRadius: 12, color: "#fff",
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
                  padding: "14px 0", cursor: (!link.trim() || isRunning) ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "background 0.2s",
                  boxShadow: (!link.trim() || isRunning) ? "none" : "0 4px 20px rgba(252,96,88,0.3)",
                }}
              >
                {isRunning ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg style={{ animation: "spin 0.8s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Processando…
                  </span>
                ) : "Gerar Criativo"}
              </button>

              <p style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
                Google Doc · Lovable · Link de briefing
              </p>
            </>
          )}
        </div>

        <p style={{ marginTop: 20, fontSize: 9, color: "rgba(255,255,255,0.1)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
          Seazone Investimentos — Uso Interno
        </p>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
