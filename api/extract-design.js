export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data, shirt_color } = req.body;
    if (!image_data) return res.status(400).json({ error: 'Falta image_data' });
    if (!process.env.OPENAI_KEY) return res.status(500).json({ error: 'Falta OPENAI_KEY' });

    const color = shirt_color || 'negra';

    const base64Pure = image_data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Pure, 'base64');
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', `Extrae el diseño de esta camiseta ${color} y genéralo de nuevo en alta calidad, respeta el diseño también su estilo, sus colores originales al 100%. y los textos si es necesario hazlos tipo vector para que se vean perfectos. Genera un fondo completamente ${color}.`);
    formData.append('n', '1');
    formData.append('size', '1024x1536');
    formData.append('quality', 'high');
    formData.append('background', 'auto');
    formData.append('moderation', 'auto');
    formData.append('input_fidelity', 'high');
    formData.append('image', blob, 'image.png');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'OpenAI error: ' + err });
    }

    const data = await response.json();
    const imageB64 = data.data?.[0]?.b64_json;
    const imageUrl = data.data?.[0]?.url;

    if (imageB64) {
      return res.status(200).json({ image_url: `data:image/png;base64,${imageB64}` });
    } else if (imageUrl) {
      return res.status(200).json({ image_url: imageUrl });
    } else {
      return res.status(500).json({ error: 'Sin imagen. Respuesta: ' + JSON.stringify(data) });
    }

  } catch (error) {
    console.error("Error extract-design:", error);
    return res.status(500).json({ error: error.message });
  }
}
