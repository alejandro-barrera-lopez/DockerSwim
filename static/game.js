const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const instructionsDisplay = document.getElementById('instructions'); // Puede que no lo uses mucho ahora
const gameOverDisplay = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// --- Nuevos elementos para la pantalla de inicio ---
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('startButton');
const gameContainer = document.querySelector('.game-container');


// --- Recursos del Juego (¡Asegúrate que las rutas son correctas!) ---
const whaleImg = new Image();
whaleImg.src = '/images/whale.png'; // Asume que está en static/images/whale.png

const obstacleImg = new Image();
obstacleImg.src = '/images/obstacle_1.png'; // Asume que está en static/images/obstacle_1.png

// --- Constantes del Juego (Ajusta según tus imágenes y dificultad deseada) ---
const WHALE_X_POSITION = 70;
const WHALE_WIDTH = 120;
const WHALE_HEIGHT = 50;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_MIN_HEIGHT = 50;
const OBSTACLE_MAX_HEIGHT = 100;
const OBSTACLE_GAP = 120;
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const INITIAL_GAME_SPEED = 3;
const SPAWN_INTERVAL_INITIAL = 120;
const SPAWN_INTERVAL_MIN = 60;
const SPEED_INCREASE_RATE = 0.001;
const SPAWN_RATE_DECREASE = 0.05;

// --- Variables de Estado del Juego ---
let whaleY, whaleVelY;
let obstacles = [];
let score;
let frameCount;
let currentSpawnInterval;
let gameSpeed;
let isGameOver;
let animationFrameId;
let gameHasStartedOnce = false; // Para controlar el estado general del juego

// --- Funciones del Juego ---

function prepareGame() {
    // Esta función prepara las variables iniciales sin iniciar el bucle.
    // Es útil si necesitas hacer algo antes de que el usuario presione "Iniciar".
    whaleY = canvas.height / 2 - WHALE_HEIGHT / 2;
    whaleVelY = 0;
    obstacles = [];
    score = 0;
    frameCount = 0;
    currentSpawnInterval = SPAWN_INTERVAL_INITIAL;
    gameSpeed = INITIAL_GAME_SPEED;
    isGameOver = false;

    scoreDisplay.textContent = `Puntuación: 0`;
    gameOverDisplay.classList.add('hidden');
    // instructionsDisplay.style.display = 'block'; // Las instrucciones están en la pantalla de inicio

    // Limpiar el canvas una vez al preparar, por si acaso.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0077b6'; // Fondo azul
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (whaleImg.complete) { // Dibujar la ballena en su posición inicial si la imagen está cargada
         ctx.drawImage(whaleImg, WHALE_X_POSITION, whaleY, WHALE_WIDTH, WHALE_HEIGHT);
    }
}

function startGame() {
    gameHasStartedOnce = true;
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    instructionsDisplay.style.display = 'none'; // Ocultar por si acaso
    resetGameAndLoop();
}

function resetGameAndLoop() {
    whaleY = canvas.height / 2 - WHALE_HEIGHT / 2;
    whaleVelY = 0;
    obstacles = [];
    score = 0;
    frameCount = 0;
    currentSpawnInterval = SPAWN_INTERVAL_INITIAL;
    gameSpeed = INITIAL_GAME_SPEED;
    isGameOver = false;

    scoreDisplay.textContent = `Puntuación: 0`;
    gameOverDisplay.classList.add('hidden');
    // instructionsDisplay.style.display = 'block'; // Ya no es necesario aquí

    // Cancelar bucle anterior si existe
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // Empezar nuevo bucle
    gameLoop();
}

function whaleSwimUp() {
    if (!isGameOver && gameHasStartedOnce) { // Solo permitir nadar si el juego ha comenzado
        whaleVelY = JUMP_STRENGTH;
        // if (instructionsDisplay.style.display !== 'none') {
        // instructionsDisplay.style.display = 'none';
        // }
    }
}

