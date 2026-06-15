export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data, shirt_color } = req.body;
    if (!image_data) return res.status(400).json({ error: 'Falta image_data' });
    if (!process.env.FAL_KEY) return res.status(500).json({ error: 'Falta FAL_KEY' });

    const color = shirt_color || 'negro';

    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `This is a t-shirt mockup photo. Extract ONLY the graphic design/artwork printed on this ${color} t-shirt. Recreate it as a brand new high quality digital artwork on a solid ${color} background. Make it look like a professionally designed graphic, not a photo of fabric. Enhance sharpness, colors and details. Remove any fabric texture, wrinkles or photo artifacts. The result must look like a clean vector or digital illustration. No t-shirt, no clothing, just the extracted and enhanced design on pure ${color} background.`,
        image_url: image_data,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Fal error: ' + err });
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url || data.image?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: 'Sin imagen: ' + JSON.stringify(data) });
    }

    return res.status(200).json({ image_url: imageUrl });

  } catch (error) {
    console.error("Error extract-design:", error);
    return res.status(500).json({ error: error.message });
  }
}
