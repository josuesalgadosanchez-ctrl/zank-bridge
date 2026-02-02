// api/remove-bg.js
const { result } = require('fal-serverless');

module.exports = async function handler(req, res) {
  // 1. Configuración de CORS (Permisos de acceso)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si es una solicitud de "pregunta" del navegador, decimos que SÍ.
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Si no es POST, error.
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { image_data } = req.body;

    if (!image_data) {
      return res.status(400).json({ error: 'Falta image_data' });
    }

    // 2. Enviar a Fal AI (Modelo RMBG-1.4)
    const data = await result("fal-ai/image/rembg", {
      input: {
        image_url: image_data 
      },
    });

    // 3. Responder
    res.status(200).json(data);

  } catch (error) {
    console.error("Error backend:", error);
    // Aunque falle, respondemos JSON para que el frontend no diga "Failed to fetch"
    res.status(500).json({ error: error.message, details: error });
  }
};
