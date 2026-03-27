import { NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/client";
import sharp from "sharp";

import type { Briefing } from "../ler-briefing/route";

// ─── Cores brandbook Seazone ──────────────────────────────────────────────────

const CORAL = "#FC6058";
const NAVY  = "#00143D";
const WHITE = "#FFFFFF";

// ─── Assets via Vercel Blob ───────────────────────────────────────────────────

const BLOB    = "https://qrapd3qjiankddu3.public.blob.vercel-storage.com";
const RENDERS = "empreendimentos/novo-campeche-ii/renders";

function renderUrl(fileName: string): string {
  return `${BLOB}/${RENDERS}/${encodeURIComponent(fileName)}`;
}

// Renders por formato e estrutura
const RENDER_FEED: Record<number, string> = {
  1: renderUrl("Cópia de Novo Campeche Spot II_01_V07.png"),
  2: renderUrl("Cópia de Novo Campeche Spot II_02_V07.png"),
  3: renderUrl("Cópia de Novo Campeche Spot II_03_V07.png"),
};

// Render 04 é exclusivo para reels; demais como fallback sequencial
const RENDER_REELS: Record<number, string> = {
  1: renderUrl("Cópia de Novo Campeche Spot II_04_V07.png"),
  2: renderUrl("Cópia de Novo Campeche Spot II_05_Inserção.png"),
  3: renderUrl("Cópia de Novo Campeche Spot II_07.png"),
};

const ASSETS = {
  logoSeazone: `${BLOB}/logos/logo%20seazone%20full%20branca.png`,
};

// ─── Formatos de saída ────────────────────────────────────────────────────────

const FORMATOS = {
  feed:  { w: 1080, h: 1350 },
  reels: { w: 1080, h: 1920 },
};

// ─── Utilitário: fetch → Buffer ───────────────────────────────────────────────

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar asset: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Upscale via fal-ai/clarity-upscaler ─────────────────────────────────────

async function upscaleUrl(imageUrl: string): Promise<string> {
  if (!process.env.FAL_KEY) return imageUrl;

  fal.config({ credentials: process.env.FAL_KEY });

  const result = await fal.subscribe("fal-ai/clarity-upscaler", {
    input: {
      image_url:           imageUrl,
      scale:               2,
      creativity:          0.35,
      resemblance:         0.9,
      num_inference_steps: 18,
    },
  }) as { data?: { image?: { url?: string } } };

  const upscaledUrl = result?.data?.image?.url;
  if (!upscaledUrl) throw new Error("Upscaler não retornou URL");
  return upscaledUrl;
}

// ─── SVG de overlays ─────────────────────────────────────────────────────────

function buildOverlaySVG(
  briefing: Briefing,
  formato: { w: number; h: number },
  estrutura: number
): string {
  const { w, h } = formato;
  const { empreendimento, localizacao, roi, rendimento_mensal, rendimento_anual, fase } = briefing;

  const isLancamento = fase?.toUpperCase().includes("LANÇA");
  const isFeed = h === 1350;

  // Tipografia responsiva por formato
  const roiSize   = isFeed ? 72 : 82;
  const labelSize = isFeed ? 20 : 23;
  const valorSize = isFeed ? 28 : 32;
  const nomeSize  = isFeed ? 22 : 26;
  const localSize = isFeed ? 15 : 18;
  const tagSize   = isFeed ? 18 : 20;
  const barraH    = isFeed ? 280 : 320;
  const barraY    = h - barraH;

  // Tracejado só na estrutura 1 (aérea, indica acesso à praia)
  const tracejado =
    estrutura === 1
      ? `<line x1="${w * 0.35}" y1="${h * 0.55}" x2="${w * 0.65}" y2="${h * 0.28}"
           stroke="${CORAL}" stroke-width="2.5" stroke-dasharray="10,7" opacity="0.9"/>
         <circle cx="${w * 0.65}" cy="${h * 0.28}" r="10" fill="${CORAL}" opacity="0.9"/>
         <circle cx="${w * 0.65}" cy="${h * 0.28}" r="20" fill="${CORAL}" opacity="0.2"/>`
      : "";

  return `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

  <!-- ── TAG LANÇAMENTO (topo esquerdo) ── -->
  ${isLancamento ? `
  <rect x="44" y="44" width="${isFeed ? 215 : 240}" height="50" rx="6" fill="${CORAL}"/>
  <text x="${isFeed ? 151 : 164}" y="76"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="${tagSize}" font-weight="800" fill="${WHITE}"
    text-anchor="middle" letter-spacing="3.5">
    LANÇAMENTO
  </text>` : ""}

  <!-- ── TRACEJADO ATÉ A PRAIA (estrutura 1) ── -->
  ${tracejado}

  <!-- ── PIN + NOME DO EMPREENDIMENTO ── -->
  <g transform="translate(${w / 2}, ${h * 0.2})">
    <rect x="-230" y="-34" width="460" height="68" rx="12"
      fill="${NAVY}" opacity="0.72"/>
    <!-- pin coral -->
    <circle cx="-195" cy="-2" r="13" fill="${CORAL}"/>
    <circle cx="-195" cy="-6" r="6" fill="${WHITE}" opacity="0.9"/>
    <ellipse cx="-195" cy="12" rx="4" ry="2" fill="${CORAL}" opacity="0.5"/>
    <!-- nome -->
    <text x="-168" y="10"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="${nomeSize}" font-weight="800" fill="${WHITE}"
      letter-spacing="1.8">
      ${empreendimento.toUpperCase()}
    </text>
  </g>

  <!-- ── LOCALIZAÇÃO ── -->
  <g transform="translate(${w / 2}, ${h * 0.2 + 56})">
    <rect x="-190" y="-20" width="380" height="40" rx="8"
      fill="${WHITE}" opacity="0.1"/>
    <text x="0" y="10"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="${localSize}" fill="${WHITE}"
      text-anchor="middle" letter-spacing="1.5" opacity="0.88">
      ${localizacao.toUpperCase()}
    </text>
  </g>

  <!-- ── BARRA NAVY INFERIOR ── -->
  <rect x="0" y="${barraY}" width="${w}" height="${barraH}" fill="${NAVY}"/>
  <!-- linha coral decorativa no topo da barra -->
  <rect x="0" y="${barraY}" width="${w}" height="4" fill="${CORAL}"/>
  <!-- bloco coral lateral esquerdo -->
  <rect x="0" y="${barraY}" width="8" height="${barraH}" fill="${CORAL}"/>

  <!-- ── ROI PRINCIPAL ── -->
  <text x="${w / 2}" y="${barraY + (isFeed ? 88 : 100)}"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="${roiSize}" font-weight="900" fill="${WHITE}"
    text-anchor="middle" letter-spacing="-2">
    ${roi} ao ano
  </text>

  <!-- ── LABEL "RETORNO ESTIMADO" ── -->
  <text x="${w / 2}" y="${barraY + (isFeed ? 120 : 136)}"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="${labelSize}" font-weight="600" fill="${CORAL}"
    text-anchor="middle" letter-spacing="5">
    RETORNO ESTIMADO
  </text>

  <!-- ── DIVISOR HORIZONTAL ── -->
  <line x1="80" y1="${barraY + (isFeed ? 142 : 162)}"
        x2="${w - 80}" y2="${barraY + (isFeed ? 142 : 162)}"
    stroke="${WHITE}" stroke-width="1" opacity="0.12"/>

  <!-- ── RENDIMENTO MENSAL (esquerda) ── -->
  <text x="${w / 2 - (isFeed ? 185 : 205)}" y="${barraY + (isFeed ? 186 : 212)}"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="${valorSize}" font-weight="700" fill="${WHITE}"
    text-anchor="middle">
    ${rendimento_mensal}
  </text>
  <text x="${w / 2 - (isFeed ? 185 : 205)}" y="${barraY + (isFeed ? 210 : 240)}"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="13" fill="${WHITE}"
    text-anchor="middle" opacity="0.45" letter-spacing="2">
    POR MÊS
  </text>

  <!-- ── DIVISOR VERTICAL ── -->
  <line x1="${w / 2}" y1="${barraY + (isFeed ? 152 : 172)}"
        x2="${w / 2}" y2="${barraY + (isFeed ? 224 : 256)}"
    stroke="${WHITE}" stroke-width="1" opacity="0.12"/>

  <!-- ── RENDIMENTO ANUAL (direita) ── -->
  <text x="${w / 2 + (isFeed ? 185 : 205)}" y="${barraY + (isFeed ? 186 : 212)}"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="${valorSize}" font-weight="700" fill="${WHITE}"
    text-anchor="middle">
    ${rendimento_anual}
  </text>
  <text x="${w / 2 + (isFeed ? 185 : 205)}" y="${barraY + (isFeed ? 210 : 240)}"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="13" fill="${WHITE}"
    text-anchor="middle" opacity="0.45" letter-spacing="2">
    POR ANO
  </text>

  <!-- ── DISCLAIMER ── -->
  <text x="${w / 2}" y="${barraY + (isFeed ? 242 : 278)}"
    font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
    font-size="12" fill="${WHITE}"
    text-anchor="middle" opacity="0.3">
    *Valores estimados. Rentabilidade não é garantida.
  </text>

  <!-- ── LOGO SEAZONE VIA BLOB ── -->
  <image
    href="${ASSETS.logoSeazone}"
    x="${w / 2 - 65}" y="${barraY + barraH - 54}"
    width="130" height="32"
    preserveAspectRatio="xMidYMid meet"
    opacity="0.88"/>

</svg>`.trim();
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { briefing, formato = "feed", estrutura = 1 } = (await req.json()) as {
      briefing: Briefing;
      formato: "feed" | "reels";
      estrutura: 1 | 2 | 3;
    };

    if (!briefing) {
      return NextResponse.json({ error: "Briefing não informado" }, { status: 400 });
    }

    const dim = FORMATOS[formato];

    // 1. Escolher render base conforme formato e estrutura
    const renderMap = formato === "reels" ? RENDER_REELS : RENDER_FEED;
    const imagemUrl = renderMap[estrutura] ?? renderMap[1];

    // 2. Tentar upscale via fal-ai/clarity-upscaler; fallback para URL original
    let finalImageUrl = imagemUrl;
    try {
      finalImageUrl = await upscaleUrl(imagemUrl);
      console.log(`[agente-2-produtor] upscale OK → ${finalImageUrl}`);
    } catch (upscaleErr) {
      console.warn("[agente-2-produtor] upscale falhou, usando render original:", upscaleErr);
      finalImageUrl = imagemUrl;
    }

    // 3. Baixar imagem upscalada (ou original) e redimensionar
    let base: Buffer;
    try {
      const imgBuffer = await fetchBuffer(finalImageUrl);
      base = await sharp(imgBuffer)
        .resize(dim.w, dim.h, { fit: "cover", position: "centre" })
        .toBuffer();
    } catch {
      // Render inacessível — usa fundo navy
      console.warn("[agente-2-produtor] render inacessível, usando fallback navy");
      base = await sharp({
        create: {
          width: dim.w,
          height: dim.h,
          channels: 3,
          background: { r: 0, g: 20, b: 61 },
        },
      })
        .png()
        .toBuffer();
    }

    // 4. Construir SVG de overlays e compor imagem final
    const svgStr    = buildOverlaySVG(briefing, dim, estrutura);
    const svgBuffer = Buffer.from(svgStr);

    const final = await sharp(base)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    // 5. Nome padronizado: SZI_slug_feed_V1_E1_timestamp.png
    const slug = briefing.empreendimento
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const fileName = `SZI_${slug}_${formato}_V1_E${estrutura}_${Date.now()}.png`;

    // 6. Retornar base64
    const dataUrl = `data:image/png;base64,${final.toString("base64")}`;

    return NextResponse.json({
      finalImageUrl: dataUrl,
      fileName,
      imagemBase: finalImageUrl,
      estrutura,
      formato,
    });
  } catch (err: unknown) {
    console.error("[agente-2-produtor]", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
