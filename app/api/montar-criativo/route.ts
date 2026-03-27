import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// ─── Cores Seazone ────────────────────────────────────────────────────────────
const CORAL  = "#FC6058";
const NAVY   = "#00143D";
const WHITE  = "#FFFFFF";

// ─── Dimensões do feed 4:5 ───────────────────────────────────────────────────
const W = 1080;
const H = 1350;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, briefing } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl não informada" }, { status: 400 });
    }

    // 1. Baixar a imagem gerada
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Falha ao baixar a imagem base");
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // 2. Redimensionar para 1080x1350
    const base = await sharp(imgBuffer)
      .resize(W, H, { fit: "cover", position: "centre" })
      .toBuffer();

    // ─── Dados do briefing (com fallbacks) ────────────────────────────────
    const nome       = briefing?.empreendimento ?? "NOVO CAMPECHE SPOT II";
    const local      = briefing?.localizacao    ?? "NOVO CAMPECHE, FLORIANÓPOLIS - SC";
    const roi        = briefing?.roi            ?? "16,4%";
    const mensal     = briefing?.rendimento_mensal ?? "~R$ 5.500/mês";
    const anual      = briefing?.rendimento_anual  ?? "R$ 66.424/ano";
    const fase       = briefing?.fase           ?? "LANÇAMENTO";
    const isLancamento = fase?.toUpperCase().includes("LANÇA");

    // ─── SVG dos overlays ─────────────────────────────────────────────────
    const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face { font-family: 'Helvetica'; }
    </style>
  </defs>

  <!-- TAG LANÇAMENTO (topo esquerdo) -->
  ${isLancamento ? `
  <rect x="40" y="40" width="200" height="44" rx="6" fill="${CORAL}"/>
  <text x="140" y="68" font-family="Helvetica,Arial,sans-serif" font-size="18"
        font-weight="700" fill="${WHITE}" text-anchor="middle" letter-spacing="3">
    LANÇAMENTO
  </text>` : ""}

  <!-- PIN CORAL + NOME (centro superior) -->
  <g transform="translate(${W / 2}, 220)">
    <!-- Sombra suave -->
    <rect x="-190" y="-22" width="380" height="52" rx="10"
          fill="${NAVY}" opacity="0.55"/>
    <!-- Ícone de pin -->
    <text x="-160" y="17" font-family="Helvetica,Arial,sans-serif"
          font-size="26" fill="${CORAL}">⬟</text>
    <!-- Nome do empreendimento -->
    <text x="-125" y="17" font-family="Helvetica,Arial,sans-serif"
          font-size="20" font-weight="700" fill="${WHITE}" letter-spacing="1.5">
      ${nome.toUpperCase()}
    </text>
  </g>

  <!-- TAG LOCALIZAÇÃO -->
  <g transform="translate(${W / 2}, 290)">
    <rect x="-175" y="-18" width="350" height="34" rx="6"
          fill="${WHITE}" opacity="0.12"/>
    <text x="0" y="8" font-family="Helvetica,Arial,sans-serif"
          font-size="15" fill="${WHITE}" text-anchor="middle"
          letter-spacing="1" opacity="0.9">
      ${local.toUpperCase()}
    </text>
  </g>

  <!-- BARRA NAVY INFERIOR -->
  <rect x="0" y="${H - 220}" width="${W}" height="220" fill="${NAVY}"/>

  <!-- Linha coral decorativa no topo da barra -->
  <rect x="0" y="${H - 220}" width="${W}" height="3" fill="${CORAL}"/>

  <!-- ROI — destaque principal -->
  <text x="${W / 2}" y="${H - 162}" font-family="Helvetica,Arial,sans-serif"
        font-size="52" font-weight="700" fill="${WHITE}" text-anchor="middle"
        letter-spacing="-1">
    ${roi} ao ano
  </text>
  <text x="${W / 2}" y="${H - 120}" font-family="Helvetica,Arial,sans-serif"
        font-size="18" fill="${CORAL}" text-anchor="middle" letter-spacing="4"
        font-weight="500">
    RETORNO ESTIMADO
  </text>

  <!-- Divisor -->
  <line x1="120" y1="${H - 96}" x2="${W - 120}" y2="${H - 96}"
        stroke="${WHITE}" stroke-width="1" opacity="0.15"/>

  <!-- Rendimento mensal e anual -->
  <text x="${W / 2 - 140}" y="${H - 66}" font-family="Helvetica,Arial,sans-serif"
        font-size="22" font-weight="700" fill="${WHITE}" text-anchor="middle">
    ${mensal}
  </text>
  <text x="${W / 2 - 140}" y="${H - 44}" font-family="Helvetica,Arial,sans-serif"
        font-size="13" fill="${WHITE}" text-anchor="middle" opacity="0.5"
        letter-spacing="1">
    POR MÊS
  </text>

  <!-- Divisor vertical -->
  <line x1="${W / 2}" y1="${H - 85}" x2="${W / 2}" y2="${H - 36}"
        stroke="${WHITE}" stroke-width="1" opacity="0.15"/>

  <text x="${W / 2 + 140}" y="${H - 66}" font-family="Helvetica,Arial,sans-serif"
        font-size="22" font-weight="700" fill="${WHITE}" text-anchor="middle">
    ${anual}
  </text>
  <text x="${W / 2 + 140}" y="${H - 44}" font-family="Helvetica,Arial,sans-serif"
        font-size="13" fill="${WHITE}" text-anchor="middle" opacity="0.5"
        letter-spacing="1">
    POR ANO
  </text>

  <!-- Logo Seazone (ícone casinha + texto) -->
  <g transform="translate(${W / 2 - 72}, ${H - 30})">
    <!-- Casinha coral -->
    <polygon points="14,2 0,10 3,10 3,19 10,19 10,14 18,14 18,19 25,19 25,10 28,10"
             fill="${CORAL}" transform="scale(0.7)"/>
    <text x="22" y="14" font-family="Helvetica,Arial,sans-serif"
          font-size="14" font-weight="700" fill="${WHITE}" letter-spacing="2"
          opacity="0.85">
      SEAZONE
    </text>
  </g>
</svg>`;

    // 3. Compor a imagem base com o SVG de overlays
    const svgBuffer = Buffer.from(svg);

    const final = await sharp(base)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    // 4. Retornar como base64 para o frontend baixar
    const base64 = final.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    // Nome do arquivo: empreendimento + timestamp
    const slug = nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const fileName = `${slug}-${Date.now()}.png`;

    return NextResponse.json({ finalImageUrl: dataUrl, fileName });
  } catch (err: unknown) {
    console.error("[montar-criativo]", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
