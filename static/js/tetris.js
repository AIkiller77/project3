/**
 * Tetris Game Implementation
 * Based on the standard Tetris Guideline
 */

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF0D72', // I - Cyan
    '#0DC2FF', // J - Blue
    '#0DFF72', // L - Orange
    '#F538FF', // O - Yellow
    '#FF8E0D', // S - Green
    '#FFE138', // T - Purple
    '#3877FF'  // Z - Red
];

// Tetromino shapes
const SHAPES = [
    null,
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// Game variables
let canvas;
let ctx;
let grid = createMatrix(COLS, ROWS);
let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    level: 1,
    lines: 0,
    dropCounter: 0,
    dropInterval: 1000,
    gameOver: false,
    paused: false,
    moves: []  // Store player moves for AI training
};

// AI variables
let aiLevel = 1;
let aiActive = false;
let aiMoveInterval = null;

// DOM elements
let startBtn;
let pauseBtn;
let resetBtn;
let scoreElement;
let levelElement;
let linesElement;
let aiLevelSelect;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log("Tetris initialization starting");
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element not found for Tetris game");
        return;
    }
    
    ctx = canvas.getContext('2d');
    console.log("Canvas context:", ctx);
    
    // Adjust canvas size - ensure canvas has the correct dimensions
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    console.log("Canvas dimensions set to:", canvas.width, "x", canvas.height);
    
    // Set scale for crisp rendering
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    
    // Get DOM elements
    startBtn = document.getElementById('start-game');
    pauseBtn = document.getElementById('pause-game');
    resetBtn = document.getElementById('reset-game');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    linesElement = document.getElementById('lines');
    aiLevelSelect = document.getElementById('ai-level');
    
    console.log("Tetris DOM elements:", {
        startBtn, pauseBtn, resetBtn, scoreElement, levelElement, linesElement, aiLevelSelect
    });
    
    // Add event listeners
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (aiLevelSelect) {
        aiLevelSelect.addEventListener('change', () => {
            aiLevel = parseInt(aiLevelSelect.value);
        });
    }
    
    // Draw initial empty grid
    draw();
    console.log("Tetris initialization complete");
});

// Create a matrix (2D array) filled with zeros
function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// Start the game
function startGame() {
    if (player.gameOver || !player.matrix) {
        // Reset the game state
        grid = createMatrix(COLS, ROWS);
        player.score = 0;
        player.level = 1;
        player.lines = 0;
        player.gameOver = false;
        player.paused = false;
        player.moves = [];
        
        // Update UI
        scoreElement.textContent = player.score;
        levelElement.textContent = player.level;
        linesElement.textContent = player.lines;
        
        // Create a new tetromino
        playerReset();
        
        // Start the game loop
        lastTime = 0;
        requestAnimationFrame(update);
        
        // Update button states
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        aiLevelSelect.disabled = true;
        
        // Start AI if enabled
        aiLevel = parseInt(aiLevelSelect.value);
        aiActive = aiLevel > 0;
        if (aiActive) {
            startAI();
        }
    } else if (player.paused) {
        // Resume the game
        player.paused = false;
        pauseBtn.textContent = 'Pause';
        requestAnimationFrame(update);
    }
}

// Pause the game
function pauseGame() {
    if (!player.gameOver && player.matrix) {
        player.paused = !player.paused;
        pauseBtn.textContent = player.paused ? 'Resume' : 'Pause';
        if (!player.paused) {
            requestAnimationFrame(update);
        }
    }
}

// Reset the game
function resetGame() {
    // Stop AI if active
    if (aiActive) {
        clearInterval(aiMoveInterval);
        aiActive = false;
    }
    
    // Reset game state
    grid = createMatrix(COLS, ROWS);
    player.score = 0;
    player.level = 1;
    player.lines = 0;
    player.gameOver = true;
    player.paused = false;
    player.matrix = null;
    
    // Update UI
    scoreElement.textContent = player.score;
    levelElement.textContent = player.level;
    linesElement.textContent = player.lines;
    
    // Update button states
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    aiLevelSelect.disabled = false;
    pauseBtn.textContent = 'Pause';
    
    // Draw empty grid
    draw();
}

// Create a new tetromino
function playerReset() {
    // Select a random tetromino
    const pieces = 'IJLOSTZ';
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    const index = pieces.indexOf(type) + 1;
    
    player.matrix = SHAPES[index];
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    
    // Check if game over (collision on spawn)
    if (collide(grid, player)) {
        // Game over
        player.gameOver = true;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = false;
        aiLevelSelect.disabled = false;
        
        // Save game results
        if (window.apiUtils) {
            window.apiUtils.saveGameResults('tetris', player.score, aiLevel)
                .then(response => {
                    if (response.success) {
                        console.log('Game results saved successfully');
                    }
                });
            
            // Save gameplay data for AI training
            if (player.moves.length > 0) {
                window.apiUtils.saveGameplayData('tetris', player.moves)
                    .then(response => {
                        if (response.success) {
                            console.log('Gameplay data saved successfully');
                        }
                    });
            }
        }
        
        // Stop AI if active
        if (aiActive) {
            clearInterval(aiMoveInterval);
            aiActive = false;
        }
    }
}

