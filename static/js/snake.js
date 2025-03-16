/**
 * Snake Game Implementation
 * Based on the classic Snake game rules
 */

// Game constants
const GRID_SIZE = 20;
const BLOCK_SIZE = 20;
const CANVAS_SIZE = 400;
const GRID_WIDTH = CANVAS_SIZE / BLOCK_SIZE;
const GRID_HEIGHT = CANVAS_SIZE / BLOCK_SIZE;
const COLORS = {
    background: '#111',
    grid: '#222',
    snake: '#4CAF50',
    snakeHead: '#8BC34A',
    food: '#F44336',
    aiSnake: '#2196F3',
    aiSnakeHead: '#03A9F4'
};

// Game variables
let canvas;
let ctx;
let snake = [];
let aiSnake = [];
let food = { x: 0, y: 0 };
let direction = { x: 0, y: 0 };
let aiDirection = { x: 0, y: 0 };
let lastDirection = { x: 0, y: 0 };
let lastAiDirection = { x: 0, y: 0 };
let gameInterval;
let score = 0;
let level = 1;
let gameSpeed = 150;
let gameOver = true;
let paused = false;
let aiActive = false;
let aiLevel = 1;
let playerMoves = [];  // Store player moves for AI training

// DOM elements
let startBtn;
let pauseBtn;
let resetBtn;
let scoreElement;
let levelElement;
let lengthElement;
let aiLevelSelect;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log("Snake initialization starting");
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element not found for Snake game");
        return;
    }
    
    ctx = canvas.getContext('2d');
    console.log("Canvas context:", ctx);
    
    // Adjust canvas size
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    // Get DOM elements
    startBtn = document.getElementById('start-game');
    pauseBtn = document.getElementById('pause-game');
    resetBtn = document.getElementById('reset-game');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    lengthElement = document.getElementById('length');
    aiLevelSelect = document.getElementById('ai-level');
    
    console.log("Snake DOM elements:", {
        startBtn, pauseBtn, resetBtn, scoreElement, levelElement, lengthElement, aiLevelSelect
    });
    
    // Add event listeners
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', resetGame);
    aiLevelSelect.addEventListener('change', () => {
        aiLevel = parseInt(aiLevelSelect.value);
    });
    
    // Draw initial empty grid
    drawGrid();
    console.log("Snake initialization complete");
});

// Start the game
function startGame() {
    if (gameOver || snake.length === 0) {
        // Reset the game state
        resetGameState();
        
        // Start the game loop
        gameInterval = setInterval(gameLoop, gameSpeed);
        
        // Update button states
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        aiLevelSelect.disabled = true;
        
        // Start AI if enabled
        aiLevel = parseInt(aiLevelSelect.value);
        aiActive = aiLevel > 0;
    } else if (paused) {
        // Resume the game
        paused = false;
        pauseBtn.textContent = 'Pause';
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// Pause the game
function pauseGame() {
    if (!gameOver && snake.length > 0) {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        
        if (paused) {
            clearInterval(gameInterval);
            drawPauseScreen();
        } else {
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }
}

// Reset the game
function resetGame() {
    clearInterval(gameInterval);
    gameOver = true;
    paused = false;
    
    // Update button states
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    aiLevelSelect.disabled = false;
    pauseBtn.textContent = 'Pause';
    
    // Draw empty grid
    drawGrid();
}

// Reset game state
function resetGameState() {
    // Initialize snake at the center of the grid
    snake = [
        { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }
    ];
    
    // Initialize AI snake if active
    aiSnake = aiActive ? [
        { x: Math.floor(GRID_WIDTH / 4), y: Math.floor(GRID_HEIGHT / 4) }
    ] : [];
    
    // Initialize direction
    direction = { x: 0, y: 0 };
    lastDirection = { x: 0, y: 0 };
    
    // Initialize AI direction
    aiDirection = aiActive ? { x: 1, y: 0 } : { x: 0, y: 0 };
    lastAiDirection = { x: 0, y: 0 };
    
    // Generate food
    generateFood();
    
    // Reset score and level
    score = 0;
    level = 1;
    gameSpeed = 150;
    gameOver = false;
    paused = false;
    playerMoves = [];
    
    // Update UI
    scoreElement.textContent = score;
    levelElement.textContent = level;
    lengthElement.textContent = snake.length;
}

// Generate food at a random position
function generateFood() {
    // Find all empty cells
    const emptyCells = [];
    
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            // Check if cell is empty (not occupied by snake or AI snake)
            let isEmpty = true;
            
            // Check if cell is occupied by snake
            for (const segment of snake) {
                if (segment.x === x && segment.y === y) {
                    isEmpty = false;
                    break;
                }
            }
            
            // Check if cell is occupied by AI snake
            if (isEmpty && aiActive) {
                for (const segment of aiSnake) {
                    if (segment.x === x && segment.y === y) {
                        isEmpty = false;
                        break;
                    }
                }
            }
            
            if (isEmpty) {
                emptyCells.push({ x, y });
            }
        }
    }
    
    // Randomly select an empty cell
    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        food = emptyCells[randomIndex];
    }
}

