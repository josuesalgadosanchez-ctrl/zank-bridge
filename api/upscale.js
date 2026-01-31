const { createClient } = require('@fal-ai/client');

const fal = createClient({
  credentials: process.env.FAL_KEY,
});

module.exports = async (req, res) => {
  // Permisos de seguridad para que Shopify pueda entrar
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { imageBase64, scaleFactor } = req.body;

    // Ejecución de la IA usando tu saldo de fal.ai
    const result = await fal.run("fal-ai/falsr/upscale", {
      input: {
        image_url: imageBase64,
        scale: parseInt(scaleFactor) || 2
      },
    });

    // Enviamos el resultado directo
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
