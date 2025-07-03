import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import QRCode from "qrcode";

const app = express();
app.use(cors());
app.use(bodyParser.json());
// isključi cache na ruti /generate
app.use('/generate', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.post("/generate", async (req, res) => {
  const { amount, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ error: "Missing amount or orderId" });
  }

  const payload = `https://ips.pgw.payten.com:9092/payment-request?tid=SHIULI01&amount=${amount}&orderid=${orderId}&merchantid=123456&checksum=PLACEHOLDER`;

  try {
    const qr = await QRCode.toDataURL(payload);
    res.json({ qr, payload });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

app.get("/", (req, res) => {
  res.send("Shiuli IPS backend aktivan");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
