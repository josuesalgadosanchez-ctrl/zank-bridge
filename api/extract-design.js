export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image_data, shirt_color } = req.body;
    if (!image_data) return res.status(400).json({ error: 'Falta image_data' });
    if (!process.env.GEMINI_KEY) return res.status(500).json({ error: 'Falta GEMINI_KEY' });

    const bgColor = shirt_color === 'blanco' ? 'white' : 'black';
    const shirtColor = shirt_color === 'blanco' ? 'white' : 'black';

    const base64Pure = image_data.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = image_data.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const prompt = `Look at this ${shirtColor} t-shirt image. Extract ONLY the graphic design/artwork printed on it and recreate it as a standalone high quality image on a solid ${bgColor} background. Do not include the t-shirt, no fabric, no clothing. Only the design centered on a pure ${bgColor} background.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Pure
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            responseMimeType: "image/png"
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Gemini error: ' + err });
    }

    const data = await response.json();
    
    const parts = data.candidates?.[0]?.content?.parts;
    let imageBase64 = null;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageBase64) {
      return res.status(500).json({ error: 'Gemini no generó imagen. Respuesta: ' + JSON.stringify(data) });
    }

    return res.status(200).json({
      image_url: `data:image/png;base64,${imageBase64}`
    });

  } catch (error) {
    console.error("Error extract-design:", error);
    return res.status(500).json({ error: error.message });
  }
}
