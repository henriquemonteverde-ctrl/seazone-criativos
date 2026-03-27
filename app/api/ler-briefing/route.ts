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

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL não informada" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // 1. Fetch do HTML da página
    const pageRes = await fetch(url.startsWith("http") ? url : `https://${url}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    if (!pageRes.ok) throw new Error("Não foi possível acessar o link do briefing");

    const html = await pageRes.text();

      // ── ETAPA 1: Extrair dados do empreendimento ────────────────────────────
      const etapa1Prompt = `Você é um assistente que extrai dados estruturados de briefings imobiliários. Leia o conteúdo e retorne APENAS JSON válido, sem markdown, sem explicações.

Retorne exatamente neste formato:
{
  "nome": "",
  "localizacao": "",
  "roi": "",
  "rendimentoMensal": "",
  "rendimentoAnual": "",
  "ticketMedio": "",
  "fase": "",
  "diferenciais": [],
  "donts": [],
  "publicoAlvo": "",
  "tiposDeCriativos": [],
  "variacoesPorTipo": {}
}

Extraia os dados deste briefing Seazone:

${html.slice(0, 6000)}`;

      const etapa1Res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: etapa1Prompt }] }],
        }),
      });

      if (!etapa1Res.ok) {
        const errText = await etapa1Res.text();
        throw new Error(`Claude API etapa 1 ${etapa1Res.status}: ${errText}`);
      }

      const etapa1Data = await etapa1Res.json();
      const etapa1Text: string = etapa1Data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const dadosEmpreendimento = JSON.parse(etapa1Text.replace(/```json|```/g, "").trim());
      console.log("ETAPA1:", JSON.stringify(dadosEmpreendimento));

      // ── ETAPA 2: Gerar plano de criativos ──────────────────────────────────
      console.log("INICIANDO ETAPA2");
      const etapa2Prompt = `Você é um estrategista de marketing imobiliário. Com base nos dados estruturados do empreendimento, gere o array de criativos.

TIPOS DE CRIATIVOS:
1. ESTÁTICO - arte estática
2. NARRADO - vídeo com narração em áudio
3. APRESENTADOR - vídeo gerado com apresentador via Kling AI

REGRA DE FORMATOS (sempre gerar os dois):
- Cada criativo vira 2 peças: feed (1080x1350) + reels (1080x1920)

IMPORTANTE: O array criativos é OBRIGATÓRIO. Sempre retorne pelo menos 2 itens no array criativos (feed + reels do tipo estático), mesmo que o briefing não especifique explicitamente.

REGRAS:
- Não invente variações além do que os dados indicam
- Se tiposDeCriativos estiver vazio, use 1 variação estática expandida nos 2 formatos
- Expanda sempre nos 2 formatos (feed + reels)

Retorne APENAS JSON válido, sem markdown, sem explicações:
{
  "criativos": [
    { "tipo": "", "variacao": 1, "formato": "", "copy": "", "imagemContexto": "", "render": "", "hipotese": "" }
  ]
}

Dados do empreendimento:
${JSON.stringify(dadosEmpreendimento, null, 2)}

Gere o array de criativos.`;

      const etapa2Res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: etapa2Prompt }] }],
        }),
      });

      const criativosFallback = [
        { tipo: "estatico", variacao: 1, formato: "feed", copy: dadosEmpreendimento.nome, imagemContexto: "fachada", render: "render-01", hipotese: "Fachada principal" },
        { tipo: "estatico", variacao: 1, formato: "reels", copy: dadosEmpreendimento.nome, imagemContexto: "fachada", render: "render-01", hipotese: "Fachada principal" },
      ];

      try {
        if (!etapa2Res.ok) {
          const errText = await etapa2Res.text();
          throw new Error(`Claude API etapa 2 ${etapa2Res.status}: ${errText}`);
        }

        const etapa2Data = await etapa2Res.json();
        const etapa2Text: string = etapa2Data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        console.log("ETAPA2 RAW:", etapa2Text);
        const dadosCriativos = JSON.parse(etapa2Text.replace(/```json|```/g, "").trim());

        // ── Combinar resultados ───────────────────────────────────────────────
        const dadosExtraidos = { empreendimento: dadosEmpreendimento, ...dadosCriativos };
        const nomenclatura = gerarNomenclaturas(dadosExtraidos);
        const copy_paste = gerarCopyPaste(nomenclatura);
        const briefing: Briefing = { ...dadosExtraidos, nomenclatura, copy_paste };
        return NextResponse.json(briefing);
      } catch (e) {
        console.error("[agente-1-etapa2]", e);
        return NextResponse.json({
          ...dadosEmpreendimento,
          nomenclatura: "",
          copy_paste: "",
          criativos: criativosFallback,
        });
      }
  } catch (err: unknown) {
    console.error("[agente-1-briefing]", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
