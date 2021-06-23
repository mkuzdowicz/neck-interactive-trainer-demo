import 'regenerator-runtime/runtime'
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import { eye } from '@tensorflow/tfjs-core';

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

const calcAngle = (noseVec, eyeVec) => {
    const nose = {
        x: noseVec[0],
        y: noseVec[1]
    }
    const eye = {
        x: eyeVec[0],
        y: eyeVec[1]
    }

    console.log('calcAngle, nose, eye', nose, eye)

    const y = nose.y - eye.y
    const x = nose.x - eye.x

    const ang = Math.atan2(y, x)

    const angleDeg = ang * 180 / Math.PI;
    return angleDeg
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
        // ctx.clearRect(0, 0, canvas.width, canvas.height)
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
        for (let i = 0; i < predictions.length; i++) {
            // console.log('predictions[i]', predictions[i])
            const start = predictions[i].topLeft;
            const end = predictions[i].bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

            // Render a rectangle over each detected face.
            // ctx.fillRect(start[0], start[1], size[0], size[1]);

            if (annotateBoxes) {
                const landmarks = predictions[i].landmarks;

                const noseVec = landmarks[2]
                const le = landmarks[1]
                const re = landmarks[0]

                // circle around head
                ctx.beginPath();
                ctx.arc(noseVec[0], noseVec[1], size[0] / 2, 0, 2 * Math.PI, false);
                ctx.fill()
                ctx.stroke()

                // path from nose to right eye
                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(re[0], re[1]);
                ctx.stroke();

                // path from nose to left eye
                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(le[0], le[1]);
                ctx.stroke();

                // path from nose to right end
                ctx.beginPath();
                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(0, noseVec[1]);
                ctx.stroke();

                // path from nose to left end
                ctx.beginPath();
                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(videoWidth, noseVec[1]);
                ctx.stroke();

                const lx = le[0] - noseVec[0]
                const ly = noseVec[1] - le[1]
                const lAng = Math.atan2(ly, lx)
                const langleDeg = lAng * 180 / Math.PI;

                const rx = noseVec[0] - re[0]
                const ry = noseVec[1] - re[1]
                const rang = Math.atan2(ry, rx)
                const rangleDeg = rang * 180 / Math.PI;
                const activationAngle = 35
                // const scale = 8
                if (langleDeg < activationAngle) {
                    // calcAngle, nose, eye 
                    // {x: 373.8315010070801, y: 291.2296798825264} 
                    // {x: 429.8914635181427, y: 283.5372243449092}
                    console.log('head left, langleDeg', langleDeg)
                    window.gameStateMove()
                } else if (rangleDeg < activationAngle) {
                    // calcAngle, nose, eye 
                    // {x: 246.70952200889587, y: 307.50862419605255} 
                    // {x: 194.9433994293213, y: 300.3187358379364}
                    console.log('head right, reAngle', rangleDeg)
                    window.gameStateMove()
                } else {
                    window.gameStateStop()
                }

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