import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();

// CORS i body parser
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// POST /generate - glavni endpoint za frontend
app.post("/generate", async (req, res) => {
  const { amount, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ error: "Missing amount or orderId" });
  }

  try {
    // 1. Generiši session token
    const tokenResponse = await axios.post(
      "https://ips.pgw.payten.com:9092/res/v1/generateToken",
      {
        userId: "papkivwrwzvcxrqzcpotcpxbyquqjjsriyyshrgrmogyyjxajuuoamnnrkbsepif",
        tid: "SHIULI01"
      }
    );

    const sessionToken = tokenResponse.data.sessionToken;

    // 2. Kreiraj eCommerce zahtev sa tokenom
    const ecommerceResponse = await axios.post(
      "https://ips.pgw.payten.com:9092/ips/v2/eCommerce",
      {
        tid: "SHIULI01",
        amount: amount.toFixed(2),
        orderId: orderId,
        successSiteURL: "https://shiuli.rs/placanje-uspesno",
        failSiteURL: "https://shiuli.rs/placanje-neuspesno",
        cancelSiteURL: "https://shiuli.rs/placanje-otkazano"
      },
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const qrCodeURL = ecommerceResponse.data.qrCodeURL;

    // Vrati QR kod URL nazad frontend-u
    return res.status(200).json({ qrCodeURL });
  } catch (err) {
    console.error("Greška:", err.message);
    return res.status(500).json({ error: "Greška pri komunikaciji sa Payten API-jem" });
  }
});

// GET / - health check
app.get("/", (req, res) => {
  res.send("Shiuli IPS backend je aktivan.");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server pokrenut na portu ${PORT}`));
