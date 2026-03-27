import Link from 'next/link';

const metrics = [
  { label: 'Criativos Gerados', value: '0', sub: 'Nenhum ainda', color: '#0055FF' },
  { label: 'Formatos Disponíveis', value: '2', sub: 'Feed 4:5 · Reels 9:16', color: '#FC6058' },
  { label: 'Verticais Ativas', value: '1', sub: 'SZI Investimentos', color: '#0055FF' },
  { label: 'Assets Carregados', value: '0', sub: 'Nenhum ainda', color: '#FC6058' },
];

export default function Dashboard() {
  return (
    <div className="p-8" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#6593FF' }}>Bem-vindo à</p>
        <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
          Máquina de Criativos
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#6593FF' }}>
          Gere criativos profissionais seguindo o brandbook Seazone.
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {metrics.map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="rounded-xl p-6"
            style={{ background: '#000D26', border: '1px solid #0a2a6e' }}
          >
            <div
              className="text-4xl font-bold mb-1"
              style={{ color, letterSpacing: '-0.03em' }}
            >
              {value}
            </div>
            <div className="font-semibold text-white text-sm mb-1">{label}</div>
            <div className="text-xs" style={{ color: '#3a5a99' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div
        className="rounded-xl p-6 mb-4"
        style={{ background: '#000D26', border: '1px solid #0a2a6e' }}
      >
        <h2 className="font-semibold text-white mb-1">Ação rápida</h2>
        <p className="text-sm mb-4" style={{ color: '#6593FF' }}>
          Comece criando seu primeiro criativo para o Novo Campeche SPOT II.
        </p>
        <Link
          href="/criativos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#0055FF' }}
        >
          Criar novo criativo SZI
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Recent */}
      <div
        className="rounded-xl p-6"
        style={{ background: '#000D26', border: '1px solid #0a2a6e' }}
      >
        <h2 className="font-semibold text-white mb-4">Atividade recente</h2>
        <div className="flex flex-col items-center justify-center py-8">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-3" style={{ color: '#1e3a7a' }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p className="text-sm" style={{ color: '#3a5a99' }}>Nenhum criativo gerado ainda.</p>
          <p className="text-xs mt-1" style={{ color: '#1e3a7a' }}>Seus criativos aparecerão aqui após a geração.</p>
        </div>
      </div>
    </div>
  );
}
