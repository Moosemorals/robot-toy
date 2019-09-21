import {
    $,
    append,
    emptyElement
} from './common.js'

const STATE = {
    success: "success",
    running: "running",
    failed: "failed"
}

const LOCATION_DELTA = 10;
const ANGLE_DELTA = 0.01;
const TAU = Math.PI * 2;

function locationDeltaEqual(a, b) {
    return Math.abs(a - b) < LOCATION_DELTA;
}

function angleDeltaEqual(a, b) {
    return Math.abs(a - b) < ANGLE_DELTA;
}

function headingTo(p1, p2) {
    const t = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    if (t < 0) {
        return t + TAU;
    }
    return t;
}

function log(msg) {
    append(emptyElement($("#log")), msg);
}

class Point {
    /**
     *
     * @param {int} x
     * @param {int} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns true if this point and p are at the same place
     * @param {Point} p
     */
    equals(p) {
        return locationDeltaEqual(this.x, p.x) && locationDeltaEqual(this.y, p.y)
    }

    clamp(width, height) {
        while (this.x < 0) {
            this.x += width;
        }
        this.x %= width;
        while (this.y < 0) {
            this.y += height;
        }
        this.y %= height;
    }

    dot(p) {

    }
}

class Board {
    constructor(canvas) {
        this.items = [];
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    get width() {
        return this.canvas.width;
    }

    get height() {
        return this.canvas.height;
    }

    /**
     * Returns the list of items at a point
     * @param {Point} p
     */
    at(p) {
        return items.filter(i => i.location.equals(p))
    }

    /**
     * Add an item to the board
     * @param {object} item
     */
    add(item) {
        this.items.push(item);
    }

    /**
     * Draw all the items that the board knows about
     */
    draw() {
        this.context.clearRect(0, 0, this.width, this.height);
        for (let i = 0; i < this.items.length; i += 1) {
            const item = this.items[i];
            this.context.save();
            this.context.translate(item.location.x, item.location.y)
            item.draw(this.context);
            this.context.restore();
        }
    }

    resize() {
        this.canvas.width = document.documentElement.clientWidth * 0.95;
        this.canvas.height = document.documentElement.clientHeight * 0.95;
    }

    tick() {
        for (let i = 0; i < this.items.length; i += 1) {
            this.items[i].tick(this);
        }
    }
}

class Action {}

class TurnToTarget extends Action {
    constructor() {
        super();
    }

    tick(actor) {
        const theta = headingTo(actor.location, actor.target);
        if (angleDeltaEqual(actor.heading, theta)) {
            return STATE.success;
        } else if (actor.heading < theta) {
            actor.heading += 0.01;
            if (actor.heading > TAU) {
                actor.heading -= TAU;
            }
        } else {
            actor.heading -= 0.01;
            if (actor.heading < 0) {
                actor.heading += TAU;
            }
        }
        return STATE.running;
    }
}

class MoveTowardsTarget extends Action {
    constructor() {
        super();
    }

    tick(actor) {
        if (actor.location.equals(actor.target)) {
            return STATE.success;
        } else {
            actor.location.x += Math.cos(actor.heading) * actor.speed;
            actor.location.y += Math.sin(actor.heading) * actor.speed;
            return STATE.running;
        }
    }
}

class SetTarget extends Action {
    constructor(t) {
        super();
        this.target;
    }

    tick(actor) {
        actor.targt = this.target;
        return STATE.success;
    }
}

class Sequence extends Action {
    constructor(...a) {
        super();
        this.actions = a;
        this.current = 0;
    }

    tick(actor) {
        if (this.current >= this.actions.length) {
            return STATE.success;
        } else {
            switch (this.actions[this.current].tick(actor)) {
                case STATE.success:
                    this.current += 1;
                    if (this.current >= this.actions.length) {
                        return STATE.success;
                    }
                    return STATE.running;
                case STATE.failed:
                    return STATE.failed;
                case STATE.running:
                    return STATE.running;
            }
        }
    }
}


class Actor {
    constructor(p, h, s) {
        this.location = p;
        this.heading = h;
        this.speed = s;
        this.scratch = {};

        this.size = 10;

    }

    /**
     *
     * @param {CanvasRenderingContext2D} g
     */
    draw(g) {
        g.save();
        g.rotate(this.heading);
        g.beginPath();
        g.moveTo(0, -this.size * 1.5)
        g.lineTo(this.size * 1.5, 0)
        g.lineTo(0, this.size * 1.5)
        g.lineTo(0, this.size / 2)
        g.lineTo(-this.size, this.size / 2)
        g.lineTo(-this.size, -this.size / 2)
        g.lineTo(0, -this.size / 2)
        g.closePath();
        g.fill();
        g.restore();
    }

    tick(board) {
        if (this.bt === undefined) {
            this.target = new Point(Math.floor(Math.random() * board.width), Math.floor(Math.random() * board.height));
            this.bt = new Sequence(new TurnToTarget(), new MoveTowardsTarget())
        }
        if (this.bt.tick(this) !== STATE.running) {
            delete this.bt;
        }
    }
}


function init() {
    const canvas = $("#c");
    const b = new Board(canvas);
    b.resize();


    for (let i = 0; i < 20; i += 1) {

        b.add(new Actor(new Point(200, 200), Math.PI, 1));
    }


    function tick() {
        window.requestAnimationFrame(tick);

        b.tick();
        b.draw();
    }

    window.addEventListener("resize", () => b.resize());
    tick();
}



window.addEventListener("DOMContentLoaded", init);
