
let x, y;
let speed = 1.2

function getHeight() {
  return height - 25
}

// needs to be defined in window for bundler
window.setup = () => {
  console.log('setup p5js sketch')
  var sketchCanvas = createCanvas(window.innerWidth, window.innerHeight-90);
  sketchCanvas.parent("main-canvas");

  // init ball
  x = width / 2;
  y = getHeight();

  state = "stop"
}

// needs to be defined in window for bundler
window.draw = () => {
  // background
  noStroke();
  background(102, 178, 255);

  // ladder
  fill(127, 0, 255);
  rect((width / 2) - 25, 0, 60, 900);

  if (window.gameState) {
    // ball
    stroke(50);
    fill(0, 153, 0);
    ellipse(x, y, 35, 35);

    // TODO investigate jiggling
    // Jiggling randomly on the horizontal axis
    // x = x + random(-1, 1);

    if (window.gameStateIsInMove()) {
      // Moving up at a constant speed
      y -= speed;
    }

    // Reset to the bottom
    if (y < 0) {
      y = getHeight();
    }
  }
}
