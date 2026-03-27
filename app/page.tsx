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

// ─── Labels e progresso ───────────────────────────────────────────────────────

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
  reading:    20,
  generating: 50,
  reviewing:  75,
  adjusting:  60,
  done:       100,
  error:      0,
};

const MAX_TENTATIVAS = 3;

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Home() {
  const [link, setLink]       = useState("");
  const [status, setStatus]   = useState<Status>("idle");
  const [result, setResult]   = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const copyRef  = useRef<HTMLTextAreaElement>(null);

  const isRunning = status !== "idle" && status !== "done" && status !== "error";

  // ── Pipeline principal ──────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!link.trim() || isRunning) return;
    setResult(null);
    setErrorMsg("");
    setTentativa(0);

    try {
      // ── Agente 1: lê o briefing ──────────────────────────────────────────
      setStatus("reading");
      const briefingRes = await fetch("/api/ler-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      if (!briefingRes.ok) {
        const e = await briefingRes.json().catch(() => ({}));
        throw new Error(e.error ?? "Falha ao ler o briefing");
      }
      const briefing = await briefingRes.json();

      // ── Loop Agente 2 + Agente 3 (até MAX_TENTATIVAS) ────────────────────
      let finalImageUrl = "";
      let fileName      = "";
      let nota          = 0;
      let aprovado      = false;

      for (let t = 1; t <= MAX_TENTATIVAS; t++) {
        setTentativa(t);

        // Agente 2: monta o criativo
        setStatus(t === 1 ? "generating" : "adjusting");
        const montarRes = await fetch("/api/montar-criativo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ briefing, formato: "feed", estrutura: t }),
        });
        if (!montarRes.ok) {
          const e = await montarRes.json().catch(() => ({}));
          throw new Error(e.error ?? "Falha ao montar o criativo");
        }
        const montado = await montarRes.json();
        finalImageUrl = montado.finalImageUrl;
        fileName      = montado.fileName;

        // Agente 3: revisa a qualidade
        setStatus("reviewing");
        const revisarRes = await fetch("/api/revisar-criativo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalImageUrl, briefing, fileName }),
        });
        if (!revisarRes.ok) {
          const e = await revisarRes.json().catch(() => ({}));
          throw new Error(e.error ?? "Falha ao revisar o criativo");
        }
        const revisao = await revisarRes.json();
        nota     = revisao.nota;
        aprovado = revisao.aprovado;

        if (aprovado) break;
        // Se reprovado e ainda há tentativas, o loop refaz com estrutura diferente
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

  function handleCopy() {
    if (!copyRef.current) return;
    copyRef.current.select();
    document.execCommand("copy");
    copyRef.current.blur();
  }

  const progress = STATUS_PROGRESS[status];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#00143D] flex flex-col items-center justify-center px-4 font-[Helvetica,Arial,sans-serif]">

      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      <div className="w-full max-w-xl relative z-10">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://qrapd3qjiankddu3.public.blob.vercel-storage.com/logos/logo%20seazone%20full%20branca.png"
              alt="Seazone"
              className="h-10 object-contain"
            />
          </div>
          <p className="text-[#FC6058] text-xs tracking-[0.3em] uppercase font-medium">
            Creative Generator
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

          {/* ── Estado: done ── */}
          {status === "done" && result ? (
            <div>
              {/* Cabeçalho de sucesso */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#FC6058]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FC6058" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white text-base font-semibold leading-tight">Criativo aprovado!</h2>
                  <p className="text-white/40 text-xs mt-0.5">{result.fileName}</p>
                </div>
                {/* Badge de nota */}
                <div className="ml-auto flex-shrink-0 bg-[#FC6058]/15 border border-[#FC6058]/30 rounded-lg px-3 py-1.5 text-center">
                  <div className="text-[#FC6058] text-lg font-bold leading-none">{result.nota}</div>
                  <div className="text-[#FC6058]/60 text-[10px] font-medium tracking-wide">/10</div>
                </div>
              </div>

              {/* Preview */}
              <div className="mb-5 rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.previewUrl}
                  alt="Preview do criativo"
                  className="w-full object-cover"
                />
              </div>

              {/* Botão baixar */}
              <a
                href={result.previewUrl}
                download={result.fileName}
                className="flex items-center justify-center gap-2 w-full bg-[#FC6058] hover:bg-[#e55550] text-white py-3.5 px-5 rounded-xl text-sm font-semibold transition-colors mb-4"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Baixar PNG
              </a>

              {/* Copy paste de nomenclatura */}
              {result.copyPaste && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs tracking-[0.15em] uppercase font-medium">
                      Nomenclatura / Copy paste
                    </span>
                    <button
                      onClick={handleCopy}
                      className="text-[#6593FF] hover:text-white text-xs transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copiar
                    </button>
                  </div>
                  <textarea
                    ref={copyRef}
                    readOnly
                    value={result.copyPaste}
                    rows={8}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white/60 text-xs font-mono leading-relaxed resize-none outline-none select-all"
                  />
                </div>
              )}

              {/* Gerar outro */}
              <button
                onClick={handleReset}
                className="w-full text-white/30 hover:text-white/60 text-sm py-2 transition-colors"
              >
                Gerar outro criativo
              </button>
            </div>

          ) : status === "error" ? (
            /* ── Estado: erro ── */
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h2 className="text-white text-base font-semibold mb-2">Algo deu errado</h2>
              <p className="text-red-400/80 text-sm mb-6 leading-relaxed">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                Tentar novamente
              </button>
            </div>

          ) : (
            /* ── Estado: idle / running ── */
            <>
              <label className="block text-white/50 text-xs tracking-[0.2em] uppercase font-medium mb-3">
                Link do briefing
              </label>

              <div className="mb-5">
                <input
                  ref={inputRef}
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="docs.google.com/… ou lovable.app/…"
                  disabled={isRunning}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/20 outline-none focus:border-[#0055FF]/60 focus:bg-white/[0.08] transition-all disabled:opacity-40"
                />
              </div>

              {/* Barra de progresso */}
              {isRunning && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-xs flex items-center gap-2">
                      {STATUS_LABELS[status]}
                      {tentativa > 1 && (
                        <span className="text-white/25 text-[10px]">
                          tentativa {tentativa}/{MAX_TENTATIVAS}
                        </span>
                      )}
                    </span>
                    <span className="text-white/30 text-xs">{progress}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0055FF] to-[#FC6058] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Etapas visuais */}
                  <div className="flex justify-between mt-3 px-0.5">
                    {(["reading", "generating", "reviewing", "done"] as const).map((s, i) => {
                      const stepProgress = STATUS_PROGRESS[s];
                      const active = progress >= stepProgress;
                      const labels = ["Briefing", "Criativo", "Revisão", "Pronto"];
                      return (
                        <div key={s} className="flex flex-col items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                            style={{ background: active ? "#FC6058" : "rgba(255,255,255,0.15)" }}
                          />
                          <span
                            className="text-[10px] transition-colors duration-300"
                            style={{ color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}
                          >
                            {labels[i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!link.trim() || isRunning}
                className="w-full bg-[#FC6058] hover:bg-[#e55550] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm tracking-wide transition-all active:scale-[0.98]"
              >
                {isRunning ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Processando…
                  </span>
                ) : (
                  "Gerar Criativo"
                )}
              </button>

              <p className="text-white/20 text-xs text-center mt-4">
                Google Doc · Lovable · Link de briefing
              </p>
            </>
          )}
        </div>

        <p className="text-white/15 text-xs text-center mt-6 tracking-wider">
          SEAZONE INVESTIMENTOS — USO INTERNO
        </p>
      </div>
    </main>
  );
}
