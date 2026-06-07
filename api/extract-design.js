export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data, shirt_color } = req.body;
    if (!image_data) return res.status(400).json({ error: 'Falta image_data' });
    if (!process.env.OPENAI_KEY) return res.status(500).json({ error: 'Falta OPENAI_KEY' });

    const bgColor = shirt_color === 'blanco' ? 'white' : 'black';
    const shirtColor = shirt_color === 'blanco' ? 'white' : 'black';

    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
                text: `Describe in extreme detail the graphic design printed on this ${shirtColor} t-shirt. Focus only on the design/artwork itself: shapes, figures, text, symbols, colors, style, composition. Be very specific and detailed. Do not describe the t-shirt or its color, only the design printed on it.`
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!visionResponse.ok) {
      const err = await visionResponse.text();
      return res.status(500).json({ error: 'GPT-4o error: ' + err });
    }

    const visionData = await visionResponse.json();
    const designDescription = visionData.choices?.[0]?.message?.content;

    if (!designDescription) {
      return res.status(500).json({ error: 'GPT-4o no pudo analizar el diseño' });
    }

    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `Generate a high quality image of the following graphic design on a solid ${bgColor} background. The design must be centered, without any t-shirt or clothing, just the design itself on a pure ${bgColor} background. Design description: ${designDescription}`,
        n: 1,
        size: '1024x1024',
        quality: 'medium',
        output_format: 'png'
      })
    });

    if (!dalleResponse.ok) {
      const err = await dalleResponse.text();
      return res.status(500).json({ error: 'DALL-E error: ' + err });
    }

    const dalleData = await dalleResponse.json();
    
    const imageUrl = dalleData.data?.[0]?.url;
    const imageB64 = dalleData.data?.[0]?.b64_json;

    if (imageUrl) {
      return res.status(200).json({ image_url: imageUrl });
    } else if (imageB64) {
      return res.status(200).json({ image_url: `data:image/png;base64,${imageB64}` });
    } else {
      return res.status(500).json({ error: 'Sin imagen. Respuesta: ' + JSON.stringify(dalleData) });
    }

  } catch (error) {
    console.error("Error extract-design:", error);
    return res.status(500).json({ error: error.message });
  }
}
