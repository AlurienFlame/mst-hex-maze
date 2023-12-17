const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const scale = 50;
const offsets = [
    { q: 1, r: -1 },
    { q: 1, r: 0 },
    { q: 0, r: -1 },
    { q: 0, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
];

class HexGrid {
    constructor() {
        this.nodes = [];
    }

    findNodeSlow(q, r, s) {
        for (let node of this.nodes) {
            if (node.q === q && node.r === r && node.s === s) {
                return node;
            }
        }
        return null;
    }

    addNode(q, r, s) {
        this.nodes.push({ q, r, s });
    }

    render() {
        for (let node of this.nodes) {
            let { x, y } = cubicToPixel(node.q, node.r);
            drawHexagon(x, y);
        }
    }

    generateSevenHexes(q, r) {
        for (let offset of offsets) {
            this.addNode(q + offset.q, r + offset.r, 0);
        }
    }

    generateFourtyNineHexes(q, r) {
        for (let offset of offsets) {
            this.generateSevenHexes(q + offset.q, r + offset.r);
        }
    }
}
const graph = new HexGrid();
graph.generateFourtyNineHexes(2, 5);
graph.render();

function pixelToCubic(px, py) {
    pixelToHexMatrix = [
        [Math.sqrt(3) / 3, -1 / 3],
        [0, 2 / 3]
    ];

    // Transform the pixel coordinates to cubic coordinates
    let q = pixelToHexMatrix[0][0] * px + pixelToHexMatrix[0][1] * py;
    let r = pixelToHexMatrix[1][0] * px + pixelToHexMatrix[1][1] * py;

    // Round the cubic coordinates to the nearest hexagon
    let qRounded = Math.round(q);
    let rRounded = Math.round(r);
    let sRounded = Math.round(-q - r);

    return { q: qRounded, r: rRounded, s: sRounded };
}

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