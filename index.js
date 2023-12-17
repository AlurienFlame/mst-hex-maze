const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const scale = 50;

class HexGrid {
    constructor() {
        this.nodes = {};
    }

    findNode(q, r, s) {
        return this.nodes[`${q},${r},${s}`];
    }

    addNode(q, r, s) {
        if (this.findNode(q, r, s)) {
            return;
        }
        let newNode = { q, r, s };
        this.nodes[`${q},${r},${s}`] = newNode;
        return newNode;
    }

    render() {
        for (let key in this.nodes) {
            let node = this.nodes[key];
            let { x, y } = cubicToPixel(node.q, node.r);
            drawHexagon(x, y);
        }
    }

    generateSevenHexes(q, r) {
        let created = [];
        const offsets = [
            { q: 1, r: -1 },
            { q: 1, r: 0 },
            { q: 0, r: -1 },
            { q: 0, r: 0 },
            { q: 0, r: 1 },
            { q: -1, r: 0 },
            { q: -1, r: 1 },
        ];
        for (let offset of offsets) {
            created.push(this.addNode(q + offset.q, r + offset.r, 0));
        }
        return created;
    }

    generateFourtyNineHexes(q, r) {
        let created = [];
        const offsets = [
            { q: 0, r: 0 },
            { q: 3, r: -2 },
            { q: 2, r: 1},
            { q: -1, r: 3 },
            { q: -3, r: 2 },
            { q: -2, r: -1 },
            { q: 1, r: -3 },
        ];
        for (let offset of offsets) {
            created.push(this.generateSevenHexes(q + offset.q, r + offset.r));
        }
        return created;
    }
}
const graph = new HexGrid();
graph.generateFourtyNineHexes(2, 5);
graph.render();

function cubicToPixel(q, r) {
    qBasis = { x: Math.sqrt(3), y: 0 };
    rBasis = { x: Math.sqrt(3) / 2, y: 3 / 2 };
    transformationMatrix = [
        [qBasis.x, rBasis.x],
        [qBasis.y, rBasis.y]
    ];

    let x = scale * (qBasis.x * q + rBasis.x * r);
    let y = scale * (qBasis.y * q + rBasis.y * r);
    return { x, y };
}

function drawHexagon(x, y) {
    ctx.translate(x, y);
    ctx.beginPath();

    ctx.rotate(Math.PI / 6);
    ctx.moveTo(scale, 0);
    for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.lineTo(scale, 0);
    }
    ctx.rotate((2 * Math.PI) - (Math.PI / 6)); // Reset rotation

    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.closePath();
    ctx.translate(-x, -y);
}

function generateHexMaze(nodes) {
    // Abstract the grid to a graph and apply prim's
    let edges = [];

    for (let i = 0; i < 10; i++) {
        edges.push([]);
        for (let j = 0; j < 10; j++) {
            edges[i].push([]);

        }
    }

    // TODO
}