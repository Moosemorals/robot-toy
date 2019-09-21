import {
    $
} from './common.js'

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
        return this.x === p.x && this.y === p.y;
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

class Bug {
    constructor(p, h, s) {
        this.location = p;
        this.size = 10;
        this.heading = h;
        this.speed = s;
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

    /**
     * Update animation
     */
    tick(board) {
        this.location.x += Math.cos(this.heading) * this.speed;
        this.location.y += Math.sin(this.heading) * this.speed;

        if (this.location.x > board.width || this.location.y > board.height || this.location.x < 0 || this.location.y < 0) {
            this.location.x = board.width / 2;
            this.location.y = board.height / 2;
        }
    }
}


function init() {
    const canvas = $("#c");
    const b = new Board(canvas);
    b.resize();

    for (let i = 0; i < 200; i += 1) {
        b.add(new Bug(new Point(b.width / 2, b.height / 2), 2 * Math.PI * Math.random(), Math.random()));
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
