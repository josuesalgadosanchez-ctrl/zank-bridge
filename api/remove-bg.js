// api/remove-bg.js
import { result } from 'fal-serverless';

export default async function handler(req, res) {
  // 1. Configuración de CORS (Para que Shopify pueda hablar con Vercel)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { image_data } = req.body;

    if (!image_data) {
      return res.status(400).json({ error: 'Falta image_data' });
    }

    // 2. Enviar a Fal AI (Modelo Económico: RMBG-1.4)
    // Costo aprox: $0.0001 - $0.001 por imagen (Extremadamente barato)
    const data = await result("fal-ai/image/rembg", {
      input: {
        image_url: image_data 
      },
    });

    // 3. Responder con la imagen sin fondo
    res.status(200).json(data);

  } catch (error) {
    console.error("Error en Remove BG:", error);
    res.status(500).json({ error: error.message, details: error });
  }
}