// Check if the tetromino collides with the grid or boundaries
function collide(grid, player) {
    const matrix = player.matrix;
    const pos = player.pos;
    
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0 &&
                (grid[y + pos.y] === undefined ||
                 grid[y + pos.y][x + pos.x] === undefined ||
                 grid[y + pos.y][x + pos.x] !== 0)) {
                return true;
            }
        }
    }
    
    return false;
}

// Merge the tetromino with the grid
function merge(grid, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                grid[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Rotate the tetromino
function playerRotate(dir) {
    if (player.gameOver || player.paused) return;
    
    // Record move for AI training
    player.moves.push({
        type: 'rotate',
        dir: dir,
        pos: {...player.pos},
        matrix: JSON.parse(JSON.stringify(player.matrix))
    });
    
    // Rotate the matrix
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    
    // Wall kick - try to adjust position if rotation causes collision
    while (collide(grid, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// Rotate a matrix (2D array)
function rotate(matrix, dir) {
    // Transpose the matrix
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    
    // Reverse each row or column based on rotation direction
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Move the tetromino left or right
function playerMove(dir) {
    if (player.gameOver || player.paused) return;
    
    // Record move for AI training
    player.moves.push({
        type: 'move',
        dir: dir,
        pos: {...player.pos},
        matrix: JSON.parse(JSON.stringify(player.matrix))
    });
    
    player.pos.x += dir;
    if (collide(grid, player)) {
        player.pos.x -= dir;
    }
}

// Drop the tetromino by one row
function playerDrop() {
    if (player.gameOver || player.paused) return;
    
    // Record move for AI training
    player.moves.push({
        type: 'drop',
        pos: {...player.pos},
        matrix: JSON.parse(JSON.stringify(player.matrix))
    });
    
    player.pos.y++;
    if (collide(grid, player)) {
        player.pos.y--;
        merge(grid, player);
        playerReset();
        arenaSweep();
    }
    player.dropCounter = 0;
}

// Hard drop the tetromino to the bottom
function playerHardDrop() {
    if (player.gameOver || player.paused) return;
    
    // Record move for AI training
    player.moves.push({
        type: 'hardDrop',
        pos: {...player.pos},
        matrix: JSON.parse(JSON.stringify(player.matrix))
    });
    
    while (!collide(grid, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(grid, player);
    playerReset();
    arenaSweep();
    player.dropCounter = 0;
}

// Check for completed lines and clear them
function arenaSweep() {
    let linesCleared = 0;
    
    outer: for (let y = grid.length - 1; y >= 0; y--) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === 0) {
                continue outer;
            }
        }
        
        // Remove the completed line
        const row = grid.splice(y, 1)[0].fill(0);
        grid.unshift(row);
        y++;
        
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        // Update score based on number of lines cleared
        // Using the original Nintendo scoring system
        const scoreValues = [0, 40, 100, 300, 1200];
        player.score += scoreValues[linesCleared] * player.level;
        player.lines += linesCleared;
        
        // Level up every 10 lines
        player.level = Math.floor(player.lines / 10) + 1;
        
        // Increase speed with level
        player.dropInterval = 1000 * Math.pow(0.8, player.level - 1);
        
        // Update UI
        scoreElement.textContent = player.score;
        levelElement.textContent = player.level;
        linesElement.textContent = player.lines;
    }
}

// Draw the game
function draw() {
    // Clear the canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the grid
    drawMatrix(grid, {x: 0, y: 0});
    
    // Draw the current tetromino
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
    
    // Draw game over message
    if (player.gameOver && !player.matrix) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, COLS, ROWS);
        
        ctx.font = '1px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', COLS / 2, ROWS / 2 - 1);
        ctx.fillText(`Score: ${player.score}`, COLS / 2, ROWS / 2);
        ctx.fillText('Press Start to play again', COLS / 2, ROWS / 2 + 1);
    }
    
    // Draw pause message
    if (player.paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, COLS, ROWS);
        
        ctx.font = '1px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', COLS / 2, ROWS / 2);
    }
}

