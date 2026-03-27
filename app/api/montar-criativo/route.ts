import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

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
      upscale_factor:      2,
      creativity:          0.35,
      resemblance:         0.9,
      num_inference_steps: 18,
    },
  }) as { data?: { image?: { url?: string } } };

  const upscaledUrl = result?.data?.image?.url;
  if (!upscaledUrl) throw new Error("Upscaler não retornou URL");
  return upscaledUrl;
}

// ─── Overlay via Satori ───────────────────────────────────────────────────────

async function buildOverlayPNG(
  briefing: Briefing,
  formato: { w: number; h: number },
  estrutura: number,
  fontBuffer: ArrayBuffer,
  fontBoldBuffer: ArrayBuffer,
  logoBase64: string
): Promise<Buffer> {
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

  // Tracejado: linha diagonal até a praia (estrutura 1)
  const lineStartX  = w * 0.35;
  const lineStartY  = h * 0.55;
  const lineEndX    = w * 0.65;
  const lineEndY    = h * 0.28;
  const dx          = lineEndX - lineStartX;
  const dy          = lineEndY - lineStartY;
  const lineLength  = Math.sqrt(dx * dx + dy * dy);
  const lineAngle   = Math.atan2(dy, dx) * 180 / Math.PI;
  const lineMidX    = (lineStartX + lineEndX) / 2;
  const lineMidY    = (lineStartY + lineEndY) / 2;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

  // ── TAG LANÇAMENTO (topo esquerdo) ──
  if (isLancamento) {
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute",
          top: 44,
          left: 44,
          width: isFeed ? 215 : 240,
          height: 50,
          backgroundColor: CORAL,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: {
          type: "span",
          props: {
            style: {
              fontFamily: "Helvetica",
              fontSize: tagSize,
              fontWeight: 700,
              color: WHITE,
              letterSpacing: 3.5,
            },
            children: "LANÇAMENTO",
          },
        },
      },
    });
  }

  // ── TRACEJADO ATÉ A PRAIA (estrutura 1) ──
  if (estrutura === 1) {
    // Linha tracejada simulada com repeating-linear-gradient + rotate
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute",
          left: lineMidX - lineLength / 2,
          top: lineMidY - 1.25,
          width: lineLength,
          height: 2.5,
          backgroundImage: `repeating-linear-gradient(90deg, ${CORAL} 0px, ${CORAL} 10px, transparent 10px, transparent 17px)`,
          opacity: 0.9,
          transform: `rotate(${lineAngle}deg)`,
          transformOrigin: "50% 50%",
        },
      },
    });
    // Círculo externo (halo coral)
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute",
          left: lineEndX - 20,
          top: lineEndY - 20,
          width: 40,
          height: 40,
          backgroundColor: CORAL,
          borderRadius: "50%",
          opacity: 0.2,
        },
      },
    });
    // Círculo interno (sólido)
    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute",
          left: lineEndX - 10,
          top: lineEndY - 10,
          width: 20,
          height: 20,
          backgroundColor: CORAL,
          borderRadius: "50%",
          opacity: 0.9,
        },
      },
    });
  }

  // ── PIN + NOME DO EMPREENDIMENTO ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: w / 2 - 230,
        top: h * 0.2 - 34,
        width: 460,
        height: 68,
        backgroundColor: "rgba(0,20,61,0.72)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        paddingLeft: 20,
        paddingRight: 20,
      },
      children: [
        // Pin coral
        {
          type: "div",
          props: {
            style: {
              width: 26,
              height: 26,
              backgroundColor: CORAL,
              borderRadius: "50%",
              marginRight: 16,
              flexShrink: 0,
            },
          },
        },
        // Nome
        {
          type: "span",
          props: {
            style: {
              fontFamily: "Helvetica",
              fontSize: nomeSize,
              fontWeight: 700,
              color: WHITE,
              letterSpacing: 1.8,
            },
            children: empreendimento.toUpperCase(),
          },
        },
      ],
    },
  });

  // ── LOCALIZAÇÃO ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: w / 2 - 190,
        top: h * 0.2 + 36,
        width: 380,
        height: 40,
        backgroundColor: "rgba(255,255,255,0.10)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: {
            fontFamily: "Helvetica",
            fontSize: localSize,
            fontWeight: 400,
            color: "rgba(255,255,255,0.88)",
            letterSpacing: 1.5,
          },
          children: localizacao.toUpperCase(),
        },
      },
    },
  });

  // ── BARRA NAVY INFERIOR ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: 0,
        top: barraY,
        width: w,
        height: barraH,
        backgroundColor: NAVY,
      },
    },
  });

  // Linha coral decorativa no topo da barra
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: 0,
        top: barraY,
        width: w,
        height: 4,
        backgroundColor: CORAL,
      },
    },
  });

  // Bloco coral lateral esquerdo
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: 0,
        top: barraY,
        width: 8,
        height: barraH,
        backgroundColor: CORAL,
      },
    },
  });

  // ── ROI PRINCIPAL ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: 0,
        top: barraY + (isFeed ? 88 : 100) - roiSize,
        width: w,
        display: "flex",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: {
            fontFamily: "Helvetica",
            fontSize: roiSize,
            fontWeight: 700,
            color: WHITE,
            letterSpacing: -2,
          },
          children: `${roi} ao ano`,
        },
      },
    },
  });

  // ── LABEL "RETORNO ESTIMADO" ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: 0,
        top: barraY + (isFeed ? 120 : 136) - labelSize,
        width: w,
        display: "flex",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: {
            fontFamily: "Helvetica",
            fontSize: labelSize,
            fontWeight: 700,
            color: CORAL,
            letterSpacing: 5,
          },
          children: "RETORNO ESTIMADO",
        },
      },
    },
  });

  // ── DIVISOR HORIZONTAL ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: 80,
        top: barraY + (isFeed ? 142 : 162),
        width: w - 160,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.12)",
      },
    },
  });

  // ── RENDIMENTO MENSAL (esquerda) ──
  const mensalX = w / 2 - (isFeed ? 185 : 205);
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: mensalX - 100,
        top: barraY + (isFeed ? 186 : 212) - valorSize,
        width: 200,
        display: "flex",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: { fontFamily: "Helvetica", fontSize: valorSize, fontWeight: 700, color: WHITE },
          children: rendimento_mensal,
        },
      },
    },
  });
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: mensalX - 100,
        top: barraY + (isFeed ? 210 : 240) - 13,
        width: 200,
        display: "flex",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: {
            fontFamily: "Helvetica",
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 2,
          },
          children: "POR MÊS",
        },
      },
    },
  });

  // ── DIVISOR VERTICAL ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: w / 2,
        top: barraY + (isFeed ? 152 : 172),
        width: 1,
        height: (isFeed ? 224 : 256) - (isFeed ? 152 : 172),
        backgroundColor: "rgba(255,255,255,0.12)",
      },
    },
  });

  // ── RENDIMENTO ANUAL (direita) ──
  const anualX = w / 2 + (isFeed ? 185 : 205);
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: anualX - 100,
        top: barraY + (isFeed ? 186 : 212) - valorSize,
        width: 200,
        display: "flex",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: { fontFamily: "Helvetica", fontSize: valorSize, fontWeight: 700, color: WHITE },
          children: rendimento_anual,
        },
      },
    },
  });
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: anualX - 100,
        top: barraY + (isFeed ? 210 : 240) - 13,
        width: 200,
        display: "flex",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: {
            fontFamily: "Helvetica",
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 2,
          },
          children: "POR ANO",
        },
      },
    },
  });

  // ── DISCLAIMER ──
  children.push({
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: 0,
        top: barraY + (isFeed ? 242 : 278) - 12,
        width: w,
        display: "flex",
        justifyContent: "center",
      },
      children: {
        type: "span",
        props: {
          style: {
            fontFamily: "Helvetica",
            fontSize: 12,
            fontWeight: 400,
            color: "rgba(255,255,255,0.30)",
          },
          children: "*Valores estimados. Rentabilidade não é garantida.",
        },
      },
    },
  });

  // ── LOGO SEAZONE ──
  children.push({
    type: "img",
    props: {
      src: `data:image/png;base64,${logoBase64}`,
      style: {
        position: "absolute",
        left: w / 2 - 65,
        top: barraY + barraH - 54,
        width: 130,
        height: 32,
        opacity: 0.88,
      },
    },
  });

  // ── Render com Satori ──
  const element = {
    type: "div",
    props: {
      style: {
        position: "relative",
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      },
      children,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svgStr = await satori(element as any, {
    width: w,
    height: h,
    fonts: [
      { name: "Helvetica", data: fontBuffer,     weight: 400, style: "normal" },
      { name: "Helvetica", data: fontBoldBuffer,  weight: 700, style: "normal" },
    ],
  });

  const resvg   = new Resvg(svgStr);
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
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

    // 4. Baixar fontes e logo do Blob em paralelo
    const fontUrl     = `${BLOB}/identidade/${encodeURIComponent("Helvetica.ttf")}`;
    const fontBoldUrl = `${BLOB}/identidade/${encodeURIComponent("Helvetica-Bold.ttf")}`;
    const [fontRes, fontBoldRes, logoRes] = await Promise.all([
      fetch(fontUrl),
      fetch(fontBoldUrl),
      fetch(ASSETS.logoSeazone),
    ]);
    const fontBuffer     = await fontRes.arrayBuffer();
    const fontBoldBuffer = await fontBoldRes.arrayBuffer();
    const logoBase64     = Buffer.from(await logoRes.arrayBuffer()).toString("base64");

    // 5. Gerar overlay PNG via Satori + Resvg
    const overlayBuffer = await buildOverlayPNG(
      briefing, dim, estrutura, fontBuffer, fontBoldBuffer, logoBase64
    );

    // 6. Compositar overlay sobre o render base
    const final = await sharp(base)
      .composite([{ input: overlayBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    // 7. Nome padronizado: SZI_slug_feed_V1_E1_timestamp.png
    const slug = briefing.empreendimento
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const fileName = `SZI_${slug}_${formato}_V1_E${estrutura}_${Date.now()}.png`;

    // 8. Retornar base64
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
