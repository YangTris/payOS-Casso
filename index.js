require('dotenv').config();
const express = require('express');
const { PayOS } = require('@payos/node');

const app = express();
app.use(express.static('public'));
app.use(express.json());

const payos = new PayOS({
    clientId: process.env.CLIENT_ID,
    apiKey: process.env.API_KEY,
    checksumKey: process.env.CHECKSUM_KEY,
});

const Your_Domain = 'http://localhost:3000';

app.post('/create-payment-link', async (req, res) => {
    const orderCode = Date.now();

    const order = {
        amount: 10000,
        description: 'Thanh toán Ebook',
        orderCode: orderCode,
        returnUrl: `${Your_Domain}/success.html?orderCode=${orderCode}`,
        cancelUrl: `${Your_Domain}/cancel.html`,
    };

    const paymentLink = await payos.paymentRequests.create(order);
    res.redirect(303, paymentLink.checkoutUrl);
});

app.post('/verify-payment', async (req, res) => {
    try {
        const { orderCode } = req.body;
        const info = await payos.getPaymentLinkInformation(orderCode);

        if (info.status === "PAID") {
            return res.json({
                status: "PAID",
                downloadUrl: "https://drive.google.com/file/d/1DaoW9CH7ri29mHZ5Qtxl6uMo-wH3X4ol/view"
            });
        }
        res.json({ status: info.status });
    } catch (err) {
        console.error("verify-payment error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Webhook để cập nhật trạng thái thanh toán (quan trọng)
app.post('/receive-hook', (req, res) => {
    try {
        const isValid = payos.verifyWebhookData(req.body);
        if (!isValid) return res.sendStatus(400);

        const data = req.body.data;
        console.log("📦 Webhook received:", data);

        if (data.code === "00") {
            console.log(`✅ Order ${data.orderCode} was paid`);
            // TODO: cập nhật DB orderCode thành "PAID"
        }
        res.sendStatus(200);
    } catch (e) {
        console.error("Webhook error:", e);
        res.sendStatus(500);
    }
});

app.listen(3000, () => {
    console.log("🚀 Server is running at http://localhost:3000");
});