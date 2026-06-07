export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!process.env.GEMINI_KEY) return res.status(500).json({ error: 'Falta GEMINI_KEY' });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_KEY}`,
      { method: 'GET' }
    );

    const data = await response.json();
    
    // Filtramos solo los que soportan generateContent o predict
    const models = data.models?.map(m => ({
      name: m.name,
      methods: m.supportedGenerationMethods
    }));

    return res.status(200).json({ models });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
