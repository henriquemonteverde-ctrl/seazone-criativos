import { NextRequest, NextResponse } from "next/server";

import type { Briefing } from "../ler-briefing/route";

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { finalImageUrl, briefing, fileName } = (await req.json()) as {
      finalImageUrl: string;
      briefing: Briefing;
      fileName: string;
    };

    if (!finalImageUrl || !briefing) {
      return NextResponse.json(
        { error: "finalImageUrl e briefing são obrigatórios" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY não configurada" },
        { status: 500 }
      );
    }

    // Extrair base64 puro (remove prefixo data:image/png;base64,)
    const base64Data = finalImageUrl.replace(/^data:image\/\w+;base64,/, "");

    const dontsFormatados = briefing.donts?.join("; ") ?? "nenhum especificado";

    const systemPrompt = `Você é o Agente 3 do sistema Seazone Creative Generator — Revisor de Qualidade.

Sua tarefa é avaliar criativos de mídia paga imobiliária produzidos pela Seazone.
Analise a imagem enviada e retorne APENAS um JSON válido, sem markdown, sem texto adicional.

Critérios de avaliação (cada um vale até 1,5 pontos, total máximo 10):
1. Legibilidade dos textos — todos os textos devem ser legíveis, sem sobreposição de elementos
2. Hierarquia de informação — ROI em destaque máximo, localização e rendimento em destaque secundário
3. Logo Seazone — visível e legível no rodapé da barra navy
4. Overlay semi-transparente — box navy não pode cobrir excessivamente a imagem de fundo
5. Cores corretas — coral #FC6058 em CTAs e destaques, navy #00143D na barra inferior
6. Don'ts respeitados — ausência de elementos proibidos: ${dontsFormatados}
7. Imagem de fundo — nítida, não escura demais, sem filtros que comprometam a qualidade

Estrutura obrigatória do JSON:
{
  "nota": <número inteiro de 1 a 10>,
  "aprovado": <true se nota >= 7, false caso contrário>,
  "feedback": "<string com avaliação detalhada — se aprovado, elogio breve; se reprovado, liste exatamente o que deve ser corrigido>"
}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: `Avalie este criativo Seazone.
Empreendimento: ${briefing.empreendimento}
Fase: ${briefing.fase}
Arquivo: ${fileName ?? "n/d"}
Retorne apenas o JSON de avaliação.`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error(`Erro na API do Claude: ${err}`);
    }

    const claudeData = await claudeRes.json();
    const rawText: string = claudeData.content?.[0]?.text ?? "";

    // Garante que o JSON está limpo mesmo se o modelo adicionar markdown
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const avaliacao = JSON.parse(cleaned) as {
      nota: number;
      aprovado: boolean;
      feedback: string;
    };

    // Força a regra de aprovação independente do que o modelo retornar
    avaliacao.aprovado = avaliacao.nota >= 7;

    console.log(`[agente-3-revisor] ${fileName} → nota ${avaliacao.nota} | aprovado: ${avaliacao.aprovado}`);

    return NextResponse.json(avaliacao);
  } catch (err: unknown) {
    console.error("[agente-3-revisor]", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
