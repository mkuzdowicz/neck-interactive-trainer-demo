import 'regenerator-runtime/runtime'
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import getAnglesBetween from './angles';

// TODO wasm is much faster investigate why
// + vendor the dist
const wasmPath = `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`
console.log('registering wasm', wasmPath)
tfjsWasm.setWasmPaths(wasmPath);

const video = document.getElementById('video')
const canvas = document.getElementById('video-output')

let model, ctx

const setupCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': { facingMode: 'user' },
    })
    video.srcObject = stream

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video)
        }
    })
}

const renderPrediction = async () => {
    const returnTensors = false;
    const flipHorizontal = false;
    const annotateBoxes = true;
    const predictions = await model.estimateFaces(
        video, returnTensors, flipHorizontal, annotateBoxes)

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    if (predictions.length > 0) {
        // draw video to canvas 
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
        /*
        `predictions` is an array of objects describing each detected face, for example:
    
        [
          {
            topLeft: [232.28, 145.26],
            bottomRight: [449.75, 308.36],
            probability: [0.998],
            landmarks: [
              [295.13, 177.64], // right eye
              [382.32, 175.56], // left eye
              [341.18, 205.03], // nose
              [345.12, 250.61], // mouth
              [252.76, 211.37], // right ear
              [431.20, 204.93] // left ear
            ]
          }
        ]
        */
        const prediction = predictions[0]
        const start = prediction.topLeft;
        const end = prediction.bottomRight;
        const size = [end[0] - start[0], end[1] - start[1]];
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

        if (annotateBoxes) {
            const landmarks = prediction.landmarks;

            const nose = landmarks[2]
            const leftEye = landmarks[1]
            const rightEye = landmarks[0]

            const drawCircleAroundHead = () => {
                ctx.beginPath();
                ctx.arc(nose[0], nose[1], size[0] / 2, 0,
                    2 * Math.PI, false);
                ctx.fill()
                ctx.stroke()
            }

            drawCircleAroundHead()

            const drawLine = (p1, p2) => {
                ctx.moveTo(p1[0], p1[1])
                ctx.lineTo(p2[0], p2[1]);
                ctx.stroke();
            }

            // path from nose to right eye
            drawLine(nose, rightEye)

            // path from nose to left eye
            drawLine(nose, leftEye)

            // path from nose to right end
            drawLine(nose, [0, nose[1]])

            // path from nose to left end
            drawLine(nose, [videoWidth, nose[1]])

            // calculate angles between 
            // - line from nose to eye 
            // - and straigh line from end to end crossing nose
            // for left and right
            const angles = getAnglesBetween(nose, leftEye, rightEye)
            const noseToLeftEyeAngle = angles[0]
            const noseToRightEyeAngle = angles[1]

            const activationAngle = 25

            if (noseToLeftEyeAngle < activationAngle
                || noseToRightEyeAngle < activationAngle) {
                ctx.fillStyle = "yellow";
                window.gameStateMove()
            } else {
                window.gameStateStop()
                ctx.fillStyle = "blue";
            }

            // draw face landmarks
            for (let j = 0; j < landmarks.length; j++) {
                const x = landmarks[j][0];
                const y = landmarks[j][1];
                ctx.fillRect(x, y, 5, 5);
            }
        }
    }
    requestAnimationFrame(renderPrediction)
}

const setupPage = async () => {
    await tf.setBackend('wasm')
    await setupCamera()
    video.play()

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight
    video.width = videoWidth
    video.height = videoHeight

    canvas.width = videoWidth
    canvas.height = videoHeight

    ctx = canvas.getContext('2d')
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)"

    model = await blazeface.load()

    renderPrediction()
}

setupPage()
