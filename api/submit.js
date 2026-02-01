export default async function handler(req, res) {
  // Configuración CORS para permitir peticiones desde tu Shopify
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data, scale } = req.body;

    // Usaremos 'fal-ai/creative-upscaler' que es excelente para detalles
    const response = await fetch("https://queue.fal.run/fal-ai/creative-upscaler", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: image_data, // Fal acepta Data URIs (Base64)
        upscale_factor: parseInt(scale) || 2
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal AI Error: ${errorText}`);
    }

    const data = await response.json();
    // Devolvemos el request_id para consultar el estado después
    return res.status(200).json({ request_id: data.request_id });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
