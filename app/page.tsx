"use client";

import { useState, useRef } from "react";

type Status = "idle" | "reading" | "generating" | "mounting" | "done" | "error";

interface Result {
  previewUrl: string;
  fileName: string;
}

const STATUS_LABELS: Record<Status, string> = {
  idle: "",
  reading: "Lendo briefing…",
  generating: "Gerando imagem base…",
  mounting: "Montando overlays…",
  done: "Pronto!",
  error: "Erro no processo",
};

const STATUS_PROGRESS: Record<Status, number> = {
  idle: 0,
  reading: 25,
  generating: 55,
  mounting: 85,
  done: 100,
  error: 0,
};

export default function Home() {
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isRunning = status !== "idle" && status !== "done" && status !== "error";

  async function handleGenerate() {
    if (!link.trim() || isRunning) return;
    setResult(null);
    setErrorMsg("");

    try {
      setStatus("reading");
      const briefingRes = await fetch("/api/ler-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      if (!briefingRes.ok) throw new Error("Falha ao ler o briefing");
      const briefing = await briefingRes.json();

      setStatus("generating");
      const imageRes = await fetch("/api/gerar-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing }),
      });
      if (!imageRes.ok) throw new Error("Falha ao gerar imagem");
      const { imageUrl } = await imageRes.json();

      setStatus("mounting");
      const mountRes = await fetch("/api/montar-criativo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, briefing }),
      });
      if (!mountRes.ok) throw new Error("Falha ao montar criativo");
      const { finalImageUrl, fileName } = await mountRes.json();

      setResult({ previewUrl: finalImageUrl, fileName });
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
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const progress = STATUS_PROGRESS[status];

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
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-3">
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
          {status === "done" && result ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#FC6058]/20 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FC6058" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-white text-lg font-semibold mb-1">Criativo gerado!</h2>
              <p className="text-white/40 text-sm mb-6">{result.fileName}</p>

              {result.previewUrl && (
                <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
                  <img src={result.previewUrl} alt="Preview do criativo" className="w-full object-cover" />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <a
                  href={result.previewUrl}
                  download={result.fileName}
                  className="flex items-center justify-center gap-2 w-full bg-[#FC6058] hover:bg-[#e55550] text-white py-3.5 px-5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Baixar PNG
                </a>
                <button onClick={handleReset} className="text-white/30 hover:text-white/60 text-sm py-2 transition-colors">
                  Gerar outro criativo
                </button>
              </div>
            </div>
          ) : status === "error" ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h2 className="text-white text-base font-semibold mb-2">Algo deu errado</h2>
              <p className="text-red-400/80 text-sm mb-6">{errorMsg}</p>
              <button onClick={handleReset} className="text-white/40 hover:text-white/70 text-sm transition-colors">
                Tentar novamente
              </button>
            </div>
          ) : (
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

              {isRunning && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-xs">{STATUS_LABELS[status]}</span>
                    <span className="text-white/30 text-xs">{progress}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0055FF] to-[#FC6058] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
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
