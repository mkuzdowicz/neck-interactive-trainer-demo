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

const calcAngle = (noseVec, videoWidth, videoHeight) => {
    const p1 = {
        x: noseVec[0],
        y: noseVec[1]
    }
    const p2 = {
        x: 0,
        y: videoHeight
    }

    const p22 = {
        x: 0,
        y: videoHeight
    }

    const bottom = {
        x: 0,
        y: videoHeight
    }

    const nose = {
        x: noseVec[0],
        y: noseVec[1]
    }

    const y = nose.y - bottom.y
    const x = nose.x - bottom.x

    const ang = Math.atan2(y, x)

    // var firstAngle = Math.atan2(p2.x, p2.y);
    // var secondAngle = Math.atan2(p1.x, p1.y);


    // // angle in radians
    // // const angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    // var angleRadians = secondAngle - firstAngle;

    // // angle in degrees
    // Math.atan2(8, 9)
    const angleDeg = ang * 180 / Math.PI;
    return angleDeg * -1
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
            console.log('predictions[i]', predictions[i])
            const start = predictions[i].topLeft;
            const end = predictions[i].bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

            // Render a rectangle over each detected face.
            // ctx.fillRect(start[0], start[1], size[0], size[1]);

            if (annotateBoxes) {
                const landmarks = predictions[i].landmarks;

                const noseVec = landmarks[2]
                const rEarVec = landmarks[4]
                const lEarVec = landmarks[5]
                const sz = (lEarVec[0] - rEarVec[0]) / 2

                ctx.beginPath();
                ctx.arc(noseVec[0], noseVec[1], size[0] / 2, 0, 2 * Math.PI, false);
                ctx.fill()
                ctx.stroke()

                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(rEarVec[0], rEarVec[1]);
                ctx.stroke();

                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(lEarVec[0], lEarVec[1]);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(0, videoHeight/2);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(noseVec[0], noseVec[1])
                ctx.lineTo(videoWidth/2, 0);
                ctx.stroke();

                const rDelta = noseVec[1] - rEarVec[1]
                const lDelta = noseVec[1] - lEarVec[1]

                console.log('rDelta', rDelta)

                console.log('lDelta', lDelta)

                const noseX = noseVec[0]

                const bottomVec = [noseX, videoHeight]
                const bottomCorVec = [0, videoHeight]

                const angle = calcAngle(noseVec, videoWidth, videoHeight)

                const scale = 8
                if (lDelta < 0 + scale) {
                    console.log('head left', angle)
                    window.gameStateMove()
                } else if (rDelta < 0 + scale) {
                    console.log('head right', angle)
                    window.gameStateMove()
                } else {
                    // console.log('angle', angle)
                    window.gameStateStop()
                }

                // console.log('nose', noseVec)
                // console.log('bottomVec', bottomVec)
                // console.log('bottomCorVec', bottomCorVec)
                // console.log('angle', angle)

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