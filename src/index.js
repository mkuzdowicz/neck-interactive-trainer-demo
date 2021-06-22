const video = document.getElementById('video')

function predictWebcam() {
}

function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

function enableCam() {
    // Get access to the camera!
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now

        console.log("navigator.mediaDevices", navigator.mediaDevices)
        navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
            video.srcObject = stream;
            video.addEventListener('loadeddata', predictWebcam);
        });
    }
}

if (getUserMediaSupported()) {
    enableCam()
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

