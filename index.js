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

    addEdge(a, b) {
        let newEdge = { a, b, open: false };
        this.edges.push(newEdge);

        //  Add edge to nodes
        a.edges = a.edges || [];
        a.edges.push(newEdge);
        b.edges = b.edges || [];
        b.edges.push(newEdge);
    }

    render() {
        // Paths based on edges
        // ctx.strokeStyle = '#00ff00';
        // for (let edge of this.edges.filter(edge => edge.open)) {
        //     let pointA = cubicToPixel(edge.a.q, edge.a.r);
        //     let pointB = cubicToPixel(edge.b.q, edge.b.r);
        //     ctx.beginPath();
        //     ctx.moveTo(pointA.x, pointA.y);
        //     ctx.lineTo(pointB.x, pointB.y);
        //     ctx.stroke();
        //     ctx.closePath();
        // }

        // Inner borders
        ctx.strokeStyle = '#000000';
        for (let edge of this.edges.filter(edge => !edge.open)) {
            let pointA = cubicToPixel(edge.a.q, edge.a.r);
            let pointB = cubicToPixel(edge.b.q, edge.b.r);
            let halfway = {
                x: (pointA.x + pointB.x) / 2,
                y: (pointA.y + pointB.y) / 2
            };
            ctx.beginPath();
            ctx.translate(halfway.x, halfway.y);
            ctx.rotate(Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x));
            ctx.moveTo(0, -scale / 2);
            ctx.lineTo(0, scale / 2);
            ctx.stroke();
            ctx.rotate(-Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x));
            ctx.translate(-halfway.x, -halfway.y);
            ctx.closePath();
        }

        // Outer border
        for (let node of Object.values(this.nodes).filter(node => node.edges.length < 6)) {
            let directions = [
                { q: 1, r: -1 },
                { q: 1, r: 0 },
                { q: 0, r: -1 },
                { q: 0, r: 0 },
                { q: 0, r: 1 },
                { q: -1, r: 0 },
                { q: -1, r: 1 },
            ];
            for (let direction of directions) {
                let neighbor = this.findNode(node.q + direction.q, node.r + direction.r, -(node.q + direction.q) - (node.r + direction.r));
                if (!neighbor) {
                    let pointA = cubicToPixel(node.q, node.r);
                    let pointB = cubicToPixel(node.q + direction.q, node.r + direction.r);
                    let halfway = {
                        x: (pointA.x + pointB.x) / 2,
                        y: (pointA.y + pointB.y) / 2
                    };
                    ctx.beginPath();
                    ctx.translate(halfway.x, halfway.y);
                    ctx.rotate(Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x));
                    ctx.moveTo(0, -scale / 2);
                    ctx.lineTo(0, scale / 2);
                    ctx.stroke();
                    ctx.rotate(-Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x));
                    ctx.translate(-halfway.x, -halfway.y);
                    ctx.closePath();
                }
            }
        }

        // Coordinates
        // for (let node of Object.values(this.nodes)) {
        //     let { x, y } = cubicToPixel(node.q, node.r);
        //     ctx.font = '10px Arial';
        //     ctx.fillStyle = '#000000';
        //     ctx.fillText(`${node.q},${node.r},${node.s}`, x, y);
        // }
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
            created.push(this.addNode(q + offset.q, r + offset.r, -(q + offset.q) - (r + offset.r)));
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
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let a = nodes[i];
                let b = nodes[j];
                if (a === b) continue;
                if (cubicDistance(a, b) > 1) continue;
                this.addEdge(a, b);
            }
        }
    }
}

function cubicDistance(a, b) {
    return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
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

function generateHexMaze(nodes, edges) {
    // Abstract the grid to a graph and apply prim's

    for (let edge of edges) {
        edge.weight = Math.random();
    }

    let visited = [nodes[0]];
    let spanningTree = [];

    while (visited.length < nodes.length) {
        // Find all edges that are connected to the visited nodes
        let frontier = visited.reduce((frontier, node) => {
            return frontier.concat(node.edges);
        }, []);
        frontier = frontier.filter(edge => {
            return !visited.includes(edge.a) || !visited.includes(edge.b);
        });

        // Find the smallest of those nodes
        let minEdge = frontier.reduce((min, edge) => {
            return edge.weight < min.weight ? edge : min;
        }, { weight: Infinity });

        // Add it to the spanning tree
        spanningTree.push(minEdge);

        // Mark newly connected nodes as visited
        if (!visited.includes(minEdge.a))
            visited.push(minEdge.a);
        if (!visited.includes(minEdge.b))
            visited.push(minEdge.b);
    }

    for (let edge of spanningTree) {
        edge.open = true;
    }
}

const graph = new HexGrid();
graph.generateFourtyNineHexes(2, 5);
generateHexMaze(Object.values(graph.nodes), graph.edges);
graph.render();