function spawnObstacle() {
    const availableHeight = canvas.height - OBSTACLE_GAP;
    const topHeight = Math.random() * (Math.min(OBSTACLE_MAX_HEIGHT, availableHeight) - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
    const bottomHeight = canvas.height - topHeight - OBSTACLE_GAP;

    obstacles.push({
        x: canvas.width,
        y: 0,
        width: OBSTACLE_WIDTH,
        height: topHeight,
        isTop: true
    });
    obstacles.push({
        x: canvas.width,
        y: canvas.height - bottomHeight,
        width: OBSTACLE_WIDTH,
        height: bottomHeight,
        isTop: false
    });
}

function checkCollision(whaleRect, obstacle) {
    return (
        whaleRect.x < obstacle.x + obstacle.width &&
        whaleRect.x + whaleRect.width > obstacle.x &&
        whaleRect.y < obstacle.y + obstacle.height &&
        whaleRect.y + whaleRect.height > obstacle.y
    );
}

function showGameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    finalScoreDisplay.textContent = score;
    gameOverDisplay.classList.remove('hidden');
    // instructionsDisplay.style.display = 'none'; // Ya gestionado
}

function gameLoop() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    whaleVelY += GRAVITY;
    whaleY += whaleVelY;

    if (whaleY < 0) {
        whaleY = 0;
        whaleVelY = 0;
    }
    if (whaleY + WHALE_HEIGHT > canvas.height) {
        showGameOver();
        return;
    }
    ctx.drawImage(whaleImg, WHALE_X_POSITION, whaleY, WHALE_WIDTH, WHALE_HEIGHT);
    const whaleRect = { x: WHALE_X_POSITION, y: whaleY, width: WHALE_WIDTH, height: WHALE_HEIGHT };

    frameCount++;
    if (frameCount >= currentSpawnInterval) {
        spawnObstacle();
        frameCount = 0;
        currentSpawnInterval = Math.max(SPAWN_INTERVAL_MIN, currentSpawnInterval - SPAWN_RATE_DECREASE);
    }

    let passedObstacle = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);

        if (checkCollision(whaleRect, obs)) {
            showGameOver();
            return;
        }

        if (!obs.passed && obs.x + obs.width < WHALE_X_POSITION) {
            if (!obs.isTop) {
                passedObstacle = true;
            }
            obs.passed = true;
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

    if (passedObstacle) {
        score++;
        scoreDisplay.textContent = `Puntuación: ${score}`;
    }

    gameSpeed += SPEED_INCREASE_RATE;
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
function handleInput(event) {
    event.preventDefault();
    if (isGameOver || !gameHasStartedOnce) return; // No hacer nada si el juego terminó o no ha comenzado
    whaleSwimUp();
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (!gameHasStartedOnce) { // Si el juego no ha empezado y se pulsa espacio
            startGame();
        } else {
            handleInput(e);
        }
    }
});

canvas.addEventListener('touchstart', (e) => {
    if (!gameHasStartedOnce) {
        startGame();
    } else {
        handleInput(e);
    }
});
canvas.addEventListener('mousedown', (e) => { // También para clics de ratón
    if (!gameHasStartedOnce) {
        startGame();
    } else {
        handleInput(e);
    }
});

restartButton.addEventListener('click', resetGameAndLoop);
startButton.addEventListener('click', startGame); // Listener para el nuevo botón de inicio

// --- Inicio del Juego ---
whaleImg.onload = () => {
    console.log("Whale image loaded. Game ready to start.");
    if (obstacleImg.complete) { // Asegurarse que ambas imágenes estén cargadas
        prepareGame(); // Prepara el juego pero no lo inicia
    } else {
        obstacleImg.onload = () => {
            console.log("Obstacle image loaded. Game ready to start.");
            prepareGame();
        }
        obstacleImg.onerror = () => {
            console.error("Failed to load obstacle image! Check path: " + obstacleImg.src);
            startScreen.innerHTML = "<p>Error al cargar imágenes. No se puede iniciar.</p>";
        }
    }
};
whaleImg.onerror = () => {
    console.error("Failed to load whale image! Check path: " + whaleImg.src);
    startScreen.innerHTML = "<p>Error al cargar imágenes. No se puede iniciar.</p>";
};

// Si las imágenes ya están en caché, onload podría no dispararse en algunos navegadores.
// Añadimos una comprobación por si acaso, aunque el `prepareGame` ahora también dibuja la ballena
// si `whaleImg.complete` es true.
if (whaleImg.complete && obstacleImg.complete) {
    // Este bloque podría ser redundante si `onload` siempre se dispara
    // de manera fiable incluso para imágenes cacheadas.
    // Por precaución, se puede dejar, o simplificar si se prueba que no es necesario.
    // console.log("Images already cached. Preparing game.");
    // prepareGame();
}