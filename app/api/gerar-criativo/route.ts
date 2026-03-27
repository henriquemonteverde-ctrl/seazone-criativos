import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

type Fase = 'Teaser' | 'Pré-Criativo' | 'Lançamento';
type Formato = 'feed' | 'reels';

// Prompts otimizados por fase — sem texto, sem pessoas, fotorrealismo premium
const PROMPTS: Record<Fase, string> = {
  Teaser:
    'Aerial drone photograph of Novo Campeche beach, Florianópolis Brazil, turquoise crystal-clear ocean, white sand, organized coastal neighborhood with lush green trees, bright midday sun, vibrant saturated colors, no dark filters, premium real estate marketing photography, ultra realistic, photorealistic, 8K quality, no text, no people, no watermark, golden hour warm light',

  'Pré-Criativo':
    'Aerial drone panoramic view of Novo Campeche neighborhood Florianópolis Brazil, coastal city from above, turquoise ocean water, white sand beach, modern urban development, palm trees, bright blue sky, sunlight reflections on water, no dark filters, professional real estate aerial photography, ultra HD, photorealistic, cinematic quality, no text, no people, no watermark',

  Lançamento:
    'Modern luxury apartment building exterior, contemporary Brazilian coastal architecture, Novo Campeche Florianópolis Brazil, blue sky with soft clouds, coastal city neighborhood, premium real estate photography, bright natural lighting, glass facade, architectural render style, photorealistic, high detail, no dark filters, no text, no watermark',
};

// Tamanhos que resultam nas proporções corretas para cada formato
const IMAGE_SIZES: Record<Formato, { width: number; height: number }> = {
  feed: { width: 864, height: 1080 },   // exato 4:5
  reels: { width: 576, height: 1024 },  // exato 9:16
};

interface FluxOutput {
  images: Array<{ url: string; width: number; height: number; content_type: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { fase: Fase; formato: Formato };
    const { fase, formato } = body;

    if (!fase || !formato) {
      return NextResponse.json({ error: 'Parâmetros fase e formato são obrigatórios.' }, { status: 400 });
    }

    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'FAL_KEY não configurada no ambiente.' }, { status: 500 });
    }

    fal.config({ credentials: apiKey });

    const prompt = PROMPTS[fase];
    const imageSize = IMAGE_SIZES[formato];

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: imageSize,
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      },
    });

    const output = result.data as FluxOutput;
    const imageUrl = output?.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Nenhuma imagem foi retornada pelo modelo.' }, { status: 500 });
    }

    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido na geração.';
    console.error('[gerar-criativo]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
