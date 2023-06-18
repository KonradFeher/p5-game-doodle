const LOGIC_TPS = 60;

let player;
let blobs = [];

function waver(base, mult, fun, speed=400) {
    return base + mult * fun(millis()/speed);
}

class Drawable {
    constructor () {}
    draw() {
        fill(this.getColor());
        circle(this.posX - player.posX, this.posY - player.posY, 2 * this.radius);
    }
} 

class Player extends Drawable {

    constructor(posX, posY) {
        super()
        this.posX = posX;
        this.posY = posY;
        this.radius = 20;
        this.speed = 7;
        this.rotation = 0;
    }

    update() {
        this.rotation += (keysDown.has(81) - keysDown.has(69)) * .05;

        let horizontal = (keysDown.has(68) || keysDown.has(RIGHT_ARROW)) - (keysDown.has(65) || keysDown.has(LEFT_ARROW));  // -1 0 1
        let vertical = (keysDown.has(83) || keysDown.has(DOWN_ARROW)) - (keysDown.has(87) || keysDown.has(UP_ARROW));       // -1 0 1
        
        if (horizontal == 0 && vertical == 0) return;
        
        let angles = [];
        
        if (horizontal === -1) angles.push(PI);
        else if (horizontal === 1) angles.push(0);
        if (vertical === -1) angles.push(PI/2);
        else if (vertical === 1) angles.push(3 * PI / 2);

        let movementAngle = this.rotation;
        if (horizontal === 1 && vertical === 1)
            movementAngle += -PI/4;
        else movementAngle += angles.reduce((acc, angle) => acc + angle, 0) / angles.length;

        this.posX = clamp(this.posX + this.speed * cos(movementAngle), player.radius * 2, width - player.radius * 2);
        this.posY = clamp(this.posY + this.speed * - sin(movementAngle), player.radius * 2, height - player.radius * 2)

    }

    getColor() {
        return color(waver(100, 50, cos), waver(200, 50, cos), waver(100, 50, cos));
    }
}

class Blob extends Drawable {

    constructor() {
        super();
        this.radius = 0;
        this.posX = random(player.radius * 2, width - player.radius * 2);
        this.posY = random(player.radius * 2, height - player.radius * 2);
        this.maxRadius = random(3, 8);
        push()
            colorMode(HSB);
            this.color = color(random(0, 255), 125, 125);
        pop()
    }   

    update(player) {
        if (this.radius < this.maxRadius) this.radius += log(1.0001 + this.radius)
        if (dist(this.posX, this.posY, player.posX, player.posY) > (player.radius - this.radius))
            return true;
        else {
            // player.radius += 1;
            return false
        } 
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
}

function logic() {
    player.update();
    blobs = blobs.filter(blob => blob.update(player))    
    while (blobs.length < 10)
        blobs.push(new Blob())
}

let second = 0;

function draw() {
    // translate(width/2, height/2);
    background(0);
    
    translate(width/2, height/2);
    rotate(player.rotation)
    
    fill(10, 0, waver(20, 10, cos));
    rect(0 - player.posX, 0 - player.posY, width, height, 2 * player.radius);

    blobs.forEach(blob => blob.draw());
    player.draw();

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

