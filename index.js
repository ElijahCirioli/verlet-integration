const canvas = document.getElementById("ropeCanvas");
const context = canvas.getContext("2d");

let dt; //delta time
let lastTimestamp; //the timestamp of the last frame
let running = false; //are the physics active?
let points = [];

class Vec {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
	}

	subtract(v) {
		this.x -= v.x;
		this.y -= v.y;
	}

	scale(multiplier) {
		this.x *= multiplier;
		this.y *= multiplier;
	}
}

class Point {
	constructor(pos, locked) {
		this.pos = pos;
		this.locked = locked;
		this.radius = 6;
	}

	draw() {
		if (this.locked) {
			context.fillStyle = "#e6372e";
		} else {
			context.fillStyle = "#49b2eb";
		}
		context.beginPath();
		context.arc(this.pos.x, this.pos.y, this.radius, 0, 7);
		context.fill();
	}

	intersect(v) {
		const squaredDistance = Math.pow(v.x - this.pos.x, 2) + Math.pow(v.y - this.pos.y, 2);
		const squaredDiameter = Math.pow(2 * this.radius, 2);
		return squaredDistance <= squaredDiameter;
	}
}

function setup() {
	lastTimestamp = Date.now();
	requestAnimationFrame(tick);
}

function draw() {
	context.clearRect(0, 0, canvas.width, canvas.height);

	for (const p of points) {
		p.draw();
	}
}

function physics() {}

function tick() {
	//calculate delta time
	dt = Date.now() - lastTimestamp;
	lastTimestamp = Date.now();

	//update physics and display to user
	if (running) physics();
	draw();

	//loop back to do it all again
	requestAnimationFrame(tick);
}

canvas.onclick = (e) => {
	e = e || window.event;

	const rect = e.target.getBoundingClientRect();
	const pos = new Vec(e.clientX - rect.left, e.clientY - rect.top);

	for (let i = 0; i < points.length; i++) {
		p = points[i];
		if (p.intersect(pos)) {
			if (p.locked) {
				points.splice(i, 1);
				i--;
			} else {
				p.locked = true;
			}
			return;
		}
	}
	points.push(new Point(pos, false));
};

document.onload = setup();