// Draw a matrix (tetromino or grid)
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Draw block border
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.lineWidth = 0.1;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// Game update loop
let lastTime = 0;
function update(time = 0) {
    if (player.gameOver || player.paused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    player.dropCounter += deltaTime;
    if (player.dropCounter > player.dropInterval) {
        playerDrop();
    }
    
    draw();
    requestAnimationFrame(update);
}

// Start AI player
function startAI() {
    // Clear any existing interval
    if (aiMoveInterval) {
        clearInterval(aiMoveInterval);
    }
    
    // Set AI move interval based on difficulty level
    const aiSpeed = 1000 / aiLevel;
    
    aiMoveInterval = setInterval(() => {
        if (player.gameOver || player.paused) return;
        
        // Simple AI strategy based on difficulty level
        const move = getAIMove();
        
        // Execute the move
        if (move.rotate) {
            playerRotate(1);
        }
        
        if (move.direction !== 0) {
            playerMove(move.direction);
        }
        
        if (move.hardDrop) {
            playerHardDrop();
        }
    }, aiSpeed);
}

// Get AI move based on current game state
function getAIMove() {
    // Clone the current game state for simulation
    const simulatedGrid = grid.map(row => [...row]);
    const simulatedPlayer = {
        pos: {...player.pos},
        matrix: player.matrix.map(row => [...row])
    };
    
    // Evaluate different moves
    let bestScore = -Infinity;
    let bestMove = { rotate: false, direction: 0, hardDrop: false };
    
    // Try different rotations
    for (let rotation = 0; rotation < 4; rotation++) {
        // Try different horizontal positions
        for (let x = -5; x <= 5; x++) {
            // Reset simulation to current state
            simulatedPlayer.pos = {...player.pos};
            simulatedPlayer.matrix = player.matrix.map(row => [...row]);
            
            // Apply rotation
            for (let r = 0; r < rotation; r++) {
                rotate(simulatedPlayer.matrix, 1);
            }
            
            // Apply horizontal movement
            simulatedPlayer.pos.x += x;
            
            // Check if valid position
            if (collide(simulatedGrid, simulatedPlayer)) {
                simulatedPlayer.pos.x -= x;
                continue;
            }
            
            // Simulate dropping to bottom
            while (!collide(simulatedGrid, simulatedPlayer)) {
                simulatedPlayer.pos.y++;
            }
            simulatedPlayer.pos.y--;
            
            // Evaluate this move
            const score = evaluateMove(simulatedGrid, simulatedPlayer);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = {
                    rotate: rotation > 0,
                    direction: x,
                    hardDrop: true
                };
            }
        }
    }
    
    return bestMove;
}

// Evaluate a potential move
function evaluateMove(grid, player) {
    // Clone grid and merge the piece
    const simulatedGrid = grid.map(row => [...row]);
    
    // Merge the piece into the grid
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                simulatedGrid[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
    
    // Calculate metrics
    const heights = calculateHeights(simulatedGrid);
    const holes = calculateHoles(simulatedGrid);
    const completedLines = calculateCompletedLines(simulatedGrid);
    const bumpiness = calculateBumpiness(heights);
    
    // Weights for different metrics (adjust based on AI level)
    const weights = {
        completedLines: 0.76,
        holes: -0.35,
        bumpiness: -0.18,
        height: -0.51
    };
    
    // Calculate score
    let score = 0;
    score += weights.completedLines * completedLines;
    score += weights.holes * holes;
    score += weights.bumpiness * bumpiness;
    score += weights.height * Math.max(...heights);
    
    return score;
}

// Calculate column heights
function calculateHeights(grid) {
    const heights = new Array(COLS).fill(0);
    
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            if (grid[y][x] !== 0) {
                heights[x] = ROWS - y;
                break;
            }
        }
    }
    
    return heights;
}

// Calculate number of holes (empty cells with filled cells above)
function calculateHoles(grid) {
    let holes = 0;
    
    for (let x = 0; x < COLS; x++) {
        let blockFound = false;
        
        for (let y = 0; y < ROWS; y++) {
            if (grid[y][x] !== 0) {
                blockFound = true;
            } else if (blockFound) {
                holes++;
            }
        }
    }
    
    return holes;
}

// Calculate number of completed lines
function calculateCompletedLines(grid) {
    let lines = 0;
    
    outer: for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === 0) {
                continue outer;
            }
        }
        lines++;
    }
    
    return lines;
}

// Calculate bumpiness (sum of differences between adjacent column heights)
function calculateBumpiness(heights) {
    let bumpiness = 0;
    
    for (let i = 0; i < heights.length - 1; i++) {
        bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    
    return bumpiness;
}

// Keyboard event handlers
document.addEventListener('keydown', event => {
    if (player.gameOver) return;
    
    switch (event.keyCode) {
        case 37: // Left arrow
        case 65: // A
            playerMove(-1);
            break;
        case 39: // Right arrow
        case 68: // D
            playerMove(1);
            break;
        case 40: // Down arrow
        case 83: // S
            playerDrop();
            break;
        case 38: // Up arrow
        case 87: // W
            playerRotate(1);
            break;
        case 32: // Space
            playerHardDrop();
            break;
        case 80: // P
            pauseGame();
            break;
    }
});
