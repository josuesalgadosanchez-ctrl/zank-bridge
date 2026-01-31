const { createClient } = require('@fal-ai/client');

const fal = createClient({
  credentials: process.env.FAL_KEY,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { imageBase64, scaleFactor } = req.body;
    const result = await fal.run("fal-ai/falsr/upscale", {
      input: {
        image_url: imageBase64,
        scale: parseInt(scaleFactor) || 2
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
