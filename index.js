const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

class HexGrid {
    constructor() {
        this.nodes = {};
        this.edges = [];
        this.minimumTree = [];
        this.visited = [];
    }

    findNode(q, r, s) {
        return this.nodes[`${q},${r},${s}`];
    }

    addNode(q, r, s) {
        if (this.findNode(q, r, s)) {
            console.warn(`Node ${q},${r},${s} already exists`);
            return this.findNode(q, r, s);
        }
        let newNode = { q, r, s };
        this.nodes[`${q},${r},${s}`] = newNode;
        return newNode;
    }

    addEdge(a, b) {
        let existingEdge = this.edges.find(edge => {
            return (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a);
        });
        if (existingEdge) {
            console.warn(`Edge between ${a.q},${a.r},${a.s} and ${b.q},${b.r},${b.s} already exists`);
            return;
        }
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
                // No connected neighbor in this direction
                if (!neighbor || !node.edges.some(edge => edge.a === neighbor || edge.b === neighbor)) {
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
        // Connect with edges
        this.stitchTogetherWithEdges(
            created,
            Object.values(this.nodes)
        );
        // Build MST with edges
        generateHexMaze(Object.values(this.nodes), Object.values(this.nodes).map(node => node.edges).flat(),
            this.minimumTree, this.visited);
        return created;
    }

    stitchTogetherWithEdges(nodesA, nodesB) {
        for (let i = 0; i < nodesA.length; i++) {
            for (let j = 0; j < nodesB.length; j++) {
                let nodeA = nodesA[i];
                let nodeB = nodesB[j];
                if (cubicDistance(nodeA, nodeB) === 1) {
                    this.addEdge(nodeA, nodeB);
                }
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

function generateHexMaze(nodes, edges, spanningTree, visited) {
    // Abstract the grid to a graph and apply prim's
    if (visited.length === 0) {
        visited.push(nodes[0]);
    }

    for (let edge of edges) {
        edge.weight = Math.random();
    }

    while (visited.length < nodes.length) {
        // Find all edges that are connected to the visited nodes
        let frontier = visited.map(node => node.edges).flat();
        // Filter to only edges that connect to unvisited nodes
        frontier = frontier.filter(edge => {
            return !visited.includes(edge.a) || !visited.includes(edge.b);
        });
        if (!frontier.length) {
            console.warn('Disconnected graph');
            break;
        }

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

const STATES = {
    WAITING: 0,
    SEARCHING: 1,
    RECONSTRUCTING: 2,
    FOLLOWING: 3
};

class Pathfinder {
    frontier;
    came_from;
    costs;
    pathfindingState = STATES.WAITING;
    path;
    reset() {
        this.frontier = [player.pos];
        this.came_from = new Map();
        this.came_from.set(player.pos, null);
        this.costs = new Map();
        this.costs.set(player.pos, 0);
        this.path = [];
        this.pathfindingState = STATES.SEARCHING;
    }

    iteratePathfinding() {
        if (this.pathfindingState === STATES.WAITING) {
            return;
        } else if (this.pathfindingState === STATES.SEARCHING) {
            if (!this.frontier.length) {
                console.warn('No path found');
                this.pathfindingState = STATES.WAITING;
                return;
            }

            // visit the next node of the frontier
            this.frontier.sort((a, b) => this.costs.get(a) - this.costs.get(b));
            let current = this.frontier.shift();

            // if we found the goal, reconstruct the path
            if (current === goal.pos) {
                this.pathfindingState = STATES.RECONSTRUCTING;
                return;
            }

            // add all its neighbors to the frontier
            let neighbors = current.edges
                .filter(edge => edge.open)
                .map(edge => edge.a === current ? edge.b : edge.a);

            for (let neighbor of neighbors) {
                let newCost = cubicDistance(neighbor, player.pos) + cubicDistance(neighbor, goal.pos);
                if (!this.costs.has(neighbor) || newCost < neighbor.cost) {
                    this.costs.set(neighbor, newCost);
                    this.frontier.push(neighbor);
                    this.came_from.set(neighbor, current);
                }
            }
        } else if (this.pathfindingState === STATES.RECONSTRUCTING) {
            // Reconstruct the path
            this.path = [];
            let current = goal.pos;
            while (current !== player.pos) {
                this.path.unshift(current);
                current = this.came_from.get(current);
            }
            this.pathfindingState = STATES.FOLLOWING;
            this.frontier = [];
            this.came_from = new Map();
        } else if (this.pathfindingState === STATES.FOLLOWING) {
            // Step player along path
            player.pos = this.path?.shift();
            if (player.pos === goal.pos) {
                this.pathfindingState = STATES.WAITING;
            }
        }
    }

    render() {
        // Searching
        if (this.came_from?.size) {
            for (let node of Array.from(this.came_from.keys())) {
                fillHex(node, '#fcbbb5');
            }
        }
        if (this.frontier?.length) {
            for (let node of this.frontier) {
                fillHex(node, '#fc8479');
            }
        }

        // Following
        // TODO: Dynamic curving
        if (this.path?.length) {
            ctx.lineWidth = 5;
            connect(player.pos, this.path[0], '#46992f');
            for (let i = 0; i < this.path.length - 1; i++) {
                connect(this.path[i], this.path[i + 1], '#46992f');
            }
            ctx.lineWidth = 1;
        }
    }
}

function loop() {
    pathfinder.iteratePathfinding();
    render();
}

function render() {
    // Reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;

    // Render pathfinding
    pathfinder.render();

    // Render hex grid
    graph.render();

    // player
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

function snap(q, r) {
    return [
        Math.round(q / 7) * 7,
        Math.round(r / 7) * 7
    ]
}

canvas.addEventListener('click', (e) => {
    let { q, r, s } = pixelToCubic(e.offsetX, e.offsetY);
    let clickedNode = graph.findNode(q, r, s);
    if (!clickedNode) {
        let [snappedQ, snappedR] = snap(q, r);
        graph.generateFourtyNineHexes(snappedQ, snappedR);
        return;
    }
    if (player.pos === clickedNode) {
        return;
    }
    goal.pos = graph.findNode(q, r, s);
    pathfinder.reset();
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
graph.generateFourtyNineHexes(7, 0);

const pathfinder = new Pathfinder();

let player = { pos: graph.findNode(0, 0, 0) };
let goal = {};

const fps = 30;
setInterval(loop, 1000 / fps);