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

    const visionResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
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
              {
                text: `Describe in extreme detail the graphic design printed on this ${shirtColor} t-shirt. Focus only on the design/artwork itself: shapes, figures, text, symbols, colors, style, composition. Be very specific and detailed. Do not describe the t-shirt or its color, only the design printed on it.`
              }
            ]
          }]
        })
      }
    );

    if (!visionResponse.ok) {
      const err = await visionResponse.text();
      return res.status(500).json({ error: 'Gemini Vision error: ' + err });
    }

    const visionData = await visionResponse.json();
    const designDescription = visionData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!designDescription) {
      return res.status(500).json({ error: 'Gemini no pudo analizar el diseño' });
    }

    const imagePrompt = `Generate a high quality image of the following graphic design on a solid ${bgColor} background. The design must be centered, without any t-shirt or clothing, just the design itself floating on the ${bgColor} background. Design description: ${designDescription}`;

    const imagenResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            personGeneration: "allow_adult"
          }
        })
      }
    );

    if (!imagenResponse.ok) {
      const err = await imagenResponse.text();
      return res.status(500).json({ error: 'Gemini Imagen error: ' + err });
    }

    const imagenData = await imagenResponse.json();
    const imageBase64Result = imagenData.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBase64Result) {
      return res.status(500).json({ error: 'Gemini Imagen no devolvió imagen. Respuesta: ' + JSON.stringify(imagenData) });
    }

    return res.status(200).json({
      image_url: `data:image/png;base64,${imageBase64Result}`
    });

  } catch (error) {
    console.error("Error extract-design:", error);
    return res.status(500).json({ error: error.message });
  }
}
