const LOGIC_TPS = 60;
const SIZE = 720;
const WIDTH = SIZE;
const HEIGHT = SIZE;

const BOOST_STRENGTH = 4;
const BOOST_SHRINK = 0.99; // ~0.99


let show_scores = true;

let players = [];
let blobs = [];
let graphics = {};


// key bindings (processed by function cleanKey)
const WASD = {
    UP: "W",
    LEFT: "A",
    DOWN: "S",
    RIGHT: "D",
    ROT_LEFT: "Q",
    ROT_RIGHT: "E",
    BOOST: "SPACE"
}
const IJKL = {
    UP: "I",
    LEFT: "J",
    DOWN: "K",
    RIGHT: "L",
    ROT_LEFT: "U",
    ROT_RIGHT: "O",
    BOOST: "SLASH"
}
const NUMPAD = {
    UP: "NUMPAD8",
    LEFT: "NUMPAD4",
    DOWN: "NUMPAD5",
    RIGHT: "NUMPAD6",
    ROT_LEFT: "NUMPAD7",
    ROT_RIGHT: "NUMPAD9",
    BOOST: "NUMPADENTER"
}

let useVerticalLayout = false;
let searchParams;
function preload() {
    searchParams = new URLSearchParams(window.location.search);
    useVerticalLayout = searchParams.has('vertical');
}

function setup() {
    frameRate(60);
    pcount = (searchParams.get('WASD') !== '') + (searchParams.get('IJKL') !== '') +  (searchParams.get('NUMPAD') !== '') //temp
    let relSize = useVerticalLayout ? [1, 1 - (pcount-1)*0.2] : [1 - (pcount-1)*0.2, 1];
    
    if (searchParams.get('WASD'))
        players.push(new Player(searchParams.get('WASD') ?? "Djungelskog", color("Magenta"), WASD, 1, relSize));
    if (searchParams.get('IJKL'))
        players.push(new Player(searchParams.get('IJKL') ?? "Blåhaj", color("MediumSpringGreen"), IJKL, 1, relSize));
    if (searchParams.get('NUMPAD'))
        players.push(new Player(searchParams.get('NUMPAD') ?? "Råtta", color("Tomato"), NUMPAD, 1, relSize));

    if (players.length === 0) select('body').html('<img src="https://i.imgflip.com/7q0o8b.jpg" alt="No players? 💀">');

    if (useVerticalLayout)
        createCanvas(SIZE, players.reduce((acc, player) => acc + player.gHeight, 0));
    else createCanvas(players.reduce((acc, player) => acc + player.gWidth, 0), SIZE);

    noStroke();
    logic();
    setInterval(logic, 1000 / LOGIC_TPS);
}

function draw() {
    let x = 0;    
    let y = 0;    
    players.forEach(player => {
        player.updateGraphics();
        image(player.graphics, x, y);
        push()
            noFill()
            stroke("#551071")
            strokeWeight(2)
            rect(x, y, player.gWidth, player.gHeight)
        pop()
        if (useVerticalLayout)
            y += player.gHeight;
        else x += player.gWidth;
    });

    // show scores
    if (show_scores){
        push()
        textAlign(LEFT, CENTER)
        textSize(24);
        textFont('Fredoka');
        fill(255);
        
        leaderboard = [...players].sort((p1, p2) => p2.score - p1.score)
        for (let i = 0; i < leaderboard.length; i++) {
            push()
                fill(leaderboard[i].color)
                circle(30, 30 + i * 50, map(leaderboard[i].original_radius, 0, leaderboard[0].original_radius, 0, 35))
            pop()
            text(leaderboard[i].name, 60, 32 + i * 50);
        }
        pop()
    }
}

class Drawable {
    constructor () {}
    draw(povPlayer) {
        povPlayer.graphics.fill(this.getColor());
        povPlayer.graphics.circle(this.posX - povPlayer.posX, this.posY - povPlayer.posY, 2 * this.radius);
    }
} 

class Player extends Drawable {

