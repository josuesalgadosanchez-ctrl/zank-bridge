export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data, shirt_color } = req.body;

    if (!image_data) return res.status(400).json({ error: 'Falta image_data' });
    if (!shirt_color) return res.status(400).json({ error: 'Falta shirt_color' });
    if (!process.env.FAL_KEY) return res.status(500).json({ error: 'Falta FAL_KEY' });

    const prompts = {
      negro: "Extract the graphic design from this black t-shirt and recreate it as a standalone image in high quality, preserving every detail, color and shape of the original design. Place the design centered on a pure solid black background. Do not include the t-shirt, no fabric, no clothing, only the design itself.",
      blanco: "Extract the graphic design from this white t-shirt and recreate it as a standalone image in high quality, preserving every detail, color and shape of the original design. Place the design centered on a pure solid white background. Do not include the t-shirt, no fabric, no clothing, only the design itself."
    };

    const selectedPrompt = prompts[shirt_color] || prompts.negro;

    // CORRECCIÓN 1: Usamos fal-ai/flux/dev/image-to-image que es más estable
    // CORRECCIÓN 2: Llamada directa (fal.run) en lugar de cola (queue.fal.run)
    const response = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: image_data,
        prompt: selectedPrompt,
        strength: 0.85,
        num_images: 1,
        image_size: "square_hd"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Fal AI Error: ${errorText}` });
    }

    const data = await response.json();
    
    // CORRECCIÓN 3: Devolvemos la imagen directo, sin cola
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error img2img:", error);
    return res.status(500).json({ error: error.message });
  }
}
