'use client';

import { useState, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Vertical = 'szi' | null;
type Formato = 'feed' | 'reels' | null;
type Fase = 'Teaser' | 'Pré-Criativo' | 'Lançamento';

interface FormData {
  empreendimento: string;
  fase: Fase;
  pontosFortes: string[];
  copy: string;
  imagemUrl: string | null;
}

const PONTOS_FORTES = [
  { id: 'roi', label: 'ROI 16,4% ao ano' },
  { id: 'localizacao', label: 'Localização' },
  { id: 'rendimento', label: 'Rendimento ~R$ 5.500/mês' },
  { id: 'fachada', label: 'Fachada' },
  { id: 'rooftop', label: 'Rooftop' },
];

const COPY_PLACEHOLDERS: Record<Fase, string> = {
  Teaser: 'Vem aí uma nova oportunidade para você investir em Novo Campeche, Florianópolis — SC. Invista em imóveis que geram renda passiva.',
  'Pré-Criativo': 'Tenha renda passiva com um Airbnb em um dos bairros com maior faturamento de Florianópolis. 16,4% ao ano de retorno líquido com aluguel por temporada.',
  Lançamento: 'Novo Campeche SPOT II — o investimento que trabalha por você. ROI de 16,4% ao ano, rendimento de ~R$5.500/mês. Gestão profissional Seazone: você investe, nós gerenciamos.',
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const STEPS = ['Vertical', 'Formato', 'Dados', 'Preview'];

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            <div className="flex flex-col items-center" style={{ minWidth: 40 }}>
              <div
                className="flex items-center justify-center rounded-full text-xs font-bold transition-all duration-200"
                style={{
                  width: 32,
                  height: 32,
                  background: done ? '#0055FF' : active ? '#0055FF' : '#0a2a6e',
                  color: done || active ? '#fff' : '#3a5a99',
                  border: active ? '2px solid #6593FF' : '2px solid transparent',
                  boxShadow: active ? '0 0 0 3px rgba(0,85,255,0.2)' : 'none',
                }}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : idx}
              </div>
              <span
                className="text-xs mt-1.5 font-medium whitespace-nowrap"
                style={{ color: active ? '#fff' : done ? '#6593FF' : '#3a5a99' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 mx-2 mt-[-14px]"
                style={{
                  height: 2,
                  background: done ? '#0055FF' : '#0a2a6e',
                  transition: 'background 0.2s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Vertical ───────────────────────────────────────────────────────

function StepVertical({ selected, onSelect }: { selected: Vertical; onSelect: (v: Vertical) => void }) {
  const verticals = [
    {
      id: 'szi' as Vertical,
      title: 'SZI Investimentos',
      description: 'Criativos para lançamento de empreendimentos',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
      disabled: false,
    },
    {
      id: null as Vertical,
      title: 'SZS Hóspedes',
      description: 'Em breve',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      disabled: true,
    },
    {
      id: null as Vertical,
      title: 'SZS Proprietários',
      description: 'Em breve',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      disabled: true,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Escolha a vertical</h2>
      <p className="text-sm mb-6" style={{ color: '#6593FF' }}>Selecione a linha de comunicação do criativo.</p>
      <div className="flex flex-col gap-3">
        {verticals.map(({ id, title, description, icon, disabled }, i) => {
          const isActive = selected === id && id !== null;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && onSelect(id)}
              className="flex items-center gap-5 rounded-xl px-6 text-left transition-all duration-150"
              style={{
                height: 200,
                background: isActive ? '#0055FF' : '#000D26',
                border: isActive ? '2px solid #6593FF' : '2px solid #0a2a6e',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{
                  width: 64,
                  height: 64,
                  background: isActive ? 'rgba(255,255,255,0.2)' : '#0a2a6e',
                  color: isActive ? '#fff' : '#6593FF',
                }}
              >
                {icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-white text-lg">{title}</span>
                  {disabled && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: '#0a2a6e', color: '#6593FF' }}
                    >
                      Em breve
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-md font-semibold"
                      style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                    >
                      Selecionado
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#6593FF' }}>
                  {description}
                </p>
              </div>
              {isActive && (
                <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.25)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2 — Formato ─────────────────────────────────────────────────────────

function StepFormato({ selected, onSelect }: { selected: Formato; onSelect: (f: Formato) => void }) {
  const formatos = [
    {
      id: 'feed' as Formato,
      label: 'Feed 4:5',
      dims: '1080 × 1350px',
      w: 80,
      h: 100,
    },
    {
      id: 'reels' as Formato,
      label: 'Reels 9:16',
      dims: '1080 × 1920px',
      w: 56,
      h: 100,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Escolha o formato</h2>
      <p className="text-sm mb-6" style={{ color: '#6593FF' }}>Selecione o formato do criativo estático.</p>
      <div className="flex gap-4">
        {formatos.map(({ id, label, dims, w, h }) => {
          const isActive = selected === id;
          return (
            <button
              key={id!}
              onClick={() => onSelect(id)}
              className="flex flex-col items-center rounded-xl p-6 transition-all duration-150"
              style={{
                flex: 1,
                background: isActive ? '#0055FF' : '#000D26',
                border: isActive ? '2px solid #6593FF' : '2px solid #0a2a6e',
                cursor: 'pointer',
              }}
            >
              {/* Visual preview of aspect ratio */}
              <div className="flex items-end justify-center mb-5" style={{ height: 120 }}>
                <div
                  className="rounded-lg flex items-center justify-center"
                  style={{
                    width: w,
                    height: h,
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#0a2a6e',
                    border: isActive ? '2px solid rgba(255,255,255,0.4)' : '2px solid #1e3a7a',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Simulated photo lines */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
                    background: isActive ? 'rgba(0,20,61,0.5)' : 'rgba(0,10,30,0.6)',
                  }} />
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isActive ? 'rgba(255,255,255,0.6)' : '#3a5a99'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              </div>
              <span className="font-bold text-white text-base mb-1">{label}</span>
              <span className="text-xs" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#3a5a99' }}>{dims}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3 — Dados ──────────────────────────────────────────────────────────

function StepDados({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  function togglePonto(id: string) {
    const has = data.pontosFortes.includes(id);
    onChange({ pontosFortes: has ? data.pontosFortes.filter((p) => p !== id) : [...data.pontosFortes, id] });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ imagemUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: '#000D26',
    border: '1px solid #0a2a6e',
    borderRadius: 8,
    color: '#fff',
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#6593FF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Preencha os dados</h2>
      <p className="text-sm mb-6" style={{ color: '#6593FF' }}>Informações que serão usadas para montar o criativo.</p>

      <div className="flex flex-col gap-5">
        {/* Empreendimento */}
        <div>
          <label style={labelStyle}>Empreendimento</label>
          <div style={{ position: 'relative' }}>
            <select
              style={selectStyle}
              value={data.empreendimento}
              onChange={(e) => onChange({ empreendimento: e.target.value })}
            >
              <option>Novo Campeche SPOT II</option>
            </select>
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6593FF' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Fase */}
        <div>
          <label style={labelStyle}>Fase da campanha</label>
          <div style={{ position: 'relative' }}>
            <select
              style={selectStyle}
              value={data.fase}
              onChange={(e) => onChange({ fase: e.target.value as Fase })}
            >
              <option>Teaser</option>
              <option>Pré-Criativo</option>
              <option>Lançamento</option>
            </select>
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6593FF' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Pontos fortes */}
        <div>
          <label style={labelStyle}>Pontos fortes</label>
          <div className="flex flex-col gap-2">
            {PONTOS_FORTES.map(({ id, label }) => {
              const checked = data.pontosFortes.includes(id);
              return (
                <label
                  key={id}
                  className="flex items-center gap-3 cursor-pointer"
                  style={{ padding: '8px 14px', borderRadius: 8, background: checked ? 'rgba(0,85,255,0.15)' : 'transparent', border: `1px solid ${checked ? '#0055FF' : '#0a2a6e'}` }}
                >
                  <div
                    className="flex items-center justify-center rounded flex-shrink-0"
                    style={{ width: 18, height: 18, background: checked ? '#0055FF' : '#0a2a6e', border: checked ? 'none' : '1px solid #1e3a7a' }}
                    onClick={() => togglePonto(id)}
                  >
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-white" onClick={() => togglePonto(id)}>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Copy */}
        <div>
          <label style={labelStyle}>Copy principal</label>
          <textarea
            rows={4}
            value={data.copy}
            placeholder={COPY_PLACEHOLDERS[data.fase]}
            onChange={(e) => onChange({ copy: e.target.value })}
            style={{
              ...selectStyle,
              resize: 'vertical',
              lineHeight: '1.5',
            }}
          />
          <p className="text-xs mt-1.5" style={{ color: '#3a5a99' }}>
            Deixe em branco para usar o texto sugerido para a fase <strong style={{ color: '#6593FF' }}>{data.fase}</strong>.
          </p>
        </div>

        {/* Imagem */}
        <div>
          <label style={labelStyle}>Imagem base</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-150"
            style={{
              height: 120,
              background: data.imagemUrl ? 'transparent' : '#000D26',
              border: '2px dashed #0a2a6e',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {data.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imagemUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a5a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-medium" style={{ color: '#6593FF' }}>Clique para fazer upload</span>
                <span className="text-xs mt-1" style={{ color: '#3a5a99' }}>JPG, PNG, WebP — foto real ou render</span>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {data.imagemUrl && (
            <button
              onClick={() => onChange({ imagemUrl: null })}
              className="text-xs mt-2"
              style={{ color: '#FC6058' }}
            >
              Remover imagem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 — Preview ─────────────────────────────────────────────────────────

function StepPreview({ formato, data }: { formato: Formato; data: FormData }) {
  const isReels = formato === 'reels';
  const aspectRatio = isReels ? '9/16' : '4/5';
  const dimLabel = isReels ? '1080 × 1920px' : '1080 × 1350px';
  const copyText = data.copy || COPY_PLACEHOLDERS[data.fase];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Preview do criativo</h2>
      <p className="text-sm mb-6" style={{ color: '#6593FF' }}>
        Formato: <strong className="text-white">{formato === 'feed' ? 'Feed 4:5' : 'Reels 9:16'}</strong> — {dimLabel}
      </p>

      <div className="flex gap-8 items-start">
        {/* Preview canvas */}
        <div style={{ flex: '0 0 auto', width: isReels ? 240 : 300 }}>
          <div
            style={{
              width: '100%',
              aspectRatio,
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#001133',
              border: '2px solid #0a2a6e',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Background image or gradient */}
            {data.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.imagemUrl}
                alt="Criativo"
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(160deg, #001f5c 0%, #00143d 40%, #0a2a6e 100%)',
                }}
              />
            )}

            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,20,61,0.3) 0%, transparent 40%, rgba(0,20,61,0.8) 100%)' }} />

            {/* Pin de localização */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0,20,61,0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: 20,
                padding: '5px 10px 5px 8px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FC6058" stroke="#FC6058" strokeWidth="1">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span style={{ color: '#fff', fontSize: 9, fontWeight: 600, letterSpacing: '0.02em' }}>
                Novo Campeche, Florianópolis - SC
              </span>
            </div>

            {/* Fase tag */}
            {data.fase === 'Lançamento' && (
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: '#FC6058',
                  borderRadius: 4,
                  padding: '3px 8px',
                }}
              >
                <span style={{ color: '#fff', fontSize: 8, fontWeight: 800, letterSpacing: '0.1em' }}>LANÇAMENTO</span>
              </div>
            )}

            {/* Copy text (middle area) */}
            {data.fase === 'Teaser' && (
              <div style={{ position: 'absolute', top: '35%', left: 14, right: 14, textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                  Vem aí
                </div>
              </div>
            )}

            {/* Bottom navy bar with financial data */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,20,61,0.95)',
                padding: '10px 14px 12px',
              }}
            >
              {data.fase !== 'Teaser' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#FC6058', fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>16,4%</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7, fontWeight: 500, marginTop: 1 }}>ROI AO ANO</div>
                  </div>
                  <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>~R$5.500</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7, fontWeight: 500, marginTop: 1 }}>POR MÊS</div>
                  </div>
                  <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#fff', fontSize: 9, fontWeight: 600 }}>Gestão</div>
                    <div style={{ color: '#6593FF', fontSize: 9, fontWeight: 700 }}>Seazone</div>
                  </div>
                </div>
              )}
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: data.fase === 'Teaser' ? 'space-between' : 'flex-end' }}>
                {data.fase === 'Teaser' && (
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, fontStyle: 'italic', maxWidth: '70%' }}>
                    Invista em imóveis que geram renda passiva.
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#FC6058">
                    <path d="M3 12L12 3l9 9v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z" />
                  </svg>
                  <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.02em' }}>seazone</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs mt-2" style={{ color: '#3a5a99' }}>
            {formato === 'feed' ? 'Feed 4:5' : 'Reels 9:16'} — {dimLabel}
          </p>
        </div>

        {/* Info panel */}
        <div style={{ flex: 1 }}>
          <div
            className="rounded-xl p-5 mb-4"
            style={{ background: '#000D26', border: '1px solid #0a2a6e' }}
          >
            <h3 className="text-sm font-semibold text-white mb-3">Resumo do criativo</h3>
            <div className="flex flex-col gap-2">
              <Row label="Vertical" value="SZI Investimentos" />
              <Row label="Empreendimento" value={data.empreendimento} />
              <Row label="Fase" value={data.fase} />
              <Row label="Formato" value={formato === 'feed' ? 'Feed 4:5' : 'Reels 9:16'} />
              {data.pontosFortes.length > 0 && (
                <Row
                  label="Pontos fortes"
                  value={data.pontosFortes.map((id) => PONTOS_FORTES.find((p) => p.id === id)?.label ?? id).join(', ')}
                />
              )}
            </div>
          </div>

          <div
            className="rounded-xl p-5 mb-5"
            style={{ background: '#000D26', border: '1px solid #0a2a6e' }}
          >
            <h3 className="text-sm font-semibold text-white mb-2">Copy utilizada</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6593FF' }}>{copyText}</p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3">
            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-sm transition-all duration-150"
              style={{ background: '#0055FF' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Gerar Criativo
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm transition-all duration-150"
              style={{ background: '#FC6058' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs flex-shrink-0" style={{ color: '#3a5a99' }}>{label}</span>
      <span className="text-xs text-right" style={{ color: '#fff' }}>{value}</span>
    </div>
  );
}

// ─── Main Flow ────────────────────────────────────────────────────────────────

export default function CriativosFlow() {
  const [step, setStep] = useState(1);
  const [vertical, setVertical] = useState<Vertical>(null);
  const [formato, setFormato] = useState<Formato>(null);
  const [formData, setFormData] = useState<FormData>({
    empreendimento: 'Novo Campeche SPOT II',
    fase: 'Teaser',
    pontosFortes: ['roi', 'localizacao', 'rendimento'],
    copy: '',
    imagemUrl: null,
  });

  function handleVerticalSelect(v: Vertical) {
    setVertical(v);
    if (v) setTimeout(() => setStep(2), 300);
  }

  function handleFormatoSelect(f: Formato) {
    setFormato(f);
    if (f) setTimeout(() => setStep(3), 300);
  }

  function canProceed() {
    if (step === 1) return vertical !== null;
    if (step === 2) return formato !== null;
    return true;
  }

  return (
    <div className="p-8" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-1" style={{ color: '#6593FF' }}>SZI Investimentos</p>
        <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
          Criativos Estáticos
        </h1>
      </div>

      {/* Progress */}
      <ProgressBar current={step} />

      {/* Step content */}
      <div
        className="rounded-xl p-7"
        style={{ background: '#000D26', border: '1px solid #0a2a6e' }}
      >
        {step === 1 && (
          <StepVertical selected={vertical} onSelect={handleVerticalSelect} />
        )}
        {step === 2 && (
          <StepFormato selected={formato} onSelect={handleFormatoSelect} />
        )}
        {step === 3 && (
          <StepDados
            data={formData}
            onChange={(partial) => setFormData((prev) => ({ ...prev, ...partial }))}
          />
        )}
        {step === 4 && (
          <StepPreview formato={formato} data={formData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-5">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{
            background: step === 1 ? 'transparent' : '#000D26',
            border: `1px solid ${step === 1 ? 'transparent' : '#0a2a6e'}`,
            color: step === 1 ? 'transparent' : '#6593FF',
            cursor: step === 1 ? 'default' : 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        {step < 4 && (
          <button
            disabled={!canProceed()}
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150"
            style={{
              background: canProceed() ? '#0055FF' : '#0a2a6e',
              color: canProceed() ? '#fff' : '#3a5a99',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
            }}
          >
            Próximo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
