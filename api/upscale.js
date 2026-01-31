export default async function handler(req, res) {
    // Estas líneas permiten que tu Shopify se conecte sin errores de seguridad
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { imageBase64, scaleFactor } = req.body;

    try {
        const response = await fetch("https://api.fal.ai/run/fal-ai/aura-sr", {
            method: "POST",
            headers: {
                "Authorization": `Key ${process.env.FAL_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                image_url: imageBase64,
                upscale_factor: scaleFactor || 2,
            }),
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Error en el puente de IA" });
    }
}
