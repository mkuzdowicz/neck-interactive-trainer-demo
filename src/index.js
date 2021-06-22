import 'regenerator-runtime/runtime'
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

// TODO wasm is much faster investigate why
// + vendor the dist
const wasmPath = `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`
console.log('registering wasm', wasmPath)
tfjsWasm.setWasmPaths(wasmPath);

const video = document.getElementById('video')
const canvas = document.getElementById('video-output')

let model, ctx

const setupCamera= async () => {
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
    const flipHorizontal = true;
    const annotateBoxes = true;
    const predictions = await model.estimateFaces(
        video, returnTensors, flipHorizontal, annotateBoxes)

    if (predictions.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
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

        console.log('predictions', predictions)

        for (let i = 0; i < predictions.length; i++) {
            const start = predictions[i].topLeft;
            const end = predictions[i].bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

            // Render a rectangle over each detected face.
            ctx.fillRect(start[0], start[1], size[0], size[1]);

            if (annotateBoxes) {
                const landmarks = predictions[i].landmarks;
        
                ctx.fillStyle = "blue";
                for (let j = 0; j < landmarks.length; j++) {
                  const x = landmarks[j][0];
                  const y = landmarks[j][1];
                  ctx.fillRect(x, y, 5, 5);
                }
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

    console.log('model', model)

    renderPrediction()
}

setupPage()