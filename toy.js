import {
    $,
    append,
    emptyElement
} from './common.js'

const LOCATION_DELTA = 1;
const TAU = Math.PI * 2;
const ANGLE_DELTA = TAU / 360;

const STATE = {
    success: "success",
    running: "running",
    failed: "failed"
}

const HEADING = {
    up: 3 * TAU / 4,
    left: 0,
    down: TAU / 4,
    right: TAU / 2,
}

function locationDeltaEqual(a, b, delta) {
    if (delta === undefined) {
        delta = LOCATION_DELTA
    }
    return Math.abs(a - b) <= delta;
}

function angleDeltaEqual(a, b) {
    return Math.abs(a - b) <= ANGLE_DELTA;
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

    distance(p2) {
        return Math.sqrt((this.x - p2.x) * (this.x - p2.x) + (this.y - p2.y) * (this.y - p2.y));
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

class Target {
    constructor(p) {
        this.size = 10;
        this.location = p;
    }

    draw(g) {
        g.fillStyle = g.createRadialGradient(0, 0, 0, 0, 0, this.size);
        g.fillStyle.addColorStop(0, 'blue');
        g.fillStyle.addColorStop(1, 'white');
        g.beginPath();
        g.moveTo(0, -this.size);
        g.lineTo(this.size, 0);
        g.lineTo(0, this.size);
        g.lineTo(-this.size, 0);
        g.closePath();
        g.fill();
    }

    tick(board) {
        // does nothing
    }
}

class Action {}

class TurnToTarget extends Action {
    constructor() {
        super();
    }

    tick(actor) {

        if (angleDeltaEqual(actor.heading, actor.stepHeading)) {
            actor.heading = actor.stepHeading;
            return STATE.success;
        }

        const angleDiff = ((actor.heading - actor.stepHeading % TAU) + TAU) % TAU;
        if (angleDiff > TAU / 2) {
            actor.heading += ANGLE_DELTA;
        } else {
            actor.heading -= ANGLE_DELTA;
        }
        actor.heading = ((actor.heading % TAU) + TAU) % TAU;
        return STATE.running;
    }
}

class MoveTowardsTarget extends Action {
    constructor() {
        super();
    }

    tick(actor) {
        if (actor.location.equals(actor.step)) {
            return STATE.success;
        } else {
            if (angleDeltaEqual(actor.heading, HEADING.up)) {
                actor.location.y -= actor.speed;
            } else if (angleDeltaEqual(actor.heading, HEADING.left)) {
                actor.location.x += actor.speed;
            } else if (angleDeltaEqual(actor.heading, HEADING.down)) {
                actor.location.y += actor.speed;
            } else if (angleDeltaEqual(actor.heading, HEADING.right)) {
                actor.location.x -= actor.speed;
            } else {
                actor.location.x += Math.cos(actor.heading) * actor.speed;
                actor.location.y += Math.sin(actor.heading) * actor.speed;
                throw new Error("whaterver");
            }
            return STATE.running;
        }
    }
}

class SimpleNavigate extends Action {
    constructor() {
        super();
    }

    tick(actor) {
        actor.path = [];
        const dest = actor.target.location;
        if (dest.x !== actor.location.x) {
            actor.path.push({
                target: new Point(dest.x, actor.location.y),
                heading: dest.x > actor.location.x ? HEADING.left : HEADING.right
            });
        }
        if (dest.y !== actor.location.y) {
            actor.path.push({
                target: new Point(dest.x, dest.y),
                heading: dest.y < actor.location.y ? HEADING.up : HEADING.down
            });
        }
        return STATE.success;
    }
}

class RoutePop extends Action {
    constructor() {
        super();
    }

    tick(actor) {
        if ("path" in actor && actor.path.length > 0) {
            const step = actor.path.shift();
            actor.step = step.target;
            actor.stepHeading = step.heading;
            return STATE.success;
        }
        return STATE.failed;
    }
}

class PickTarget extends Action {
    constructor(board) {
        super();
        this.board = board;
    }

    tick(actor) {
        const best = {
            target: undefined,
            dist: Number.MAX_SAFE_INTEGER
        }
        const targets = this.board.items.filter(i => i instanceof Target);
        for (let i = 0; i < targets.length; i += 1) {
            const dist = actor.location.distance(targets[i].location);
            if (dist < best.dist) {
                best.target = targets[i];
                best.dist = dist;
            }
        }
        if (best.target !== undefined) {
            actor.target = best.target;
            return STATE.success;
        }
        return STATE.failed;
    }
}

class RemoveTarget extends Action {
    constructor(board) {
        super();
        this.board = board;
    }

    tick(actor) {
        const idx = this.board.items.indexOf(actor.target);
        if (idx !== -1) {
            this.board.items.splice(idx, 1);
        }
        delete actor.target;
    }
}

class UntilFail extends Action {
    constructor(a) {
        super();
        this.action = a;
    }

    tick(actor) {
        if (this.action.tick(actor) !== STATE.failed) {
            return STATE.running;
        }
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
                        this.current = 0;
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
    }

    tick(board) {
        if (this.bt === undefined) {
            this.bt = new Sequence(
                new PickTarget(board),
                new SimpleNavigate(),
                new UntilFail(
                    new Sequence(
                        new RoutePop(),
                        new TurnToTarget(),
                        new MoveTowardsTarget()
                    )
                ),
                new RemoveTarget(board)
            );
        }
        if (this.bt.tick(this) !== STATE.running) {
            delete this.bt;
        }
    }
}

function randomPoint(w, h) {
    return new Point(
        Math.floor(Math.random() * (w / 10)) * 10,
        Math.floor(Math.random() * (h / 10)) * 10
    )
}

function init() {
    const canvas = $("#c");
    const b = new Board(canvas);
    b.resize();

    for (let i = 0; i < 20; i += 1) {
        b.add(new Target(randomPoint(b.width, b.height)))
    }

    b.add(new Actor(new Point(200, 200), Math.PI, 1));
    b.add(new Actor(new Point(400, 200), 0, 1));

    function tick() {
        window.requestAnimationFrame(tick);

        b.tick();
        b.draw();
    }

    window.addEventListener("resize", () => b.resize());
    tick();
}

window.addEventListener("DOMContentLoaded", init);
