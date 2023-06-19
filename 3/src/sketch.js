const LOGIC_TPS = 60;
const SIZE = 720;
const WIDTH = SIZE;
const HEIGHT = SIZE;

const BOOST_STRENGTH = 2;
const BOOST_SHRINK = 0.99; // ~0.99

const FUEL_PER_BLOB = 20

const VERTICAL = false;

let players = [];
let blobs = [];

let graphics = {};

class Drawable {
    constructor () {}
    draw(povPlayer) {
        povPlayer.graphics.fill(this.getColor());
        povPlayer.graphics.circle(this.posX - povPlayer.posX, this.posY - povPlayer.posY, 2 * this.radius);
    }
} 

class Player extends Drawable {

    constructor(name, color, posX, posY, keys) {
        super()
        this.name = name;
        this.color = color;
        this.posX = posX;
        this.posY = posY;

        this.fuel = 100;
        this.boosting = false;
        this.original_radius = this.radius = 20;
        this.speed = 3;
        this.rotation = 0;
        this.keys = keys; // 'UP' 'LEFT' 'DOWN' 'RIGHT' 'ROT_LEFT' 'ROT_RIGHT' 'BOOST'

        this.graphics = createGraphics(SIZE, SIZE);
        this.graphics.noStroke()
    }

    update() {
        this.rotation += (keysDown.has(this.keys['ROT_LEFT']) - keysDown.has(this.keys['ROT_RIGHT'])) * .05;

        let horizontal = keysDown.has(this.keys['RIGHT']) - keysDown.has(this.keys['LEFT']);  // -1 0 1
        let vertical = keysDown.has(this.keys['DOWN']) - keysDown.has(this.keys['UP']);       // -1 0 1
        
        let boosting_mult = 1; 
        if (keysDown.has(this.keys['BOOST']) && this.fuel > 0){
            this.fuel -= 1;
            this.boosting = true;
            this.radius = clamp(this.radius * (BOOST_SHRINK), this.original_radius/4, this.original_radius)
            boosting_mult = 2;
        } else {
            this.boosting = false;
            this.radius = clamp(this.radius * (1/BOOST_SHRINK), this.original_radius/4, this.original_radius);
        }

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

        
        let padding = this.radius + 5;
        this.posX = clamp(this.posX + this.speed * boosting_mult * cos(movementAngle), padding, WIDTH - padding);
        this.posY = clamp(this.posY + this.speed * boosting_mult * - sin(movementAngle), padding, HEIGHT - padding);

    }

    updateGraphics() {
        this.graphics.background(0);
    
        this.graphics.translate(WIDTH/2, HEIGHT/2);
        this.graphics.rotate(this.rotation);
        
        this.graphics.fill(10, 0, waver(20, 10, cos));
        this.graphics.rect(0 - this.posX, 0 - this.posY, WIDTH, HEIGHT, 2 * this.radius);
    
        blobs.forEach(blob => blob.draw(this));
        
        // SELF ALWAYS ON TOP
        // players.filter(player => player !== this).forEach(player => player.draw(this));
        // this.draw(this);
        
        // LARGER PLAYER ON TOP
        [...players].sort((a, b) => (a.radius > b.radius || (a.radius === b.radius && a === this)) ? 1 : -1).forEach(player => player.draw(this));
        this.graphics.resetMatrix();
    }
    

    getColor() {
        return lerpColor(color(255), this.color, this.fuel / 100);
    }

    gainFuel(amount) {
        this.fuel = clamp(this.fuel + amount, 0, 100)
    }
}

class Blob extends Drawable {

    constructor() {
        super();
        this.radius = 0.001;
        this.maxRadius = random(3, 8);
        let padding = this.maxRadius + 6
        this.posX = random(padding, WIDTH - padding);
        this.posY = random(padding, HEIGHT - padding);
        push()
            colorMode(HSB);
            this.color = color(random(0, 255), 125, 125);
        pop()
    }   

    update(player) {
        if (this.radius < this.maxRadius) this.radius += log(1 + this.radius/5)
        if (dist(this.posX, this.posY, player.posX, player.posY) > (player.radius - this.radius))
            return true;
        else {
            player.gainFuel(FUEL_PER_BLOB);
            player.original_radius += .2
            return false
        } 
    }

    getColor() {
        return this.color;
    }

}

function setup() {
    frameRate(60);
    p1_keys = {
        UP: 87,
        LEFT: 65,
        DOWN: 83,
        RIGHT: 68,
        ROT_LEFT: 81,
        ROT_RIGHT: 69,
        BOOST: 32
    } // WASD QE SPACE
    players.push(new Player("Player 1", color("green"), WIDTH/2 + random(-WIDTH/3, WIDTH/3), HEIGHT/2 + random(-HEIGHT/3, HEIGHT/3), p1_keys));
    // p2_keys = {
    //     UP: 104,
    //     LEFT: 100,
    //     DOWN: 101,
    //     RIGHT: 102,
    //     ROT_LEFT: 103,
    //     ROT_RIGHT: 105,
    //     BOOST: 13
    // } // NUMPAD 8456 79 ENTER
    // players.push(new Player("Player 2", color("blue"), WIDTH/2 + random(-WIDTH/3, WIDTH/3), HEIGHT/2 + random(-HEIGHT/3, HEIGHT/3), p2_keys));

    p3_keys = {
        UP: 73,
        LEFT: 74,
        DOWN: 75,
        RIGHT: 76,
        ROT_LEFT: 85,
        ROT_RIGHT: 79,
        BOOST: 191
    } // IJKL UO /
    players.push(new Player("Player 3", color("yellow"), WIDTH/2 + random(-WIDTH/3, WIDTH/3), HEIGHT/2 + random(-HEIGHT/3, HEIGHT/3), p3_keys));

    if (VERTICAL)
        createCanvas(SIZE, SIZE * players.length);
    else createCanvas(SIZE * players.length, SIZE);

    noStroke();
    logic();
    setInterval(logic, 1000 / LOGIC_TPS);
}

function logic() {
    players.forEach(player => {
       player.update(); 
       blobs = blobs.filter(blob => blob.update(player));
    });
    while (blobs.length < 10)
        blobs.push(new Blob());
}

let second = 0;

function draw() {
    for (let i = 0; i < players.length; i++) {
        players[i].updateGraphics()
        if (VERTICAL)
            image(players[i].graphics, 0, SIZE * i);
        else image(players[i].graphics, SIZE * i, 0);
    }
}

let keysDown = new Set();

function keyPressed(e) {
    // console.log(e)
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

function waver(base, mult, fun, speed=400) {
    return base + mult * fun(millis()/speed);
}

//TODO render a p5.Graphics for each player and put them side to side