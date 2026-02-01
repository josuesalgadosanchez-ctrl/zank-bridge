export default async function handler(req, res) {
  // Permisos para que Shopify pueda entrar
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data } = req.body;

    // Usamos 'fal-ai/real-esrgan' que es el estándar de velocidad
    const response = await fetch("https://queue.fal.run/fal-ai/real-esrgan", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: image_data
      }),
    });

    // Si Fal AI se queja, leemos el error y lo enviamos al frontend
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal AI Error: ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json({ request_id: data.request_id });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
