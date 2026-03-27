import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL não informada" }, { status: 400 });
    }

    // 1. Buscar o HTML da página Lovable
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    if (!pageRes.ok) {
      throw new Error(`Não foi possível acessar o link: ${pageRes.statusText}`);
    }

    const html = await pageRes.text();

    // 2. Enviar o HTML para o Claude extrair os dados estruturados
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `Você é um extrator de dados de briefings imobiliários.
Analise o HTML de uma página de briefing e retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicações.
O JSON deve seguir exatamente esta estrutura:
{
  "empreendimento": "nome do empreendimento",
  "vertical": "SZI ou SZS",
  "localizacao": "cidade e estado",
  "roi": "percentual ex: 16,4%",
  "rendimento_mensal": "valor ex: R$ 5.500",
  "rendimento_anual": "valor ex: R$ 66.424",
  "ticket_medio": "valor ex: R$ 350.190",
  "fase": "ex: Lançamento, Pré-lançamento",
  "pontos_fortes": ["ponto 1", "ponto 2", "ponto 3"],
  "donts": ["proibição 1", "proibição 2"],
  "publico_alvo": "descrição do público"
}
Se algum campo não for encontrado, use null.`,
        messages: [
          {
            role: "user",
            content: `Extraia os dados deste briefing:\n\n${html.slice(0, 15000)}`,
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      throw new Error("Falha ao processar o briefing com IA");
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content[0].text;

    // 3. Parsear o JSON retornado pelo Claude
    const briefing = JSON.parse(rawText);

    return NextResponse.json(briefing);
  } catch (err: unknown) {
    console.error("[ler-briefing]", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
