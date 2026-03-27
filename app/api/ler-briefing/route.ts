import { NextRequest, NextResponse } from "next/server";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Briefing {
  // Dados do empreendimento
  empreendimento: string;
  vertical: "SZI" | "SZS";
  localizacao: string;
  fase: string;
  roi: string;
  rendimento_mensal: string;
  rendimento_anual: string;
  ticket_medio: string;
  pontos_fortes: string[];
  donts: string[];
  publico_alvo: string;

  // Gerado pelo Agente 1
  nomenclatura: Nomenclatura[];
  copy_paste: string;
}

export interface Nomenclatura {
  vertical: string;
  empreendimento: string;
  pontos_fortes_usados: string[];
  tipo: "estatico" | "video";
  versao: string;
  estrutura: string;
  variavel: string;
  hipotese: string;
  primeira_imagem: string;
  a_partir_de: string;
}

// ─── Briefings conhecidos ─────────────────────────────────────────────────────

const BRIEFINGS_CONHECIDOS: Record<string, Omit<Briefing, "nomenclatura" | "copy_paste">> = {
  "novocampechespotiilancamento.lovable.app": {
    empreendimento: "NOVO CAMPECHE SPOT II",
    vertical: "SZI",
    localizacao: "NOVO CAMPECHE, FLORIANÓPOLIS - SC",
    fase: "LANÇAMENTO",
    roi: "16,4%",
    rendimento_mensal: "~R$ 5.500/mês",
    rendimento_anual: "R$ 66.424/ano",
    ticket_medio: "R$ 350.190",
    pontos_fortes: [
      "ROI projetado de 16,4% ao ano",
      "Rentabilidade líquida mensal em reais",
      "Região consolidada com forte vocação turística",
      "Um dos bairros que mais faturam em Florianópolis e no Brasil",
      "Infraestrutura completa (mercados, farmácias, restaurantes)",
      "Modelo SPOT pensado desde a origem para short stay",
      "Gestão profissional Seazone",
      "Próximo ao aeroporto",
    ],
    donts: [
      "Pé na areia",
      "Vista para o mar nas unidades — só no rooftop",
      "Distância exata da praia",
      "Único lançamento ou exclusivo",
      "Filtros escuros, blur, molduras, efeitos dramáticos",
      "Não borrar as laterais da tela",
      "Não colocar músicas no vídeo",
      "Não usar efeitos que escureçam a imagem",
    ],
    publico_alvo: "Investidor com foco em performance e renda passiva, região com vocação turística",
  },
};

// ─── Gerador de nomenclatura ──────────────────────────────────────────────────

function gerarNomenclaturas(dados: Omit<Briefing, "nomenclatura" | "copy_paste">): Nomenclatura[] {
  const { empreendimento, vertical, rendimento_mensal, roi } = dados;

  // Gera 3 estruturas estáticas (como no briefing)
  const estruturas: Nomenclatura[] = [
    {
      vertical,
      empreendimento,
      pontos_fortes_usados: ["Localização", "ROI"],
      tipo: "estatico",
      versao: "V1",
      estrutura: "1",
      variavel: "Imagem aérea com tracejado até a praia",
      hipotese: "Localização próxima à praia gera maior interesse de investimento",
      primeira_imagem: "Vista aérea do Novo Campeche — mar visível, bairro consolidado",
      a_partir_de: roi,
    },
    {
      vertical,
      empreendimento,
      pontos_fortes_usados: ["Localização", "ROI", "Aspiracional"],
      tipo: "estatico",
      versao: "V1",
      estrutura: "2",
      variavel: "Ângulo do rooftop para o mar",
      hipotese: "Vista aspiracional do rooftop aumenta percepção de valor do investimento",
      primeira_imagem: "Rooftop com perspectiva em direção ao mar",
      a_partir_de: rendimento_mensal,
    },
    {
      vertical,
      empreendimento,
      pontos_fortes_usados: ["Fachada", "ROI"],
      tipo: "estatico",
      versao: "V1",
      estrutura: "3",
      variavel: "Fachada frontal com destaque financeiro",
      hipotese: "Fachada moderna + dado financeiro direto gera conversão com investidor racional",
      primeira_imagem: "Fachada do empreendimento — render ou foto, boa iluminação",
      a_partir_de: roi,
    },
  ];

  return estruturas;
}

// ─── Gerador de copy paste ────────────────────────────────────────────────────