// Main game loop
function gameLoop() {
    if (gameOver || paused) return;
    
    // Move snake
    moveSnake();
    
    // Move AI snake if active
    if (aiActive) {
        moveAiSnake();
    }
    
    // Check collisions
    checkCollisions();
    
    // Draw the game
    draw();
}

// Move the snake
function moveSnake() {
    if (direction.x === 0 && direction.y === 0) return;
    
    // Record move for AI training
    playerMoves.push({
        position: [...snake],
        direction: { ...direction },
        foodPosition: { ...food }
    });
    
    // Update last direction
    lastDirection = { ...direction };
    
    // Create new head
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Add new head to the beginning of the snake
    snake.unshift(head);
    
    // Check if snake eats food
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score += 10 * level;
        scoreElement.textContent = score;
        
        // Increase level every 5 food items
        if (snake.length % 5 === 0) {
            level++;
            levelElement.textContent = level;
            
            // Increase game speed
            gameSpeed = Math.max(50, 150 - (level - 1) * 10);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        // Update length display
        lengthElement.textContent = snake.length;
        
        // Generate new food
        generateFood();
    } else {
        // Remove tail if snake didn't eat food
        snake.pop();
    }
}

// Move the AI snake
function moveAiSnake() {
    if (!aiActive || aiSnake.length === 0) return;
    
    // Update last AI direction
    lastAiDirection = { ...aiDirection };
    
    // Determine AI move based on difficulty level
    aiDirection = getAiDirection();
    
    // Create new head
    const head = { ...aiSnake[0] };
    head.x += aiDirection.x;
    head.y += aiDirection.y;
    
    // Add new head to the beginning of the AI snake
    aiSnake.unshift(head);
    
    // Check if AI snake eats food
    if (head.x === food.x && head.y === food.y) {
        // Generate new food
        generateFood();
    } else {
        // Remove tail if AI snake didn't eat food
        aiSnake.pop();
    }
}

// Get AI direction based on difficulty level
function getAiDirection() {
    const head = aiSnake[0];
    const possibleDirections = [];
    
    // Define possible directions (excluding reverse direction)
    if (lastAiDirection.x !== 1) possibleDirections.push({ x: -1, y: 0 }); // Left
    if (lastAiDirection.x !== -1) possibleDirections.push({ x: 1, y: 0 }); // Right
    if (lastAiDirection.y !== 1) possibleDirections.push({ x: 0, y: -1 }); // Up
    if (lastAiDirection.y !== -1) possibleDirections.push({ x: 0, y: 1 }); // Down
    
    // Filter out directions that would cause collision
    const safeDirections = possibleDirections.filter(dir => {
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };
        
        // Check wall collision
        if (newHead.x < 0 || newHead.x >= GRID_WIDTH || newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
            return false;
        }
        
        // Check self collision
        for (let i = 0; i < aiSnake.length; i++) {
            if (newHead.x === aiSnake[i].x && newHead.y === aiSnake[i].y) {
                return false;
            }
        }
        
        // Check player snake collision
        for (let i = 0; i < snake.length; i++) {
            if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
                return false;
            }
        }
        
        return true;
    });
    
    // If no safe directions, continue in current direction
    if (safeDirections.length === 0) {
        return lastAiDirection;
    }
    
    // Level 1: Random movement with some food seeking
    if (aiLevel === 1) {
        // 30% chance to move randomly, 70% chance to seek food
        if (Math.random() < 0.3) {
            const randomIndex = Math.floor(Math.random() * safeDirections.length);
            return safeDirections[randomIndex];
        }
    }
    
    // Level 2 & 3: Seek food with increasing accuracy
    // Calculate distance to food for each direction
    const directionScores = safeDirections.map(dir => {
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };
        const distanceToFood = Math.abs(newHead.x - food.x) + Math.abs(newHead.y - food.y);
        return { direction: dir, score: -distanceToFood };
    });
    
    // Sort by score (highest first)
    directionScores.sort((a, b) => b.score - a.score);
    
    // Level 2: 70% chance to choose best direction, 30% chance to choose randomly
    if (aiLevel === 2 && Math.random() < 0.3) {
        const randomIndex = Math.floor(Math.random() * safeDirections.length);
        return safeDirections[randomIndex];
    }
    
    // Choose best direction
    return directionScores[0].direction;
}

