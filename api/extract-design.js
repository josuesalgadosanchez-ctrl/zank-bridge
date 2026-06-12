export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data, shirt_color } = req.body;
    if (!image_data) return res.status(400).json({ error: 'Falta image_data' });
    if (!process.env.XAI_KEY) return res.status(500).json({ error: 'Falta XAI_KEY' });

    const color = shirt_color || 'negro';

    // PASO 1: Grok Vision analiza el diseño
    const visionResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: image_data }
              },
              {
                type: 'text',
                text: `Describe con detalle extremo el diseño gráfico impreso en esta camiseta ${color}. Incluye: texto exacto visible, posición de cada elemento, colores exactos, estilo, figuras o personajes, formas, composición. Sé tan preciso que alguien pueda recrearlo idénticamente. NO describas la camiseta, solo el diseño impreso.`
              }
            ]
          }
        ],
        max_tokens: 1500
      })
    });

    if (!visionResponse.ok) {
      const err = await visionResponse.text();
      return res.status(500).json({ error: 'Grok Vision error: ' + err });
    }

    const visionData = await visionResponse.json();
    const designDescription = visionData.choices?.[0]?.message?.content;

    if (!designDescription) {
      return res.status(500).json({ error: 'Grok no pudo analizar el diseño' });
    }

    // PASO 2: Aurora genera el diseño
    const imagenResponse = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-image-1212',
        prompt: `Recrea exactamente este diseño gráfico sobre fondo completamente ${color}. Copia cada detalle con precisión: mismo estilo, mismos personajes, mismo texto, mismos colores, misma composición. Sin camiseta, sin ropa, solo el diseño centrado sobre fondo ${color} puro. Diseño a recrear: ${designDescription}`,
        n: 1,
        response_format: 'b64_json'
      })
    });

    if (!imagenResponse.ok) {
      const err = await imagenResponse.text();
      return res.status(500).json({ error: 'Aurora error: ' + err });
    }

    const imagenData = await imagenResponse.json();
    const imageB64 = imagenData.data?.[0]?.b64_json;
    const imageUrl = imagenData.data?.[0]?.url;

    if (imageB64) {
      return res.status(200).json({ image_url: `data:image/jpeg;base64,${imageB64}` });
    } else if (imageUrl) {
      return res.status(200).json({ image_url: imageUrl });
    } else {
      return res.status(500).json({ error: 'Aurora no devolvió imagen. Respuesta: ' + JSON.stringify(imagenData) });
    }

  } catch (error) {
    console.error("Error extract-design:", error);
    return res.status(500).json({ error: error.message });
  }
}
