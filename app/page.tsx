"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "reading" | "generating" | "reviewing" | "done" | "error";

interface CriativoItem {
  tipo: "estatico" | "narrado" | "apresentador";
  variacao: number;
  formato: "feed" | "reels";
  copy: string;
  imagemContexto: string;
  render: string;
  hipotese: string;
}

interface CriativoResult {
  criativo: CriativoItem;
  previewUrl: string;
  fileName: string;
  nota: number;
  aprovado: boolean;
  feedback: string;
}

const STATUS_LABELS: Record<Status, string> = {
  idle:       "",
  reading:    "Lendo briefing",
  generating: "Gerando criativos",
  reviewing:  "Revisando qualidade",
  done:       "Concluído",
  error:      "Falha",
};

const STATUS_PROGRESS: Record<Status, number> = {
  idle: 0, reading: 20, generating: 55, reviewing: 80, done: 100, error: 0,
};

const MATRIX_COLOR: Record<Status, string> = {
  idle:       "#0C447C",
  reading:    "#378ADD",
  generating: "#FC6058",
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

const COLS = Array.from({ length: 22 }, (_, i) => ({
  left:    `${(i / 21) * 96 + 1.5}%`,
  dur:     6 + ((i * 7 + 3) % 9),
  delay:   -((i * 1.9 + 1.1) % 7),
  opacity: 0.55 + (i % 4) * 0.12,
  size:    8 + (i % 3),
  words:   Array.from({ length: 8 }, (_, j) => WORDS[(i * 3 + j * 5 + 2) % WORDS.length]),
}));

function MatrixRain({ color }: { color: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {COLS.map((col, i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: col.left, display: "flex", flexDirection: "column", gap: 26, animation: `mfall ${col.dur}s linear ${col.delay}s infinite`, willChange: "transform" }}>
          {col.words.map((w, j) => (
            <span key={j} style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: col.size, fontWeight: 700, letterSpacing: "0.1em", color, opacity: col.opacity, filter: "blur(0.9px)", whiteSpace: "nowrap", userSelect: "none", transition: "color 1.2s ease" }}>
              {w}
            </span>
          ))}
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 65% at 60% 50%, transparent 15%, #0a0a0f 78%)" }} />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Dashboard", d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { label: "Criativos", d: "M3 3h18v14H3zM7 21h10M12 17v4", active: true },
  { label: "Assets",    d: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" },
  { label: "Config",    d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

const AGENTS_DEF = [
  { n: "1", label: "Briefing",   activeOn: ["reading"] },
  { n: "2", label: "Produtor",   activeOn: ["generating"] },
  { n: "3", label: "Revisor QA", activeOn: ["reviewing"] },
];

function Sidebar({ status }: { status: Status }) {
  const prog = STATUS_PROGRESS[status];
  return (
    <aside style={{ width: 216, flexShrink: 0, position: "relative", zIndex: 20, background: "rgba(0,20,61,0.88)", borderRight: "1px solid rgba(55,138,221,0.13)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(55,138,221,0.1)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://qrapd3qjiankddu3.public.blob.vercel-storage.com/logos/logo%20seazone%20full%20branca.png" alt="Seazone" style={{ height: 20, objectFit: "contain", display: "block" }} />
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Chakra Petch', monospace" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FC6058", boxShadow: "0 0 6px #FC6058" }} />
          <span style={{ fontSize: 9, color: "#FC6058", letterSpacing: "0.28em", fontWeight: 600, textTransform: "uppercase" }}>Creative Generator</span>
        </div>
      </div>
      <nav style={{ padding: "14px 10px", flex: 1 }}>
        <p style={{ fontSize: 8, color: "rgba(55,138,221,0.35)", letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase", padding: "0 8px", marginBottom: 8, fontFamily: "'Chakra Petch', monospace" }}>Menu</p>
        {NAV.map(({ label, d, active }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, marginBottom: 1, background: active ? "rgba(55,138,221,0.12)" : "transparent", borderLeft: active ? "2px solid #378ADD" : "2px solid transparent", cursor: "default" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={active ? "#378ADD" : "rgba(255,255,255,0.25)"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? "#fff" : "rgba(255,255,255,0.28)", fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.03em" }}>{label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: "14px 18px 22px", borderTop: "1px solid rgba(55,138,221,0.1)" }}>
        <p style={{ fontSize: 8, color: "rgba(55,138,221,0.35)", letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase", marginBottom: 14, fontFamily: "'Chakra Petch', monospace" }}>Agentes</p>
        {AGENTS_DEF.map(({ n, label, activeOn }) => {
          const isActive = (activeOn as string[]).includes(status);
          const isDone   = prog > ({ "1": 20, "2": 55, "3": 80 } as Record<string, number>)[n];
          const col      = AGENT_COLOR[n];
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: isActive || isDone ? col : "rgba(255,255,255,0.1)", boxShadow: isActive ? `0 0 8px 2px ${col}` : "none", animation: isActive ? "dot-pulse 1.1s ease-in-out infinite" : "none", transition: "background 0.5s, box-shadow 0.5s" }} />
              <p style={{ margin: 0, fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? "#fff" : isDone ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)", fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.04em", transition: "color 0.4s" }}>A{n} — {label}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Agent Status Cards ───────────────────────────────────────────────────────

function AgentCards({ status }: { status: Status }) {
  const prog  = STATUS_PROGRESS[status];
  const cards = [
    { n: "1", title: "Agente 1", sub: "Analista de Briefing",  activeOn: ["reading"],     threshold: 20 },
    { n: "2", title: "Agente 2", sub: "Produtor de Criativos", activeOn: ["generating"],  threshold: 55 },
    { n: "3", title: "Agente 3", sub: "Revisor QA",            activeOn: ["reviewing"],   threshold: 80 },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, width: "100%" }}>
      {cards.map(({ n, title, sub, activeOn, threshold }) => {
        const active = (activeOn as string[]).includes(status);
        const done   = prog > threshold || status === "done";
        const col    = AGENT_COLOR[n];
        return (
          <div key={n} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: active ? `linear-gradient(135deg, ${col}18 0%, ${col}08 100%)` : done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)", border: `1px solid ${active ? col + "50" : done ? col + "28" : "rgba(255,255,255,0.05)"}`, transition: "all 0.45s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: active || done ? col : "rgba(255,255,255,0.12)", boxShadow: active ? `0 0 5px ${col}` : "none", animation: active ? "dot-pulse 1s ease-in-out infinite" : "none", transition: "all 0.4s" }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? col : done ? col + "cc" : "rgba(255,255,255,0.2)", fontFamily: "'Chakra Petch', monospace", transition: "color 0.4s" }}>{title}</span>
            </div>
            <p style={{ margin: 0, fontSize: 9.5, color: active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)", transition: "color 0.4s", fontFamily: "'JetBrains Mono', monospace" }}>{sub}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ status, progressLabel }: { status: Status; progressLabel?: string }) {
  const prog  = STATUS_PROGRESS[status];
  const color = MATRIX_COLOR[status];
  const label = progressLabel ?? STATUS_LABELS[status];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color, transition: "color 0.6s", fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, animation: "dot-pulse 1s infinite" }} />
          {label}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{prog}%</span>
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(90deg, #0055FF, ${color})`, borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.6s", boxShadow: `0 0 10px ${color}99` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {[{ label: "Briefing", p: 20 }, { label: "Criativos", p: 55 }, { label: "Revisão", p: 80 }, { label: "Pronto", p: 100 }].map(({ label: l, p }) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: prog >= p ? color : "rgba(255,255,255,0.1)", boxShadow: prog >= p ? `0 0 5px ${color}` : "none", transition: "all 0.5s" }} />
            <span style={{ fontSize: 8, letterSpacing: "0.06em", color: prog >= p ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)", fontFamily: "'JetBrains Mono', monospace", transition: "color 0.5s" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Criativo Card ────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = { estatico: "ESTÁTICO", narrado: "NARRADO", apresentador: "APRESENTADOR" };
const TIPO_COLOR: Record<string, string> = { estatico: "#378ADD", narrado: "#8B5CF6", apresentador: "#F59E0B" };

function CriativoCard({ r }: { r: CriativoResult }) {
  const tipoColor = TIPO_COLOR[r.criativo.tipo] ?? "#378ADD";
  const notaColor = r.nota >= 7 ? "#1D9E75" : "#ef4444";

  return (
    <div style={{
      background: "rgba(0,20,61,0.55)",
      border: `1px solid ${r.aprovado ? "rgba(29,158,117,0.25)" : "rgba(239,68,68,0.25)"}`,
      borderRadius: 14,
      padding: "14px 14px 12px",
      display: "flex", flexDirection: "column", gap: 10,
      backdropFilter: "blur(10px)",
      transition: "border-color 0.3s",
    }}>
      {/* Badges row */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", color: tipoColor, background: tipoColor + "18", border: `1px solid ${tipoColor}40`, borderRadius: 5, padding: "3px 7px", fontFamily: "'Chakra Petch', monospace" }}>
          {TIPO_LABEL[r.criativo.tipo] ?? r.criativo.tipo.toUpperCase()}
        </span>
        <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", color: "#FC6058", background: "rgba(252,96,88,0.12)", border: "1px solid rgba(252,96,88,0.3)", borderRadius: 5, padding: "3px 7px", fontFamily: "'Chakra Petch', monospace" }}>
          {r.criativo.formato.toUpperCase()}
        </span>
        <span style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "3px 7px", fontFamily: "'JetBrains Mono', monospace" }}>
          V{r.criativo.variacao}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 8.5, fontWeight: 700, color: r.aprovado ? "#1D9E75" : "#ef4444", background: r.aprovado ? "rgba(29,158,117,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${r.aprovado ? "rgba(29,158,117,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 5, padding: "3px 7px", fontFamily: "'Chakra Petch', monospace" }}>
          {r.aprovado ? "APROVADO" : "REPROVADO"}
        </span>
      </div>

      {/* Preview */}
      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(55,138,221,0.12)", background: "#0a0a0f" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.previewUrl} alt={r.fileName} style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 300 }} />
      </div>

      {/* Nota + feedback */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flexShrink: 0, background: notaColor + "18", border: `1px solid ${notaColor}40`, borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 44 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: notaColor, lineHeight: 1, letterSpacing: "-0.04em" }}>{r.nota}</div>
          <div style={{ fontSize: 7.5, color: notaColor + "99", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>/10</div>
        </div>
        <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, margin: 0, fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>
          {r.feedback || r.criativo.hipotese}
        </p>
      </div>

      {/* Download */}
      <a
        href={r.previewUrl}
        download={r.fileName}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "rgba(252,96,88,0.12)", border: "1px solid rgba(252,96,88,0.25)",
          borderRadius: 8, padding: "9px 0",
          color: "#FC6058", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          textDecoration: "none", fontFamily: "'Chakra Petch', monospace",
          textTransform: "uppercase", transition: "background 0.2s",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Baixar PNG
      </a>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [link, setLink]               = useState("");
  const [status, setStatus]           = useState<Status>("idle");
  const [results, setResults]         = useState<CriativoResult[]>([]);
  const [errorMsg, setErrorMsg]       = useState("");
  const [progressDone, setProgressDone] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [escondido, setEscondido] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRunning = !["idle", "done", "error"].includes(status);
  const matrixCol = MATRIX_COLOR[status];

  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Pipeline ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!link.trim() || isRunning) return;
    setResults([]); setErrorMsg(""); setProgressDone(0); setProgressTotal(0);

    try {
      // Agente 1 — leitura do briefing
      setStatus("reading");
      const br = await fetch("/api/ler-briefing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      if (!br.ok) {
        const e = await br.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? "Falha ao ler briefing");
      }
      const briefing = await br.json();
      console.log(JSON.stringify(briefing));

      if (briefing.error) {
        throw new Error("Erro do Agente 1: " + briefing.error);
      }

      const criativos: CriativoItem[] = briefing.criativos ?? [];
      if (criativos.length === 0) {
        throw new Error("Agente 1 não retornou criativos. Resposta: " + JSON.stringify(briefing).slice(0, 200));
      }

      setProgressTotal(criativos.length);
      setStatus("generating");

      // Agentes 2 + 3 — produção e revisão em paralelo
      const resultados = await Promise.all(
        criativos.map(async (criativo): Promise<CriativoResult> => {
          // Agente 2
          const mr = await fetch("/api/montar-criativo", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ briefing, criativo }),
          });
          const montado = mr.ok ? await mr.json() : { finalImageUrl: "", fileName: `criativo_erro_${Date.now()}.png` };

          // Agente 3
          let nota = 0, aprovado = false, feedback = "";
          try {
            setStatus("reviewing");
            const rr = await fetch("/api/revisar-criativo", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ finalImageUrl: montado.finalImageUrl, briefing, fileName: montado.fileName }),
            });
            if (rr.ok) {
              const rev = await rr.json();
              nota     = rev.nota     ?? 0;
              aprovado = rev.aprovado ?? false;
              feedback = rev.feedback ?? "";
            }
          } catch { /* revisão indisponível — aceita criativo gerado */ }

          setProgressDone(p => p + 1);

          return {
            criativo,
            previewUrl: montado.finalImageUrl ?? "",
            fileName:   montado.fileName      ?? "",
            nota,
            aprovado,
            feedback,
          };
        })
      );

      setResults(resultados);
      setStatus("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle"); setResults([]); setErrorMsg(""); setLink("");
    setProgressDone(0); setProgressTotal(0);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function handleDownloadAll() {
    for (const r of results) {
      if (!r.previewUrl) continue;
      const a = document.createElement("a");
      a.href     = r.previewUrl;
      a.download = r.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise(res => setTimeout(res, 220));
    }
  }

  const progressLabel = progressTotal > 0
    ? `Gerando criativo ${Math.min(progressDone + 1, progressTotal)} de ${progressTotal}...`
    : undefined;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
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
          50%      { transform: scale(1.55); opacity: 0.65; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(55,138,221,0.25); border-radius: 99px; }
        ::placeholder { color: rgba(255,255,255,0.18) !important; }
        input:focus { border-color: rgba(55,138,221,0.5) !important; background: rgba(55,138,221,0.05) !important; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", background: "#0a0a0f", fontFamily: "'Chakra Petch', monospace" }}>
        <MatrixRain color={matrixCol} />
        <Sidebar status={status} />

        {/* Content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: status === "done" ? "stretch" : "center",
          justifyContent: status === "done" ? "flex-start" : "center",
          padding: status === "done" ? "28px 32px" : "24px 40px",
          overflowY: "auto", position: "relative", zIndex: 10,
        }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: status === "done" ? 20 : 24 }}>
            <h1 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", color: "rgba(55,138,221,0.6)", textTransform: "uppercase", marginBottom: 4 }}>
              Máquina de Criativos
            </h1>
            <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.18em", fontFamily: "'JetBrains Mono', monospace" }}>
              pipeline autônomo · 3 agentes · SZI investimentos
            </p>
          </div>

          {/* Agent cards — visível durante processamento */}
          {!["idle", "error", "done"].includes(status) && (
            <div style={{ width: "100%", maxWidth: 520, animation: "fadein 0.35s ease" }}>
              <AgentCards status={status} />
            </div>
          )}

          {/* ── DONE: Grade de criativos ── */}
          {status === "done" ? (
            <div style={{ animation: "fadein 0.4s ease", width: "100%" }}>
              {/* Header da grade */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
                    {results.length} criativo{results.length !== 1 ? "s" : ""} gerado{results.length !== 1 ? "s" : ""}
                  </h2>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                    {results.filter(r => r.aprovado).length} aprovados · {results.filter(r => !r.aprovado).length} reprovados
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleDownloadAll}
                    style={{
                      background: "#FC6058", border: "none", borderRadius: 9,
                      color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                      padding: "10px 18px", cursor: "pointer",
                      fontFamily: "'Chakra Petch', monospace", textTransform: "uppercase",
                      boxShadow: "0 4px 18px rgba(252,96,88,0.28)",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Baixar todos
                  </button>
                  <button
                    onClick={handleReset}
                    style={{
                      background: "rgba(55,138,221,0.1)", border: "1px solid rgba(55,138,221,0.2)",
                      borderRadius: 9, color: "rgba(255,255,255,0.5)", fontSize: 10,
                      fontWeight: 600, letterSpacing: "0.06em", padding: "10px 16px",
                      cursor: "pointer", fontFamily: "'Chakra Petch', monospace", textTransform: "uppercase",
                    }}
                  >
                    Novo briefing
                  </button>
                </div>
              </div>

              {/* Grade */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
                {results.map((r, i) => <CriativoCard key={i} r={r} />)}
              </div>
            </div>

          ) : status === "error" ? (
            /* ── ERROR ── */
            <div style={{ width: "100%", maxWidth: 520 }}>
              <div style={{ width: "100%", background: "rgba(0,20,61,0.5)", border: "1px solid rgba(55,138,221,0.25)", borderRadius: 18, padding: "28px 28px 24px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 12px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(55,138,221,0.08)", textAlign: "center", animation: "fadein 0.35s ease" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 8, letterSpacing: "0.03em" }}>Falha no pipeline</p>
                <p style={{ color: "rgba(239,68,68,0.7)", fontSize: 11, marginBottom: 20, lineHeight: 1.65, fontFamily: "'JetBrains Mono', monospace" }}>{errorMsg}</p>
                <button onClick={handleReset} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer", fontFamily: "'Chakra Petch', monospace", letterSpacing: "0.06em" }}>
                  Tentar novamente
                </button>
              </div>
            </div>

          ) : (
            /* ── IDLE / RUNNING ── */
            <div style={{ width: "100%", maxWidth: 520, background: "rgba(0,20,61,0.5)", border: "1px solid rgba(55,138,221,0.25)", borderRadius: 18, padding: "28px 28px 24px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 12px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(55,138,221,0.08)" }}>
              <label style={{ display: "block", fontSize: 8, color: "rgba(55,138,221,0.55)", letterSpacing: "0.24em", fontWeight: 700, textTransform: "uppercase", marginBottom: 9 }}>
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
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(55,138,221,0.2)", borderRadius: 10, padding: "12px 15px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'JetBrains Mono', monospace", marginBottom: isRunning ? 18 : 16, opacity: isRunning ? 0.38 : 1, transition: "border-color 0.25s, background 0.25s, opacity 0.3s" }}
              />

              {isRunning && <ProgressBar status={status} progressLabel={progressLabel} />}

              <button
                onClick={handleGenerate}
                disabled={!link.trim() || isRunning}
                style={{ width: "100%", background: (!link.trim() || isRunning) ? "rgba(252,96,88,0.18)" : "#FC6058", border: "none", borderRadius: 10, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "13px 0", cursor: (!link.trim() || isRunning) ? "not-allowed" : "pointer", fontFamily: "'Chakra Petch', monospace", boxShadow: (!link.trim() || isRunning) ? "none" : "0 4px 22px rgba(252,96,88,0.28)", transition: "background 0.25s, box-shadow 0.25s" }}
              >
                {isRunning ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg style={{ animation: "spin 0.75s linear infinite" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Processando
                  </span>
                ) : "Gerar Criativos"}
              </button>

              <p style={{ textAlign: "center", marginTop: 12, fontSize: 8.5, color: "rgba(255,255,255,0.14)", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace" }}>
                Google Doc · Lovable · Link de briefing
              </p>
            </div>
          )}

          <p style={{ marginTop: 18, fontSize: 8, color: "rgba(255,255,255,0.08)", letterSpacing: "0.28em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
            Seazone Investimentos — Uso Interno
          </p>
        </div>
      </div>

      <img
        src="URL_DO_BLOB_AQUI"
        alt="Henrique"
        onMouseEnter={() => setEscondido(true)}
        onMouseLeave={() => setTimeout(() => setEscondido(false), 2000)}
        style={{
          position: "fixed",
          bottom: 0,
          right: escondido ? -220 : -60,
          width: 220,
          zIndex: 50,
          cursor: "pointer",
          transition: escondido
            ? "right 0.15s cubic-bezier(0.4, 0, 1, 1)"
            : "right 0.4s cubic-bezier(0, 0, 0.2, 1)",
          animation: escondido ? "none" : "espiar 3s ease-in-out 1s forwards",
          filter: "drop-shadow(-4px 0px 12px rgba(0,0,0,0.5))",
        }}
      />
    </>
  );
}
