"use strict";
class Material {
    update;
    colour;
    constructor(colour, update = () => { }) {
        this.colour = colour;
        this.update = update;
    }
    static none = new Material("#000");
    static sand = new Material("#ff0", (self, x, y) => {
        switch (Material.none) {
            case state.get(x, y + 1):
                state.set(x, y + 1, self);
                break;
            case state.get(x + 1, y + 1):
                if (state.get(x + 1, y) == Material.none) {
                    state.set(x + 1, y + 1, self);
                    break;
                }
            case state.get(x - 1, y + 1):
                if (state.get(x - 1, y) == Material.none) {
                    state.set(x - 1, y + 1, self);
                    break;
                }
            default:
                return;
        }
        state.set(x, y, Material.none);
    });
    static wall = new Material("#7f7f7f");
    static bomb = new Material("#f00", (self, x, y) => {
        var radius = 5;
        if (state.get(x, y + 1) == Material.none)
            state.set(x, y + 1, self);
        else {
            console.log("boom");
            for (var offX = -radius; offX <= radius; offX++)
                for (var offY = -radius; offY <= radius; offY++)
                    if (offX ** 2 + offY ** 2 <= (radius * (3 / 4) + radius / 4 * Math.random()) ** 2)
                        state.set(x + offX, y + offY, Material.none);
        }
        state.set(x, y, Material.none);
    });
}
const state = new class {
    scale = 4;
    canvas = document.getElementById("falling_sand");
    context = this.canvas.getContext("2d");
    arr = Array(this.canvas.width / this.scale);
    arrOld = Array(this.canvas.width / this.scale);
    mouseX = 0;
    mouseY = 0;
    placeRadius = 0;
    placeMaterial = Material.sand;
    placing = false;
    clickPlace = false;
    constructor() {
        for (var i = 0; i < this.arr.length; i++) {
            this.arr[i] = Array(this.canvas.height / this.scale).fill(Material.none);
            this.arrOld[i] = Array(this.canvas.height / this.scale).fill(Material.none);
        }
        const updateMouse = (e) => {
            const bounds = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - bounds.left) / this.scale | 0;
            this.mouseY = (e.clientY - bounds.top) / this.scale | 0;
        };
        this.canvas.addEventListener("mousemove", updateMouse);
        this.canvas.addEventListener("mousedown", e => {
            if (this.clickPlace)
                this.place();
            if (e.button == 0)
                this.placing = true;
            updateMouse(e);
        });
        const mouseUp = (e) => {
            this.placing = false;
            updateMouse(e);
        };
        this.canvas.addEventListener("mouseup", mouseUp);
        this.canvas.addEventListener("mouseleave", mouseUp);
        document.getElementById("place_radius_up").onclick = e => {
            if (e.button == 0)
                this.placeRadius++;
        };
        document.getElementById("place_radius_down").onclick = e => {
            if (e.button == 0 && this.placeRadius > 0)
                this.placeRadius--;
        };
        var setButton = document.getElementById("place_mode");
        setButton.onclick = e => {
            if (e.button == 0) {
                this.clickPlace = !this.clickPlace;
                setButton.textContent = this.clickPlace ? "click" : "hold";
            }
        };
        document.getElementById("clear").onclick = e => {
            if (e.button == 0)
                for (var x = 0; x < this.arr.length; x++)
                    for (var y = 0; y < this.arr[x].length; y++)
                        this.set(x, y, Material.none);
        };
        const buttons = document.getElementById("buttons");
        const addMaterialButton = (content, material) => {
            const button = document.createElement("button");
            button.textContent = content;
            button.onclick = e => {
                if (e.button == 0)
                    this.placeMaterial = material;
            };
            buttons.appendChild(button);
        };
        addMaterialButton("none", Material.none);
        addMaterialButton("sand", Material.sand);
        addMaterialButton("wall", Material.wall);
        addMaterialButton("bomb", Material.bomb);
    }
    get(x, y) {
        if (x < 0 || x >= this.arr.length || y < 0 || y >= this.arr[0].length)
            return Material.wall;
        return this.arrOld[x][y];
    }
    set(x, y, value) {
        if (x < 0 || x >= this.arr.length || y < 0 || y >= this.arr[0].length)
            return;
        this.arr[x][y] = value;
    }
    place() {
        for (var offX = -this.placeRadius; offX <= this.placeRadius; offX++)
            for (var offY = -this.placeRadius; offY <= this.placeRadius; offY++)
                if (offX ** 2 + offY ** 2 <= this.placeRadius ** 2)
                    this.set(this.mouseX + offX, this.mouseY + offY, this.placeMaterial);
    }
    update() {
        for (var x = 0; x < this.arr.length; x++)
            for (var y = 0; y < this.arr[x].length; y++) {
                if (!this.clickPlace && this.placing)
                    this.place();
                this.arrOld[x][y] = this.arr[x][y];
                var material = this.get(x, y);
                material.update(material, x, y);
                this.context.fillStyle = material.colour;
                this.context.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
            }
    }
};
function loop() {
    state.update();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
