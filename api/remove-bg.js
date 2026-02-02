// api/remove-bg.js
// Versión Nativa (Sin dependencia 'fal-serverless' para evitar errores de importación)

export default async function handler(req, res) {
  // 1. Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a la "pregunta" del navegador
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

    if (!process.env.FAL_KEY) {
      throw new Error("Falta la FAL_KEY en Vercel");
    }

    // 2. Llamada DIRECTA a la API de Fal (Sin librerías)
    const response = await fetch("https://queue.fal.run/fal-ai/image/rembg", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: image_data
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de Fal AI (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // 3. Responder al Frontend
    res.status(200).json(data);

  } catch (error) {
    console.error("Error Backend:", error);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
}
