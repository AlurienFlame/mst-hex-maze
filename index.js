const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

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
        for (let node of Object.values(this.nodes)) {
            let { x, y } = cubicToPixel(node.q, node.r);
            ctx.font = `${scale / 4}px Arial`;
            ctx.fillStyle = '#000000';
            ctx.fillText(`${node.q},${node.r},${node.s}`, x, y);
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

function cubicRound(qFloat, rFloat, sFloat) {
    // Round all coordinates to whole numbers
    let [q, r, s] = [Math.round(qFloat), Math.round(rFloat), Math.round(sFloat)];

    // Reset coordinate with largest drift
    let [deltaQ, deltaR, deltaS] = [Math.abs(q - qFloat), Math.abs(r - rFloat), Math.abs(s - sFloat)];
    let max = Math.max(deltaQ, deltaR, deltaS);
    if (deltaQ === max) {
        q = -r - s;
    } else if (deltaR === max) {
        r = -q - s;
    } else {
        s = -q - r;
    }
    return { q, r, s };
}

function matrixMultiply(matrix, vector) {
    return [
        matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
        matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
    ];
}

function pixelToCubic(px, py) {
    // Exactly reverse the cubicToPixel function
    px -= canvas.width / 2 + cameraPos.x;
    py -= canvas.height / 2 + cameraPos.y;

    transformationMatrix = [
        [Math.sqrt(3) / 3, -1 / 3],
        [0, 2 / 3]
    ];

    let [q, r] = matrixMultiply(transformationMatrix, [px, py]).map(i => i / scale);
    return cubicRound(q, r, -q - r);
}

function cubicToPixel(q, r) {
    qBasis = { x: Math.sqrt(3), y: 0 };
    rBasis = { x: Math.sqrt(3) / 2, y: 3 / 2 };
    transformationMatrix = [
        [qBasis.x, rBasis.x],
        [qBasis.y, rBasis.y]
    ];

    let [x, y] = matrixMultiply(transformationMatrix, [q, r]).map(i => i * scale);

    x += canvas.width / 2 + cameraPos.x;
    y += canvas.height / 2 + cameraPos.y;
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

let frontier;
let came_from;
let costs;
const STATES = {
    WAITING: 0,
    SEARCHING: 1,
    RECONSTRUCTING: 2,
    FOLLOWING: 3
};
let pathfindingState = STATES.WAITING;
function initializeNewPathfinding() {
    frontier = [player.pos];
    came_from = new Map();
    costs = new Map();
    costs.set(player.pos, 0);
    pathfindingState = STATES.SEARCHING;
}

let path;
function iteratePathfinding() {
    if (pathfindingState === STATES.WAITING) {
        return;
    } else if (pathfindingState === STATES.SEARCHING) {

        // visit the next node of the frontier
        frontier.sort((a, b) => costs.get(a) - costs.get(b));
        let current = frontier.shift();

        // if we found the goal, reconstruct the path
        if (current === goal.pos) {
            pathfindingState = STATES.RECONSTRUCTING;
            return;
        }

        // add all its neighbors to the frontier
        let neighbors = current.edges
            .filter(edge => edge.open)
            .map(edge => edge.a === current ? edge.b : edge.a);

        for (let neighbor of neighbors) {
            let newCost = cubicDistance(neighbor, player.pos) + cubicDistance(neighbor, goal.pos);
            if (!costs.has(neighbor) || newCost < neighbor.cost) {
                costs.set(neighbor, newCost);
                frontier.push(neighbor);
                came_from.set(neighbor, current);
            }
        }
    } else if (pathfindingState === STATES.RECONSTRUCTING) {
        // Reconstruct the path
        path = [];
        let current = goal.pos;
        while (current !== player.pos) {
            path.unshift(current);
            current = came_from.get(current);
        }
        pathfindingState = STATES.FOLLOWING;
    } else if (pathfindingState === STATES.FOLLOWING) {
        // Step player along path
        player.pos = path?.shift();
        if (player.pos === goal.pos) {
            pathfindingState = STATES.WAITING;
        }
    }
}

function loop() {
    iteratePathfinding();
    render();
}

function render() {
    // Reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;

    // pathfinding
    if (pathfindingState === STATES.SEARCHING) {
        for (let node of frontier || []) {
            fillHex(node, '#fc8479');
        }
        for (let node of Array.from(came_from.values()) || []) {
            fillHex(node, '#fcbbb5');
        }
    }

    // Render hex grid
    graph.render();

    // path
    // TODO: Dynamic curving
    if (path?.length) {
        ctx.lineWidth = 5;
        connect(player.pos, path[0], '#46992f');
        for (let i = 0; i < path.length - 1; i++) {
            connect(path[i], path[i + 1], '#46992f');
        }
        ctx.lineWidth = 1;
    }

    //  player
    mark(player.pos, '#ff0000');

    // goal
    if (goal.pos) {
        mark(goal.pos, '#0000ff');
    }
}

function mark(node, color) {
    ctx.fillStyle = color;
    let { x, y } = cubicToPixel(node.q, node.r);
    ctx.beginPath();
    ctx.arc(x, y, scale / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function connect(nodeA, nodeB, color) {
    ctx.strokeStyle = color;
    let pointA = cubicToPixel(nodeA.q, nodeA.r);
    let pointB = cubicToPixel(nodeB.q, nodeB.r);
    ctx.beginPath();
    ctx.moveTo(pointA.x, pointA.y);
    ctx.lineTo(pointB.x, pointB.y);
    ctx.stroke();
    ctx.closePath();
}

function fillHex(node, color) {
    ctx.fillStyle = color;
    let { x, y } = cubicToPixel(node.q, node.r);
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0, -scale);
    for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.lineTo(0, -scale);
    }
    ctx.fill();
    ctx.translate(-x, -y);
    ctx.closePath();
}

canvas.addEventListener('click', (e) => {
    let { q, r, s } = pixelToCubic(e.offsetX, e.offsetY);
    if (player.pos === graph.findNode(q, r, s)) {
        return;
    }
    goal.pos = graph.findNode(q, r, s);
    initializeNewPathfinding();
});

let scale = 50;
const zoomSpeed = 0.05;
const maxScale = 100;
const minScale = 10;
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale -= e.deltaY * zoomSpeed;
    scale = Math.max(minScale, Math.min(maxScale, scale));
});

let cameraPos = { x: 0, y: 0 };
document.addEventListener('keydown', (e) => {
    // pan
    // TODO: Culling
    if (e.key === 'ArrowLeft') {
        cameraPos.x += scale;
    } else if (e.key === 'ArrowRight') {
        cameraPos.x -= scale;
    } else if (e.key === 'ArrowUp') {
        cameraPos.y += scale;
    } else if (e.key === 'ArrowDown') {
        cameraPos.y -= scale;
    }
});

const graph = new HexGrid();
graph.generateFourtyNineHexes(0, 0);
generateHexMaze(Object.values(graph.nodes), graph.edges);

let player = { pos: graph.findNode(0, 0, 0) };
let goal = {};

const fps = 30;
setInterval(loop, 1000 / fps);