function gerarCopyPaste(nomenclaturas: Nomenclatura[]): string {
  const linhas = nomenclaturas.map((n, i) => {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRIATIVO ${i + 1} — ${n.tipo.toUpperCase()} | ESTRUTURA ${n.estrutura}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vertical: ${n.vertical}
Empreendimento: ${n.empreendimento}
Pontos Fortes: ${n.pontos_fortes_usados.join(", ")}
Tipo: ${n.tipo}
Versão: ${n.versao}
Estrutura: ${n.estrutura}
Variável: ${n.variavel}
Hipótese: ${n.hipotese}
Primeira Imagem: ${n.primeira_imagem}
A partir de: ${n.a_partir_de}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`.trim();
  });

  return linhas.join("\n\n");
}

// ─── Extrator de domínio ──────────────────────────────────────────────────────

function extrairDominio(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace("www.", "").split("/")[0];
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL não informada" }, { status: 400 });
    }

    const dominio = extrairDominio(url);

    // 1. Briefing conhecido — resposta imediata
    const dadosConhecidos = BRIEFINGS_CONHECIDOS[dominio];
    if (dadosConhecidos) {
      const nomenclatura = gerarNomenclaturas(dadosConhecidos);
      const copy_paste = gerarCopyPaste(nomenclatura);
      const briefing: Briefing = { ...dadosConhecidos, nomenclatura, copy_paste };
      return NextResponse.json(briefing);
    }

    // 2. Leitura automática via Claude (quando ANTHROPIC_API_KEY estiver disponível)
    if (process.env.ANTHROPIC_API_KEY) {
      const pageRes = await fetch(url.startsWith("http") ? url : `https://${url}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        },
      });

      if (!pageRes.ok) throw new Error("Não foi possível acessar o link do briefing");

      const html = await pageRes.text();

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: `Você é um estrategista de marketing imobiliário. Analise este briefing e extraia APENAS o que está explicitamente nele.

TIPOS DE CRIATIVOS QUE EXISTEM:
1. ESTÁTICO - arte estática
2. NARRADO - vídeo com narração em áudio
3. APRESENTADOR - vídeo gerado com apresentador via Kling AI

REGRA DE FORMATOS (sempre gerar os dois):
- Cada criativo vira 2 peças: feed (1080x1350) + reels (1080x1920)
- Exemplo: 5 variações estáticas = 10 peças (5 feed + 5 reels)
- Se o briefing especificar resolução diferente, use a do briefing

PARA CADA CRIATIVO DO ARRAY, extraia do briefing:
- tipo: 'estatico' | 'narrado' | 'apresentador'
- variacao: número da variação (1, 2, 3...)
- formato: 'feed' | 'reels'
- copy: texto/copy específico desta peça conforme briefing
- imagemContexto: qual imagem usar (ex: 'fachada', 'rooftop', 'localização', 'área comum') conforme briefing
- render: qual render do blob usar baseado no imagemContexto
- hipotese: qual hipótese de comunicação esta peça testa

REGRAS OBRIGATÓRIAS:
- Não invente variações que não estejam no briefing
- Não assuma informações ausentes
- Se briefing não especificar quantidade, use 1 variação por tipo presente
- Expanda sempre nos 2 formatos (feed + reels)
- Copy e contexto de imagem devem vir literalmente do briefing

Retorne APENAS JSON válido, sem markdown, sem explicações:
{
  "empreendimento": { "nome": "", "localizacao": "", "roi": "", "rendimentoMensal": "", "rendimentoAnual": "", "fase": "", "diferenciais": [], "donts": [] },
  "nomenclatura": "",
  "criativos": [
    { "tipo": "", "variacao": 1, "formato": "", "copy": "", "imagemContexto": "", "render": "", "hipotese": "" }
  ]
}`,
          messages: [
            {
              role: "user",
              content: `Extraia os dados deste briefing Seazone:\n\n${html.slice(0, 15000)}`,
            },
          ],
        }),
      });

      if (claudeRes.ok) {
        const data = await claudeRes.json();
        const dadosExtraidos = JSON.parse(data.content[0].text);
        const nomenclatura = gerarNomenclaturas(dadosExtraidos);
        const copy_paste = gerarCopyPaste(nomenclatura);
        const briefing: Briefing = { ...dadosExtraidos, nomenclatura, copy_paste };
        return NextResponse.json(briefing);
      }
    }

    // 3. Link não reconhecido
    return NextResponse.json(
      {
        error: `Briefing não reconhecido. Configure ANTHROPIC_API_KEY para leitura automática de novos empreendimentos.`,
      },
      { status: 422 }
    );
  } catch (err: unknown) {
    console.error("[agente-1-briefing]", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
