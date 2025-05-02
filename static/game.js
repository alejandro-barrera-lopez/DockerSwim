const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const instructionsDisplay = document.getElementById('instructions');
const gameOverDisplay = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// --- Recursos del Juego (¡Asegúrate que las rutas son correctas!) ---
const whaleImg = new Image();
whaleImg.src = '/images/whale.png'; // Asume que está en static/images/whale.png

const obstacleImg = new Image();
obstacleImg.src = '/images/obstacle_1.png'; // Asume que está en static/images/obstacle_1.png

// --- Constantes del Juego (Ajusta según tus imágenes y dificultad deseada) ---
const WHALE_X_POSITION = 70;
const WHALE_WIDTH = 120; // Ancho de tu whale.png
const WHALE_HEIGHT = 50; // Alto de tu whale.png
const OBSTACLE_WIDTH = 50; // Ancho de tu obstacle_1.png
const OBSTACLE_MIN_HEIGHT = 50;
const OBSTACLE_MAX_HEIGHT = 150;
const OBSTACLE_GAP = 120; // Espacio vertical para que pase la ballena
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7; // Impulso hacia arriba (negativo)
const INITIAL_GAME_SPEED = 3;
const SPAWN_INTERVAL_INITIAL = 120; // Frames entre obstáculos al inicio
const SPAWN_INTERVAL_MIN = 60; // Mínimo de frames entre obstáculos
const SPEED_INCREASE_RATE = 0.001; // Cuánto aumenta la velocidad cada frame
const SPAWN_RATE_DECREASE = 0.05; // Cuánto disminuye el intervalo de spawn cada frame

// --- Variables de Estado del Juego ---
let whaleY, whaleVelY;
let obstacles = [];
let score;
let frameCount;
let currentSpawnInterval;
let gameSpeed;
let isGameOver;
let animationFrameId; // Para poder cancelar el bucle

// --- Funciones del Juego ---

function resetGame() {
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
    instructionsDisplay.style.display = 'block'; // Mostrar instrucciones al inicio

    // Cancelar bucle anterior si existe
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // Empezar nuevo bucle
    gameLoop();
}

function whaleSwimUp() {
    if (!isGameOver) {
        whaleVelY = JUMP_STRENGTH;
        if (instructionsDisplay.style.display !== 'none') {
             instructionsDisplay.style.display = 'none'; // Ocultar al primer salto
        }
    }
}

function spawnObstacle() {
    const availableHeight = canvas.height - OBSTACLE_GAP;
    const topHeight = Math.random() * (Math.min(OBSTACLE_MAX_HEIGHT, availableHeight) - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
    const bottomHeight = canvas.height - topHeight - OBSTACLE_GAP;

    // Añadir obstáculo superior
    obstacles.push({
        x: canvas.width,
        y: 0, // Desde arriba
        width: OBSTACLE_WIDTH,
        height: topHeight,
        isTop: true
    });
    // Añadir obstáculo inferior
    obstacles.push({
        x: canvas.width,
        y: canvas.height - bottomHeight, // Desde abajo
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
    cancelAnimationFrame(animationFrameId); // Detener bucle
    finalScoreDisplay.textContent = score;
    gameOverDisplay.classList.remove('hidden');
    instructionsDisplay.style.display = 'none';
}

function gameLoop() {
    if (isGameOver) return;

    // 1. Limpiar Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Opcional: Dibujar fondo azul
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Actualizar y Dibujar Ballena
    whaleVelY += GRAVITY;
    whaleY += whaleVelY;

    // Colisión con límites superior/inferior
    if (whaleY < 0) {
        whaleY = 0;
        whaleVelY = 0;
    }
    if (whaleY + WHALE_HEIGHT > canvas.height) {
        showGameOver();
        return;
    }
    // Dibujar la ballena
    ctx.drawImage(whaleImg, WHALE_X_POSITION, whaleY, WHALE_WIDTH, WHALE_HEIGHT);
    const whaleRect = { x: WHALE_X_POSITION, y: whaleY, width: WHALE_WIDTH, height: WHALE_HEIGHT };

    // 3. Spawneo de Obstáculos
    frameCount++;
    if (frameCount >= currentSpawnInterval) {
        spawnObstacle();
        frameCount = 0;
        // Reducir intervalo de spawn gradualmente (aumenta dificultad)
        currentSpawnInterval = Math.max(SPAWN_INTERVAL_MIN, currentSpawnInterval - SPAWN_RATE_DECREASE);
    }

    // 4. Actualizar y Dibujar Obstáculos
    let passedObstacle = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;

        // Dibujar obstáculo
        ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);

        // Comprobar colisión
        if (checkCollision(whaleRect, obs)) {
            showGameOver();
            return;
        }

        // Comprobar si se pasó el obstáculo (y aún no se contó este par)
        if (!obs.passed && obs.x + obs.width < WHALE_X_POSITION) {
             if (!obs.isTop) { // Contar solo al pasar el obstáculo inferior del par
                  passedObstacle = true;
             }
             obs.passed = true; // Marcar como pasado para no contar doble
        }


        // Eliminar obstáculos fuera de pantalla
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

     // 5. Actualizar Puntuación si se pasó un par
     if (passedObstacle) {
          score++;
          scoreDisplay.textContent = `Puntuación: ${score}`;
     }

    // 6. Incrementar velocidad
    gameSpeed += SPEED_INCREASE_RATE;


    // 7. Solicitar siguiente frame
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
function handleInput(event) {
     // Prevenir comportamiento por defecto (scroll, zoom)
    event.preventDefault();
    if (isGameOver) return; // No hacer nada si el juego terminó
    whaleSwimUp();
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        handleInput(e);
    }
});

// Para pantallas táctiles y clics
canvas.addEventListener('touchstart', handleInput);
canvas.addEventListener('mousedown', handleInput); // También para clics de ratón

restartButton.addEventListener('click', resetGame);

// --- Inicio del Juego ---
// Es mejor esperar a que la imagen principal (ballena) cargue
whaleImg.onload = () => {
    console.log("Whale image loaded. Starting game.");
    resetGame();
};
// Manejo de error si la imagen no carga
whaleImg.onerror = () => {
    console.error("Failed to load whale image! Check path: " + whaleImg.src);
    // ¿Iniciar juego sin imagen? Podrías dibujar un rectángulo como fallback
    // alert("Error: No se pudo cargar la imagen de la ballena.");
    // O simplemente no iniciar:
    instructionsDisplay.textContent = "Error al cargar imágenes. No se puede iniciar.";
};

// Opcional: Podrías añadir un handler onload/onerror similar para obstacleImg si quieres asegurarte.