document.getElementById('start-btn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.getElementById('video');
        video.srcObject = stream;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const data = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                // POST request to your server
                await fetch('/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                alert('Location sent successfully!');
            }, (err) => {
                console.error('Geolocation error:', err);
                alert('Please enable location!');
            });
        } else {
            alert('Geolocation not supported!');
        }

    } catch (err) {
        console.error('Camera access error:', err);
        alert('Please enable camera!');
    }
});
