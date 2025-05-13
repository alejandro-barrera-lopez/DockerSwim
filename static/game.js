const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const instructionsDisplay = document.getElementById('instructions');
const gameOverDisplay = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('startButton');
const gameContainer = document.querySelector('.game-container');

// --- Recursos del Juego ---
const whaleImg = new Image();
whaleImg.src = '/images/whale.png';

const obstacleImg = new Image();
obstacleImg.src = '/images/obstacle_1.png'; // Usaremos esta para todos los tipos por ahora

// --- Constantes del Juego ---
const WHALE_X_POSITION = 70;
const WHALE_WIDTH = 120;
const WHALE_HEIGHT = 50;

// Obstáculos
const OBSTACLE_WIDTH = 60; // Un poco más ancho para más presencia
const OBSTACLE_MIN_HEIGHT = 40;
const OBSTACLE_MAX_HEIGHT = 110; // Permitir obstáculos más altos
const OBSTACLE_GAP_PAIR = 130; // Espacio para la ballena en el par clásico
const OBSTACLE_COLOR = '#2c6e49'; // Un color para los obstáculos si no se usa imagen

// Dinámica del Juego
const GRAVITY = 0.35; // Ajuste ligero
const JUMP_STRENGTH = -4.5; // Ajuste ligero
const INITIAL_GAME_SPEED = 2.5; // Ligeramente más lento al inicio
const MAX_GAME_SPEED = 7; // Velocidad máxima
const SPAWN_INTERVAL_INITIAL = 130; // Frames entre obstáculos
const SPAWN_INTERVAL_MIN = 70;
const SPEED_INCREASE_RATE = 0.0005; // Más gradual
const SPAWN_RATE_DECREASE = 0.03; // Más gradual

// --- Variables de Estado del Juego ---
let whaleY, whaleVelY;
let obstacles = [];
let score;
let frameCount; // Para spawneo de obstáculos
let currentSpawnInterval;
let gameSpeed;
let isGameOver;
let animationFrameId;
let gameHasStartedOnce = false;

// --- Burbujas Decorativas ---
let bubbles = [];
const MAX_BUBBLES = 25;
const BUBBLE_SPAWN_RATE = 0.2; // Probabilidad de spawn por frame (0 a 1)

function initializeBubble(bubble) {
    bubble.x = Math.random() * canvas.width;
    bubble.y = canvas.height + Math.random() * 50; // Empieza desde abajo
    bubble.radius = Math.random() * 3 + 1; // Radios pequeños
    bubble.speedY = Math.random() * 1 + 0.5; // Velocidad de subida
    bubble.opacity = Math.random() * 0.3 + 0.1; // Sutiles
    bubble.opacityChange = (Math.random() - 0.5) * 0.001; // Ligero parpadeo o cambio
}

function spawnBubbles() {
    if (bubbles.length < MAX_BUBBLES && Math.random() < BUBBLE_SPAWN_RATE) {
        const bubble = {};
        initializeBubble(bubble);
        bubbles.push(bubble);
    }
}