// Check for collisions
function checkCollisions() {
    // Get snake head
    const head = snake[0];
    
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        gameOver = true;
        handleGameOver();
        return;
    }
    
    // Check self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            handleGameOver();
            return;
        }
    }
    
    // Check collision with AI snake
    if (aiActive) {
        for (let i = 0; i < aiSnake.length; i++) {
            if (head.x === aiSnake[i].x && head.y === aiSnake[i].y) {
                gameOver = true;
                handleGameOver();
                return;
            }
        }
        
        // Check if AI snake collides with player snake
        if (aiSnake.length > 0) {
            const aiHead = aiSnake[0];
            
            // Check if AI snake hits player snake
            for (let i = 0; i < snake.length; i++) {
                if (aiHead.x === snake[i].x && aiHead.y === snake[i].y) {
                    // AI snake dies, but game continues
                    aiSnake = [];
                    break;
                }
            }
        }
    }
}

// Handle game over
function handleGameOver() {
    clearInterval(gameInterval);
    
    // Update button states
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    aiLevelSelect.disabled = false;
    
    // Draw game over screen
    drawGameOverScreen();
    
    // Save game results
    if (window.apiUtils) {
        window.apiUtils.saveGameResults('snake', score, aiLevel)
            .then(response => {
                if (response.success) {
                    console.log('Game results saved successfully');
                }
            });
        
        // Save gameplay data for AI training
        if (playerMoves.length > 0) {
            window.apiUtils.saveGameplayData('snake', playerMoves)
                .then(response => {
                    if (response.success) {
                        console.log('Gameplay data saved successfully');
                    }
                });
        }
    }
}

