const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const scale = 50;

class HexGrid {
    constructor() {
        this.nodes = {};
        this.edges = [];
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
        // Draw hexes
        for (let key in this.nodes) {
            let node = this.nodes[key];
            let { x, y } = cubicToPixel(node.q, node.r);
            drawHexagon(x, y);
        }

        // Edges
        for (let edge of this.edges) {
            let pointA = cubicToPixel(edge.a.q, edge.a.r);
            let pointB = cubicToPixel(edge.b.q, edge.b.r);
            ctx.beginPath();
            ctx.moveTo(pointA.x, pointA.y);
            ctx.lineTo(pointB.x, pointB.y);
            ctx.strokeStyle = '#ff0000';
            ctx.stroke();
            ctx.closePath();
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
            { q: 2, r: 1 },
            { q: -1, r: 3 },
            { q: -3, r: 2 },
            { q: -2, r: -1 },
            { q: 1, r: -3 },
        ];
        for (let offset of offsets) {
            created = created.concat(this.generateSevenHexes(q + offset.q, r + offset.r));
        }
        this.createEdgesBetween(created);
        return created;
    }

    createEdgesBetween(nodes) {
        for (let a of Object.values(nodes)) {
            for (let b of Object.values(nodes)) {
                if (a === b) continue;
                if (Math.abs(a.q - b.q) > 1) continue;
                if (Math.abs(a.r - b.r) > 1) continue;
                if (Math.abs(a.s - b.s) > 1) continue;
                this.edges.push({ a, b });
            }
        }
    }
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

function generateHexMaze(nodes, edges) {
    // Abstract the grid to a graph and apply prim's

    // TODO
}

const graph = new HexGrid();
graph.generateFourtyNineHexes(2, 5);
graph.render();
generateHexMaze(graph.nodes, graph.edges);