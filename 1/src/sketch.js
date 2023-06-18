let player;
let blobs = [];

const LOGIC_TPS = 60;

function waver(base, mult, fun, speed=400) {
    return base + mult * fun(millis()/speed);
}

class Drawable {
    constructor () {}
    draw() {
        fill(this.getColor());
        circle(this.posX, this.posY, 2 * this.radius);
    }
} 

class Player extends Drawable {

    constructor(posX, posY) {
        super()
        this.posX = posX;
        this.posY = posY;
        this.radius = 20;
        this.speed = 7;
    }

    update() {
        this.horizontal = (keysDown.has(68) || keysDown.has(RIGHT_ARROW)) - (keysDown.has(65) || keysDown.has(LEFT_ARROW)); 
        this.vertical = (keysDown.has(83) || keysDown.has(DOWN_ARROW)) - (keysDown.has(87) || keysDown.has(UP_ARROW));

        let diagMult = (this.horizontal != 0 && this.vertical != 0) ? 0.71 : 1;
        this.posX = clamp(this.posX + this.horizontal * diagMult * this.speed, 2 * this.radius, width - 2 * this.radius);
        this.posY = clamp(this.posY + this.vertical * diagMult * this.speed, 2 * this.radius, width - 2 * this.radius);
    }

    getColor() {
        return color(waver(100, 50, cos), waver(200, 50, cos), waver(100, 50, cos));
    }
}

class Blob extends Drawable {

    constructor() {
        super();
        this.radius = random(3, 8);
        this.posX = random(player.radius * 2, width - player.radius * 2);
        this.posY = random(player.radius * 2, height - player.radius * 2);
        push()
            colorMode(HSB);
            this.color = color(random(0, 255), 125, 125);
        pop()
    }   

    update() {
        return dist(this.posX, this.posY, player.posX, player.posY) > (player.radius - this.radius)
    }

    getColor() {
        return this.color;
    }

}

function setup() {
    createCanvas(720, 720);
    frameRate(60);
    player = new Player(width / 2, height * 0.67);
    noStroke();
    setInterval(logic, 1000 / LOGIC_TPS);
    setInterval(() => frameRate(random(2, 60)), 2000);
}

function logic() {
    player.update();
    blobs = blobs.filter(blob => blob.update())    
    while (blobs.length < 10)
        blobs.push(new Blob())
}

let second = 0;

function draw() {
    background(10, 0, waver(20, 10, cos));
    player.draw();
    blobs.forEach(blob => blob.draw());
}

let keysDown = new Set();

function keyPressed() {
    keysDown.add(keyCode)
}

function keyReleased() {
    keysDown.delete(keyCode)
}

function clamp(x, lower, higher) {
    if (x < lower)
        return lower;
    if (x > higher)
        return higher; 
    return x;
}

