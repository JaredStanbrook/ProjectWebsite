class SVG {
    constructor() {
        this.ratio = 297 / 210;

        this.width = 1280;

        this.height = this.width / this.ratio;

        this.el = document.querySelector("svg");

        this.el.setAttribute("width", this.width + "px");
        this.el.setAttribute("height", this.height + "px");
    }
}

class Scene {
    constructor(svg) {
        this.svg = svg;
        this.isPaused = false;
    }

    generate() {
        noise.seed(Math.random());

        this.svg.el.innerHTML = "";

        this.pathB = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.pathB.setAttribute("fill", "none");
        this.pathB.setAttribute("stroke", "#5eff00");
        this.pathB.setAttribute("stroke-width", "1px");

        this.pathR = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.pathR.setAttribute("fill", "none");
        this.pathR.setAttribute("stroke", "#235c01");
        this.pathR.setAttribute("stroke-width", "1px");

        this.svg.el.append(this.pathB);
        this.svg.el.append(this.pathR);

        this.rows = {
            b: [],
            r: [],
        };

        this.cols = {
            b: [],
            r: [],
        };

        const paddingX = 200;
        const paddingY = 200;
        const width = this.svg.width - paddingX;
        const height = this.svg.height - paddingY;
        const totalCols = width * 0.05;
        const totalRows = height * 0.06;
        const stepX = width / totalCols;
        const stepY = height / totalRows;

        this.strength = 10;

        this.flag = {
            x: paddingX / 2,
            y: paddingY / 2,
            width,
            height,
            lines: [],
        };

        for (let i = 0; i < totalRows; i++) {
            const line = [];

            for (let j = 0; j < totalCols; j++) {
                const px = this.flag.x + j * stepX;
                const py = this.flag.y + i * stepY;

                const point = {
                    originX: px,
                    originY: py,
                    offsetX: 0,
                    offsetY: 0,
                    x: px,
                    y: py,
                };

                line.push(point);
            }

            this.flag.lines.push(line);
        }

        for (let i = 0; i < totalRows; i++) {
            const pathB = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const pathR = document.createElementNS("http://www.w3.org/2000/svg", "path");

            this.rows.b.push(pathB);
            this.rows.r.push(pathR);

            this.pathB.append(pathB);
            this.pathR.append(pathR);
        }

        for (let i = 0; i < totalCols; i++) {
            const pathB = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const pathR = document.createElementNS("http://www.w3.org/2000/svg", "path");

            this.cols.b.push(pathB);
            this.cols.r.push(pathR);

            this.pathB.append(pathB);
            this.pathR.append(pathR);
        }

        if (this.isPaused) {
            this.move(performance.now());
            this.draw();
            this.save();
        } else {
            this.animate();
        }
    }

    move(time) {
        // Move
        this.flag.lines.forEach((line) => {
            line.forEach((point) => {
                const distort =
                    noise.perlin2(
                        (point.originX + performance.now() * 0.02) * 0.002,
                        (point.originY + performance.now() * 0.015) * 0.004
                    ) * this.strength;
                const offsetX = Math.cos(distort) * this.strength * 1.25;
                const offsetY = Math.sin(distort) * this.strength * 1.5;

                point.offsetX = offsetX;
                point.offsetY = offsetY;
                point.x = point.originX + offsetX;
                point.y = point.originY + offsetY;
            });
        });
    }

    draw() {
        const self = this;

        const aStrength = 0.35;

        // Rows
        (function () {
            self.flag.lines.forEach((line, index) => {
                let p1 = line[0];

                // Start curve
                let d = "M " + p1.x + " " + p1.y + " ";
                let d2 =
                    "M " +
                    (p1.x + p1.offsetX * aStrength) +
                    " " +
                    (p1.y + p1.offsetY * aStrength) +
                    " ";

                line.forEach((p1, index) => {
                    const p2 = line[index + 1] || line[line.length - 1];

                    d +=
                        "Q " +
                        p1.x +
                        " " +
                        p1.y +
                        " " +
                        (p1.x + p2.x) / 2 +
                        " " +
                        (p1.y + p2.y) / 2 +
                        " ";

                    d2 +=
                        "Q " +
                        (p1.x + p1.offsetX * aStrength) +
                        " " +
                        (p1.y + p1.offsetY * aStrength) +
                        " " +
                        (p1.x + p1.offsetX * aStrength + p2.x + p2.offsetX * aStrength) / 2 +
                        " " +
                        (p1.y + p1.offsetY * aStrength + p2.y + p2.offsetY * aStrength) / 2 +
                        " ";
                });

                self.rows.b[index].setAttribute("d", d);
                self.rows.r[index].setAttribute("d", d2);
            });
        })();

        // Cols
        (function () {
            const cols = [];

            self.flag.lines.forEach((line, i) => {
                line.forEach((p, j) => {
                    if (!cols[j]) {
                        cols[j] = [];
                    }

                    cols[j].push(p);
                });
            });

            cols.forEach((col, index) => {
                let d = "";
                let d2 = "";

                col.forEach((p, index) => {
                    let cmd = "L";
                    if (index === 0) {
                        cmd = "M";
                    }

                    d += " " + cmd + " " + p.x + " " + p.y + " ";
                    d2 +=
                        " " +
                        cmd +
                        " " +
                        (p.x + p.offsetX * aStrength) +
                        " " +
                        (p.y + p.offsetY * aStrength) +
                        " ";
                });

                self.cols.b[index].setAttribute("d", d);
                self.cols.r[index].setAttribute("d", d2);
            });
        })();
    }

    animate() {
        this.startTime = performance.now();
        if (this.raf) {
            cancelAnimationFrame(this.raf);
        }
        this.tick();
    }

    tick(nowTime) {
        if (!this.isPaused) {
            const deltaTime = nowTime - this.startTime;

            this.move(deltaTime);
            this.draw();
        }

        this.raf = requestAnimationFrame(this.tick.bind(this));
    }
}

const scene = new Scene(new SVG());
scene.generate();
