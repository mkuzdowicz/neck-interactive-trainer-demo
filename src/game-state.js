
const play = "play"
const move = "move"
const stop = "stop"

window.gameStateInit = () => {
    window.gameState = stop
}

window.gameStateMove = () => {
    window.gameState = move
}

window.gameStateStop = () => {
    window.gameState = stop
}

window.gameStateIsInMove = () => {
    return window.gameState == move
}

window.gameStateInit()

