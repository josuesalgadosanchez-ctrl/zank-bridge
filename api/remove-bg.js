// api/remove-bg.js
export default async function handler(req, res) {
  // 1. Configuración de CORS
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

    if (!image_data) return res.status(400).json({ error: 'Falta image_data' });
    if (!process.env.FAL_KEY) return res.status(500).json({ error: 'Falta FAL_KEY en Vercel' });

    // 2. CORRECCIÓN: Usamos el modelo "bria/background/remove"
    // Esta es la dirección correcta que sí existe.
    const response = await fetch("https://fal.run/fal-ai/bria/background/remove", {
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
        return res.status(response.status).json({ error: `Fal AI Error: ${errorText}` });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Error Backend:", error);
    res.status(500).json({ error: error.message });
  }
}