function updateAndDrawBubbles() {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.speedY;
        b.x += (Math.random() - 0.5) * 0.5; // Ligero vaivén horizontal

        // Sutil cambio de opacidad
        b.opacity += b.opacityChange;
        if (b.opacity > 0.4 || b.opacity < 0.05) {
            b.opacityChange *= -1; // Invertir cambio si llega a límites
            b.opacity = Math.max(0.05, Math.min(0.4, b.opacity)); // Clampear
        }


        if (b.y + b.radius < 0) { // Si la burbuja sale por arriba
            // Reinicializar en lugar de eliminar y crear, para eficiencia
            initializeBubble(b);
        }

        // Dibujar burbuja
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 225, 255, ${b.opacity})`; // Blanco azulado semi-transparente
        ctx.fill();
    }
}


// --- Funciones del Juego ---

function prepareGame() {
    whaleY = canvas.height / 2 - WHALE_HEIGHT / 2;
    whaleVelY = 0;
    obstacles = [];
    bubbles = []; // Reiniciar burbujas
    for(let i=0; i < MAX_BUBBLES / 2; i++) { // Pre-popular algunas burbujas
        const bubble = {};
        initializeBubble(bubble);
        bubble.y = Math.random() * canvas.height; // Esparcirlas por la pantalla
        bubbles.push(bubble);
    }

    score = 0;
    frameCount = 0;
    currentSpawnInterval = SPAWN_INTERVAL_INITIAL;
    gameSpeed = INITIAL_GAME_SPEED;
    isGameOver = false;

    scoreDisplay.textContent = `Puntuación: 0`;
    gameOverDisplay.classList.add('hidden');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateAndDrawBubbles(); // Dibujar burbujas iniciales
    if (whaleImg.complete) {
        ctx.drawImage(whaleImg, WHALE_X_POSITION, whaleY, WHALE_WIDTH, WHALE_HEIGHT);
    }
}

function startGame() {
    gameHasStartedOnce = true;
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    instructionsDisplay.style.display = 'none';
    resetGameAndLoop();
}

function resetGameAndLoop() {
    whaleY = canvas.height / 2 - WHALE_HEIGHT / 2;
    whaleVelY = 0;
    obstacles = [];
    // No reiniciamos las burbujas aquí para que sigan fluyendo
    score = 0;
    frameCount = 0;
    currentSpawnInterval = SPAWN_INTERVAL_INITIAL;
    gameSpeed = INITIAL_GAME_SPEED;
    isGameOver = false;

    scoreDisplay.textContent = `Puntuación: 0`;
    gameOverDisplay.classList.add('hidden');

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
}

function whaleSwimUp() {
    if (!isGameOver && gameHasStartedOnce) {
        whaleVelY = JUMP_STRENGTH;
    }
}

function spawnObstacle() {
    const patternType = Math.random();
    let obstacleHeight, yPos;
    let isScoringEvent = true; // Por defecto, cada spawn event da puntos

    if (patternType < 0.55) { // 55% chance: Par clásico (arriba y abajo)
        const availableHeight = canvas.height - OBSTACLE_GAP_PAIR;
        const topHeight = Math.random() * (Math.min(OBSTACLE_MAX_HEIGHT, availableHeight) - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
        const bottomHeight = canvas.height - topHeight - OBSTACLE_GAP_PAIR;

        obstacles.push({
            x: canvas.width, y: 0, width: OBSTACLE_WIDTH, height: topHeight,
            image: obstacleImg, type: 'top', scored: false, isPartOfPair: true
        });
        obstacles.push({ // El obstáculo inferior del par será el que cuente para la puntuación del "evento"
            x: canvas.width, y: canvas.height - bottomHeight, width: OBSTACLE_WIDTH, height: bottomHeight,
            image: obstacleImg, type: 'bottom', scored: false, isScoringObstacle: true, isPartOfPair: true
        });

    } else if (patternType < 0.75) { // 20% chance: Solo obstáculo superior
        obstacleHeight = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
        obstacles.push({
            x: canvas.width, y: 0, width: OBSTACLE_WIDTH, height: obstacleHeight,
            image: obstacleImg, type: 'top_single', scored: false, isScoringObstacle: true
        });

    } else if (patternType < 0.95) { // 20% chance: Solo obstáculo inferior
        obstacleHeight = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
        obstacles.push({
            x: canvas.width, y: canvas.height - obstacleHeight, width: OBSTACLE_WIDTH, height: obstacleHeight,
            image: obstacleImg, type: 'bottom_single', scored: false, isScoringObstacle: true
        });
    } else { // 5% chance: Obstáculo medio (más pequeño, requiere más precisión)
        obstacleHeight = Math.random() * (canvas.height * 0.3 - canvas.height * 0.15) + canvas.height * 0.15; // Altura entre 15% y 30% del canvas
        yPos = Math.random() * (canvas.height - obstacleHeight - WHALE_HEIGHT*2) + WHALE_HEIGHT; // Evitar que esté demasiado cerca de los bordes
        obstacles.push({
            x: canvas.width, y: yPos, width: OBSTACLE_WIDTH, height: obstacleHeight,
            image: obstacleImg, type: 'middle_single', scored: false, isScoringObstacle: true
        });
    }
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
}

function gameLoop() {
    if (isGameOver) return;

    // 1. Limpiar Canvas y dibujar fondo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0077b6'; // Azul marino
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1.1 Dibujar Burbujas
    spawnBubbles();
    updateAndDrawBubbles();

    // 2. Actualizar y Dibujar Ballena
    whaleVelY += GRAVITY;
    whaleY += whaleVelY;

    // Colisión con límites superior/inferior del canvas
    if (whaleY < 0) { // Tocar el techo
        whaleY = 0;
        whaleVelY = 0; // Simplemente se detiene, no es game over
    }
    if (whaleY + WHALE_HEIGHT > canvas.height) { // Tocar el suelo
        showGameOver();
        return;
    }
    // Dibujar la ballena
    if (whaleImg.complete) { // Asegurarse que la imagen esté cargada
        ctx.drawImage(whaleImg, WHALE_X_POSITION, whaleY, WHALE_WIDTH, WHALE_HEIGHT);
    } else { // Fallback si la imagen no carga (poco probable si se pre-cargó)
        ctx.fillStyle = 'gold';
        ctx.fillRect(WHALE_X_POSITION, whaleY, WHALE_WIDTH, WHALE_HEIGHT);
    }
    const whaleRect = { x: WHALE_X_POSITION, y: whaleY, width: WHALE_WIDTH, height: WHALE_HEIGHT };

    // 3. Spawneo de Obstáculos
    frameCount++;
    if (frameCount >= currentSpawnInterval) {
        spawnObstacle();
        frameCount = 0;
        currentSpawnInterval = Math.max(SPAWN_INTERVAL_MIN, currentSpawnInterval - SPAWN_RATE_DECREASE);
    }

    // 4. Actualizar y Dibujar Obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;

        // Dibujar obstáculo (con imagen o fallback de color)
        if (obs.image && obs.image.complete) {
            ctx.drawImage(obs.image, obs.x, obs.y, obs.width, obs.height);
        } else {
            ctx.fillStyle = OBSTACLE_COLOR;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }

        // Comprobar colisión
        if (checkCollision(whaleRect, obs)) {
            showGameOver();
            return;
        }

        // Comprobar si se pasó el obstáculo para puntuar
        if (obs.isScoringObstacle && !obs.scored && obs.x + obs.width < WHALE_X_POSITION) {
            score++;
            obs.scored = true; // Marcar este evento de obstáculo como puntuado
            scoreDisplay.textContent = `Puntuación: ${score}`;
        }

        // Eliminar obstáculos fuera de pantalla
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // 5. Incrementar velocidad (hasta un máximo)
    if (gameSpeed < MAX_GAME_SPEED) {
        gameSpeed += SPEED_INCREASE_RATE;
    }

    // 6. Solicitar siguiente frame
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
function handleInput(event) {
    event.preventDefault();
    if (isGameOver || !gameHasStartedOnce) return;
    whaleSwimUp();
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (!gameHasStartedOnce) {
            startGame();
        } else if (!isGameOver) { // Solo permitir input si el juego está activo
            handleInput(e);
        } else if (isGameOver && gameOverDisplay.classList.contains('hidden') === false) {
            // Si es game over y el mensaje es visible, espacio reinicia
            resetGameAndLoop();
        }
    }
});

canvas.addEventListener('touchstart', (e) => {
    if (!gameHasStartedOnce) {
        startGame();
    } else if (!isGameOver) {
        handleInput(e);
    } else if (isGameOver && gameOverDisplay.classList.contains('hidden') === false) {
        resetGameAndLoop();
    }
});
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Solo clic izquierdo
    if (!gameHasStartedOnce) {
        startGame();
    } else if (!isGameOver) {
        handleInput(e);
    } else if (isGameOver && gameOverDisplay.classList.contains('hidden') === false) {
        resetGameAndLoop();
    }
});

restartButton.addEventListener('click', resetGameAndLoop);
startButton.addEventListener('click', startGame);

// --- Inicio del Juego y Carga de Recursos ---
let imagesToLoad = 2; // whaleImg, obstacleImg
function onImageLoad() {
    imagesToLoad--;
    if (imagesToLoad === 0) {
        console.log("All images loaded. Game ready to start.");
        prepareGame();
    }
}

function onImageError(e) {
    console.error("Failed to load image: " + e.target.src);
    startScreen.innerHTML = `<div class="message-box"><h1>Error</h1><p>Error al cargar imágenes. No se puede iniciar el juego.</p></div>`;
}

whaleImg.onload = onImageLoad;
whaleImg.onerror = onImageError;
obstacleImg.onload = onImageLoad;
obstacleImg.onerror = onImageError;

// Comprobación por si las imágenes ya están en caché (dispararía onload síncronamente o no)
// Esto es más una precaución; los navegadores modernos suelen manejar bien el onload para caché.
if (whaleImg.complete) {
    // Si está completa pero onload no se ha disparado (o se disparó antes de asignar el handler)
    // y no hemos contado su carga, lo hacemos.
    // Esta lógica puede ser compleja. Simplificamos confiando en que onload se llama.
    // Si `imagesToLoad` llega a 0 aquí debido a imágenes cacheadas que se marcan como completas
    // antes de que se asignen los handlers onload, prepareGame() podría llamarse prematuramente.
    // La forma más segura es que onImageLoad maneje todo.
    // Por ello, la lógica simple de imagesToLoad-- dentro de onImageLoad es más robusta.
}
// Similar para obstacleImg.