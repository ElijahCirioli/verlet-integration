const canvas = document.getElementById("simulation-canvas");
const context = canvas.getContext("2d");

const gravitationalConstant = 0.0007;
const numIterations = 500;

let dt; //delta time
let lastTimestamp; //the timestamp of the last frame
let running = false; //are the physics active?
let points = []; //all of the points
let lines = []; //all of the lines
let tool = "dot"; //the tool they are using
let lineStartPoint, mousePos; //data to draw preview line

class Vec {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	subtract(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	scale(multiplier) {
		this.x *= multiplier;
		this.y *= multiplier;
		return this;
	}

	length() {
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}

	clone() {
		return new Vec(this.x, this.y);
	}
}

class Point {
	constructor(pos, locked) {
		this.pos = pos;
		this.prevPos = pos.clone();
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

class Line {
	constructor(pointA, pointB) {
		this.pointA = pointA;
		this.pointB = pointB;
		this.length = pointA.pos.clone().subtract(pointB.pos).length();
	}

	draw() {
		context.lineWidth = 2;
		context.strokeStyle = "#71c6f5";
		context.setLineDash([0, 0]);
		context.beginPath();
		context.moveTo(this.pointA.pos.x, this.pointA.pos.y);
		context.lineTo(this.pointB.pos.x, this.pointB.pos.y);
		context.stroke();
	}
}

function setup() {
	lastTimestamp = Date.now();
	requestAnimationFrame(tick);
}

function draw() {
	context.clearRect(0, 0, canvas.width, canvas.height);

	//draw actual lines
	for (const l of lines) {
		l.draw();
	}

	//draw dots
	for (const p of points) {
		p.draw();
	}

	//draw preview line
	if (tool === "endLine" && lineStartPoint && mousePos.x >= 0) {
		context.lineWidth = 3;
		context.strokeStyle = "rgba(120, 120, 120, 0.7)";
		context.setLineDash([5, 5]);
		context.beginPath();
		context.moveTo(lineStartPoint.pos.x, lineStartPoint.pos.y);
		context.lineTo(mousePos.x, mousePos.y);
		context.stroke();
	}
}

function physics() {
	for (const p of points) {
		if (!p.locked) {
			const previousPosition = p.pos.clone();
			//keep moving in the same direction (thanks, Newton)
			p.pos.add(p.pos.clone().subtract(p.prevPos));
			//apply gravity
			p.pos.y += gravitationalConstant * Math.pow(dt, 2);
			//save old position
			p.prevPos = previousPosition;
		}
	}

	for (let i = 0; i < numIterations; i++) {
		//loop through array in semi-random order
		let clonedLines = lines.slice(0);
		while (clonedLines.length > 0) {
			const index = Math.floor(Math.random() * clonedLines.length);
			const l = clonedLines[index];
			clonedLines.splice(index, 1);

			//calculate center of line and it's direction
			const center = l.pointA.pos.clone().add(l.pointB.pos).scale(0.5);
			const direction = l.pointA.pos.clone().subtract(l.pointB.pos);
			direction.scale(1 / direction.length()); //normalize the direction

			const halfLineVector = direction.scale(l.length / 2);
			if (!l.pointA.locked) {
				l.pointA.pos = center.clone().add(halfLineVector);
			}
			if (!l.pointB.locked) {
				l.pointB.pos = center.clone().subtract(halfLineVector);
			}
		}
	}
}

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

function clickDot(pos) {
	for (let i = 0; i < points.length; i++) {
		p = points[i];
		if (p.intersect(pos)) {
			if (p.locked) {
				removeLinesContainingPoint(p);
				points.splice(i, 1);
				i--;
			} else {
				p.locked = true;
			}
			return;
		}
	}
	points.push(new Point(pos, false));
}

function startLine(pos) {
	for (const p of points) {
		if (p.intersect(pos)) {
			lineStartPoint = p;
			tool = "endLine";
		}
	}
}

function endLine(pos) {
	for (const p of points) {
		if (p.intersect(pos)) {
			tool = "startLine";
			//check for existing lines between these points
			for (const l of lines) {
				if (l.pointA === lineStartPoint && l.pointB === p) {
					return;
				} else if (l.pointB === lineStartPoint && l.pointA === p) {
					return;
				}
			}
			lines.push(new Line(lineStartPoint, p));
		}
	}
}

function removeLinesContainingPoint(p) {
	for (let i = 0; i < lines.length; i++) {
		l = lines[i];
		if (l.pointA === p || l.pointB === p) {
			lines.splice(i, 1);
			i--;
		}
	}
}

canvas.onclick = (e) => {
	e = e || window.event;
	const rect = e.target.getBoundingClientRect();
	const pos = new Vec(e.clientX - rect.left, e.clientY - rect.top);

	if (tool === "dot") {
		clickDot(pos);
	} else if (tool === "startLine") {
		startLine(pos);
	} else if (tool === "endLine") {
		endLine(pos);
	}
};

canvas.onmousemove = (e) => {
	e = e || window.event;
	const rect = e.target.getBoundingClientRect();
	mousePos = new Vec(e.clientX - rect.left, e.clientY - rect.top);
};

canvas.onmouseenter = (e) => {
	e = e || window.event;
	const rect = e.target.getBoundingClientRect();
	mousePos = new Vec(e.clientX - rect.left, e.clientY - rect.top);
};

canvas.onmouseleave = (e) => {
	e = e || window.event;
	mousePos.x = -1;
};

$("#dot-button").click((e) => {
	tool = "dot";
	$(".tool-button").removeClass("active-button");
	$("#dot-button").addClass("active-button");
});

$("#line-button").click((e) => {
	tool = "startLine";
	$(".tool-button").removeClass("active-button");
	$("#line-button").addClass("active-button");
});

$("#cut-button").click((e) => {
	tool = "cut";
	$(".tool-button").removeClass("active-button");
	$("#cut-button").addClass("active-button");
});

$("#clear-button").click((e) => {
	lines = [];
	points = [];
});

$("#run-button").click((e) => {
	if (running) {
		$("#run-button").text("RUN SIMULATION");
		running = false;
	} else {
		$("#run-button").text("STOP SIMULATION");
		running = true;
	}
});

document.onload = setup();
