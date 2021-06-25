
document.addEventListener("keyup", onLeftOrRightArrow);
document.addEventListener("keydown", onLeftOrRightArrow);

function onLeftOrRightArrow(e) {
    if (e.code == "ArrowLeft" || e.code == "ArrowRight") {
        if (e.type == "keydown") {
            window.gameStateMove()
        } else {
            window.gameStateStop()
        }
    }
}
