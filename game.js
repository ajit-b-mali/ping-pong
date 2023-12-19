/**
 * @type HTMLCanvasElement
 * @type HTMLMediaElement
 */

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

let oldTimeStamp = 0;
let dt = 0;
let gameObjects = [];
let player1;
let player2;
let ball;
let pause = true;

let hitS = new Audio("sounds/ball-player-collision.mp3");
let failS = new Audio("sounds/ball-out.mp3");
let restartS = new Audio("sounds/restart.mp3");

class GameObject {
    constructor(ctx, canvas, x, y) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }
}

class Player extends GameObject {
    constructor(ctx, canvas, x, y) {
        super(ctx, canvas, x, y);

        this.w = 10;
        this.h = this.canvas.height / 4;
        this.score = {
            x: (this.x < this.canvas.width / 2) ? this.canvas.width / 4 : this.canvas.width * 3 / 4,
            y: this.canvas.height / 2,
            s: 0,
        };
    }

    update(dt) {
        this.y += this.vy * dt;
        playerWallCollisionY(this, this.canvas);
        ballPlayerCollisionX(ball, this);
        ballPlayerCollisionY(ball, this);
    }

    draw() {
        this.ctx.fillStyle = "rgba(255, 255, 255, .08)";
        this.ctx.font = "200px courier";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(this.score.s, this.score.x, this.score.y);
        this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
        this.ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}
player1 = new Player(ctx, canvas, 20, canvas.height / 2 - canvas.height / 8);
player2 = new Player(ctx, canvas, canvas.width - 20 - 10, canvas.height / 2 - canvas.height / 8);

gameObjects.push(player1, player2);

class Ball extends GameObject {
    constructor(ctx, canvas, x, y) {
        super(ctx, canvas, x, y);

        this.r = 10;
        this.a = 5;

        this.angle = Math.random() * 120 - 60;
        this.rad = this.angle * Math.PI / 180;
        this.vy = 250 * Math.sin(this.rad);
        this.vx = (250 * Math.cos(this.rad)) * (Math.random() > 0.5 ? 1 : -1);

        this.out = false;
    }

    update(dt) {
        this.vx += this.a * dt * Math.sign(this.vx);
        this.vy += this.a * dt * Math.sign(this.vy);

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        ballWallInteraction(this, this.canvas);
    }

    draw() {
        this.ctx.fillStyle = "rgba(255, 255, 255, 1)";

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }
}
ball = new Ball(ctx, canvas, canvas.width / 2, canvas.height / 2);
gameObjects.push(ball);

function reposition(b, p1, p2, c) {
    b.x = c.width / 2;
    b.y = c.height / 2;

    p1.x = 20;
    p1.y = c.height / 2 - c.height / 8;

    p2.x = c.width - 20 - 10;
    p2.y = c.height / 2 - c.height / 8;
}

function restart(b, p1, p2, c) {
    reposition(b, p1, p2, c);

    b.angle = Math.random() * 120 - 60;
    b.rad = b.angle * Math.PI / 180;
    b.vy = 250 * Math.sin(b.rad);
    b.vx = (250 * Math.cos(b.rad)) * (Math.random() > 0.5 ? 1 : -1);
}

function handleBallOut(b, p1, p2, c) {
    let x;
    b.out = false;
    if (b.x < 0) {
        p2.score.s++;
        x = 0;
    }
    if (b.x > c.width) {
        p1.score.s++;
        x = canvas.width / 2;
    }
    restart(b, p1, p2, c);
    ctx.fillStyle = "rgba(255, 0, 0, .5)";
    ctx.fillRect(x, 0, canvas.width / 2, canvas.height);
    pause = true;
}


function drawCenterLine() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, .5)";

    ctx.beginPath();
    ctx.setLineDash([20, 15, 5, 15]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


function ballWallInteraction(ball, canvas) {
    if (ball.x - ball.r > canvas.width || ball.x + ball.r < 0) {
        ball.out = true;
        failS.play();
    }

    if (ball.y + ball.r > canvas.height) {
        ball.y = canvas.height - ball.r - 0.01;
        ball.vy *= -1;
    } else if (ball.y - ball.r < 0) {
        ball.y = ball.r + 0.01;
        ball.vy *= -1;
    }
}


function rectInsideRectBound(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x1 < x2 || x1 + w1 > x2 + w2 || y1 < y2 || y1 + h1 > y2 + h2) {
        return true;
    }
    return false;
}

function playerWallCollisionY(p, canvas) {
    if (rectInsideRectBound(p.x, p.y, p.w, p.h, 0, 0, canvas.width, canvas.height)) {
        if (p.vy < 0) {
            p.y = 0.01;
            p.vy = 0;
        } else if (p.vy > 0) {
            p.y = canvas.height - p.h - 0.01;
        }
    }
}

function circleRectIntersect(x1, y1, r1, x2, y2, w2, h2) {
    if (x1 + r1 < x2 || x1 - r1 > x2 + w2 || y1 + r1 < y2 || y1 - r1 > y2 + h2) {
        return false;
    }
    return true;
}

function ballPlayerCollisionX(b, p) {
    p.isColliding = false;
    if (circleRectIntersect(b.x, b.y, b.r, p.x, p.y, p.w, p.h)) {
        hitS.play();
        p.isColliding = true;
        if (b.vx > 0) {
            b.x = p.x - b.r - 0.01;
            b.vx *= -1;
        } else if (b.vx < 0) {
            b.x = p.x + p.w + b.r + 0.01;
            b.vx *= -1;
        }

        if (b.y < p.y + p.h / 4) {
            b.vy = -Math.abs(b.vy);
        }
        if (b.y > p.y + p.h * 3 / 4) {
            b.vy = Math.abs(b.vy);
        }
    }
}

function ballPlayerCollisionY(b, p) {
    p.isColliding = false;
    if (circleRectIntersect(b.x, b.y, b.r, p.x, p.y, p.w, p.h)) {
        p.isColliding = true;
        if (b.vy > 0) {
            b.y = p.y - b.r - 0.01;
            b.vy *= -1;
        } else if (b.vy < 0) {
            b.y = p.y + p.h + b.r + 0.01;
            b.vy *= -1;
        }
    }
}

function update(dt) {
    gameObjects.forEach(obj => {
        obj.update(dt);
    });
}

function draw() {
    drawCenterLine();

    gameObjects.forEach(obj => {
        obj.draw();
    });
}

function gameLoop(timeStamp) {
    dt = Math.min((timeStamp - oldTimeStamp) / 1000, 0.1);
    oldTimeStamp = timeStamp;
    if (!pause) {
        update(dt);
    }
    clear();
    if (ball.out) {
        handleBallOut(ball, player1, player2, canvas);
    }
    draw();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', e => {
    if (e.key == "ArrowUp") {
        player2.vy = -500;
    }
    if (e.key == "ArrowDown") {
        player2.vy = 500;
    }

    if (e.key == "w") {
        player1.vy = -500;
    }
    if (e.key == "s") {
        player1.vy = 500;
    }
    if (e.key == "Enter" && pause) {
        pause = false;
        restartS.play();
    }
});

window.addEventListener('keyup', e => {
    if (e.key == "ArrowUp") {
        player2.vy = 0;
    }
    if (e.key == "ArrowDown") {
        player2.vy = 0;
    }

    if (e.key == "w") {
        player1.vy = 0;
    }
    if (e.key == "s") {
        player1.vy = 0;
    }
});