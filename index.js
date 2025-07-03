import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import QRCode from "qrcode";

const app = express();

// 1) Dozvoli CORS sa svih origin, ili target origin
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// 2) Dozvoli iframe embedding i isključi cache za /generate
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  next();
});
app.use('/generate', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// 3) Endpoint za generisanje QR koda i vraćanje payload URL-a
app.post('/generate', async (req, res) => {
  const { amount, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ error: 'Missing amount or orderId' });
  }

  // Generiši payload URL sa parametrima
  const payload =
    `https://ips.pgw.payten.com:9092/payment-request?tid=SHIULI01&merchantid=123456&amount=${encodeURIComponent(
      amount
    )}&orderId=${encodeURIComponent(orderId)}&checksum=PLACEHOLDER`;

  try {
    // Generiši QR code kao base64 Data URL
    const qr = await QRCode.toDataURL(payload);
    // Uvek vraćaj JSON telo sa payload i qr
    return res.status(200).json({ payload, qr });
  } catch (err) {
    console.error('QR generation error:', err);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// 4) Health check endpoint
app.get('/', (req, res) => {
  res.send('Shiuli IPS backend aktivan');
});

// 5) Pokreni server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