// Draw the game
function draw() {
    // Clear the canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw food
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(food.x * BLOCK_SIZE, food.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // Draw snake
    drawSnake();
    
    // Draw AI snake if active
    if (aiActive && aiSnake.length > 0) {
        drawAiSnake();
    }
}

// Draw the grid
function drawGrid() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

// Draw the snake
function drawSnake() {
    // Draw snake body
    for (let i = 1; i < snake.length; i++) {
        ctx.fillStyle = COLORS.snake;
        ctx.fillRect(snake[i].x * BLOCK_SIZE, snake[i].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw segment border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(snake[i].x * BLOCK_SIZE, snake[i].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    
    // Draw snake head
    if (snake.length > 0) {
        ctx.fillStyle = COLORS.snakeHead;
        ctx.fillRect(snake[0].x * BLOCK_SIZE, snake[0].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw head border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(snake[0].x * BLOCK_SIZE, snake[0].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw eyes
        const eyeSize = BLOCK_SIZE / 5;
        const eyeOffset = BLOCK_SIZE / 4;
        
        ctx.fillStyle = 'black';
        
        // Position eyes based on direction
        if (lastDirection.x === 1) { // Right
            ctx.fillRect((snake[0].x + 1) * BLOCK_SIZE - eyeOffset, snake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect((snake[0].x + 1) * BLOCK_SIZE - eyeOffset, (snake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
        } else if (lastDirection.x === -1) { // Left
            ctx.fillRect(snake[0].x * BLOCK_SIZE + eyeOffset - eyeSize, snake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(snake[0].x * BLOCK_SIZE + eyeOffset - eyeSize, (snake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
        } else if (lastDirection.y === -1) { // Up
            ctx.fillRect(snake[0].x * BLOCK_SIZE + eyeOffset, snake[0].y * BLOCK_SIZE + eyeOffset - eyeSize, eyeSize, eyeSize);
            ctx.fillRect((snake[0].x + 1) * BLOCK_SIZE - eyeOffset, snake[0].y * BLOCK_SIZE + eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (lastDirection.y === 1) { // Down
            ctx.fillRect(snake[0].x * BLOCK_SIZE + eyeOffset, (snake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
            ctx.fillRect((snake[0].x + 1) * BLOCK_SIZE - eyeOffset, (snake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
        } else { // Default (no movement yet)
            ctx.fillRect(snake[0].x * BLOCK_SIZE + eyeOffset, snake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect((snake[0].x + 1) * BLOCK_SIZE - eyeOffset, snake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
        }
    }
}

// Draw the AI snake
function drawAiSnake() {
    // Draw AI snake body
    for (let i = 1; i < aiSnake.length; i++) {
        ctx.fillStyle = COLORS.aiSnake;
        ctx.fillRect(aiSnake[i].x * BLOCK_SIZE, aiSnake[i].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw segment border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(aiSnake[i].x * BLOCK_SIZE, aiSnake[i].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    
    // Draw AI snake head
    if (aiSnake.length > 0) {
        ctx.fillStyle = COLORS.aiSnakeHead;
        ctx.fillRect(aiSnake[0].x * BLOCK_SIZE, aiSnake[0].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw head border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(aiSnake[0].x * BLOCK_SIZE, aiSnake[0].y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw eyes
        const eyeSize = BLOCK_SIZE / 5;
        const eyeOffset = BLOCK_SIZE / 4;
        
        ctx.fillStyle = 'black';
        
        // Position eyes based on direction
        if (lastAiDirection.x === 1) { // Right
            ctx.fillRect((aiSnake[0].x + 1) * BLOCK_SIZE - eyeOffset, aiSnake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect((aiSnake[0].x + 1) * BLOCK_SIZE - eyeOffset, (aiSnake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
        } else if (lastAiDirection.x === -1) { // Left
            ctx.fillRect(aiSnake[0].x * BLOCK_SIZE + eyeOffset - eyeSize, aiSnake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(aiSnake[0].x * BLOCK_SIZE + eyeOffset - eyeSize, (aiSnake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
        } else if (lastAiDirection.y === -1) { // Up
            ctx.fillRect(aiSnake[0].x * BLOCK_SIZE + eyeOffset, aiSnake[0].y * BLOCK_SIZE + eyeOffset - eyeSize, eyeSize, eyeSize);
            ctx.fillRect((aiSnake[0].x + 1) * BLOCK_SIZE - eyeOffset, aiSnake[0].y * BLOCK_SIZE + eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (lastAiDirection.y === 1) { // Down
            ctx.fillRect(aiSnake[0].x * BLOCK_SIZE + eyeOffset, (aiSnake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
            ctx.fillRect((aiSnake[0].x + 1) * BLOCK_SIZE - eyeOffset, (aiSnake[0].y + 1) * BLOCK_SIZE - eyeOffset, eyeSize, eyeSize);
        } else { // Default (no movement yet)
            ctx.fillRect(aiSnake[0].x * BLOCK_SIZE + eyeOffset, aiSnake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect((aiSnake[0].x + 1) * BLOCK_SIZE - eyeOffset, aiSnake[0].y * BLOCK_SIZE + eyeOffset, eyeSize, eyeSize);
        }
    }
}

// Draw game over screen
function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 30);
}

// Draw pause screen
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
}

// Keyboard event handlers
document.addEventListener('keydown', event => {
    if (gameOver || paused) return;
    
    // Prevent reverse direction (can't go directly opposite)
    switch (event.keyCode) {
        case 37: // Left arrow
        case 65: // A
            if (lastDirection.x !== 1) { // Not going right
                direction = { x: -1, y: 0 };
            }
            break;
        case 38: // Up arrow
        case 87: // W
            if (lastDirection.y !== 1) { // Not going down
                direction = { x: 0, y: -1 };
            }
            break;
        case 39: // Right arrow
        case 68: // D
            if (lastDirection.x !== -1) { // Not going left
                direction = { x: 1, y: 0 };
            }
            break;
        case 40: // Down arrow
        case 83: // S
            if (lastDirection.y !== -1) { // Not going up
                direction = { x: 0, y: 1 };
            }
            break;
        case 80: // P
            pauseGame();
            break;
    }
});