    constructor(name, color, keys, scale = 1, relSize) {
        super()
        this.name = name;
        this.color = color;

        this.gWidth = SIZE * relSize[0];
        this.gHeight = SIZE * relSize[1];
        this.scale = scale;
        this.graphics = createGraphics(this.gWidth, this.gHeight);
        this.graphics.noStroke()
        this.keys = keys;

        this.posX = SIZE/2 + random(-SIZE/3, SIZE/3);
        this.posY = SIZE/2 + random(-SIZE/3, SIZE/3);
        
        this.fuel = 100;
        this.boosting = false;
        this.original_radius = this.radius = 20;
        this.speed = 3;
        this.rotation = 0;
        this.score = 0;

    }

    update() {
        this.rotation += (keysDown.has(this.keys['ROT_LEFT']) - keysDown.has(this.keys['ROT_RIGHT'])) * .05;

        let horizontal = keysDown.has(this.keys['RIGHT']) - keysDown.has(this.keys['LEFT']);  // -1 0 1
        let useVerticalLayout = keysDown.has(this.keys['DOWN']) - keysDown.has(this.keys['UP']);       // -1 0 1
        
        let boosting_mult = 1; 
        if (keysDown.has(this.keys['BOOST']) && this.fuel > 0){
            this.fuel -= 1;
            this.boosting = true;
            this.radius = clamp(this.radius * (BOOST_SHRINK), this.original_radius/4, this.original_radius)
            boosting_mult = BOOST_STRENGTH;
        } else {
            this.boosting = false;
            this.radius = clamp(this.radius * (1/BOOST_SHRINK), this.original_radius/4, this.original_radius);
        }

        if (horizontal == 0 && useVerticalLayout == 0) return;
        
        let angles = [];
        
        if (horizontal === -1) angles.push(PI);
        else if (horizontal === 1) angles.push(0);
        if (useVerticalLayout === -1) angles.push(PI/2);
        else if (useVerticalLayout === 1) angles.push(3 * PI / 2);

        let movementAngle = this.rotation;
        if (horizontal === 1 && useVerticalLayout === 1)
            movementAngle += -PI/4;
        else movementAngle += angles.reduce((acc, angle) => acc + angle, 0) / angles.length;

        
        let padding = this.radius + 5;
        this.posX = clamp(this.posX + this.speed * boosting_mult * cos(movementAngle), padding, WIDTH - padding);
        this.posY = clamp(this.posY + this.speed * boosting_mult * - sin(movementAngle), padding, HEIGHT - padding);

    }

    updateGraphics() {
        this.graphics.background(0);
    
        this.graphics.translate(this.gWidth/2, this.gHeight/2);
        this.graphics.rotate(this.rotation);
        this.graphics.scale(this.scale)
        
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
    
    eat(whomst) {
        this.score += whomst.score;
        this.gainFuel(whomst.fuel);
        this.original_radius += log(1 + whomst.radius)/10;
    }

    getColor() {
        // return lerpColor(color(255), this.color, this.fuel / 100);
        return lerpColor(color(0, 0, 0, 0), this.color, 0.2 + this.fuel/100 * 0.8); // less fuel -> less alpha, capped at 10%
    }

    gainFuel(amount) {
        this.fuel = clamp(this.fuel + amount, 0, 100)
    }
}

class Blob extends Drawable {

    constructor() {
        super();
        this.radius = 0.001;
        this.score = 1;
        this.fuel = 20;
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
            player.eat(this)
            return false
        } 
    }

    getColor() {
        return this.color;
    }

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

let keysDown = new Set();

function cleanKey(keyEvent) {
    return keyEvent.code.replace(/^Key([A-Z])/, '$1').toUpperCase();
}

function keyPressed(e) {
    e.preventDefault()
    if(e.key === "-") return players.forEach(player => player.scale *= 0.9)
    if(e.key === "+") return players.forEach(player => player.scale *= 1/0.9)
    // console.log(cleanKey(e))
    keysDown.add(cleanKey(e))

}

function keyReleased(e) {
    keysDown.delete(cleanKey(e))
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