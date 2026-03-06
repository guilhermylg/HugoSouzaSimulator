const STATE = {
    MENU: "MENU",
    P_AIM: "P_AIM",
    P_POWER: "P_POWER",
    C_DEFEND: "C_DEFEND",
    P_DEFEND: "P_DEFEND",
    C_KICK: "C_KICK",
    OVER: "OVER"
};

let currentState = STATE.MENU;
let score = { COR: 0, SAO: 0 };
let history = { COR: [], SAO: [] };
let maxRounds = 5;
let suddenDeath = false;
let turn = "COR";

// DOM Elements
const menuOverlay = document.getElementById('menu-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const kickUI = document.getElementById('kick-ui');
const scoreboard = document.getElementById('scoreboard');
const popupOverlay = document.getElementById('popup-overlay');
const popupText = document.getElementById('popup-text');

const aimArrow = document.getElementById('aim-arrow');
const powerFill = document.getElementById('power-fill');
const dotsCor = document.getElementById('dots-cor');
const dotsSao = document.getElementById('dots-sao');
const scoreCorEl = document.getElementById('score-cor');
const scoreSaoEl = document.getElementById('score-sao');
const gameOverTitle = document.getElementById('game-over-title');

const instructionPanel = document.getElementById('instruction-panel');
const instructionText = document.getElementById('instruction-text');

const goalkeeper = document.getElementById('goalkeeper');
const stadiumBall = document.getElementById('stadium-ball');
const zones = document.querySelectorAll('.zone');

// Animation Vars
let lastTime = 0;
let aimAngle = 0; // -45 to 45
let aimDir = 1;
let aimSpeed = 90; // degrees per sec
let power = 0; // 0 to 100
let powerDir = 1;
let powerSpeed = 150; // percent per sec

let reqAim, reqPower;
let kickZone = null;
let cpuZone = null;

// Clean up animations
function resetEntities() {
    goalkeeper.className = 'gk-idle transition-transform';
    stadiumBall.className = 'ball-on-pitch z-2 transition-transform';
    zones.forEach(z => z.classList.remove('active'));
}

function showInstruction(msg) {
    instructionText.textContent = msg;
    instructionPanel.classList.remove('hidden');
    setTimeout(() => instructionPanel.classList.remove('opacity-0'), 50);
}

function hideInstruction() {
    instructionPanel.classList.add('opacity-0');
    setTimeout(() => instructionPanel.classList.add('hidden'), 400);
}

// Initialization
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

function startGame() {
    score = { COR: 0, SAO: 0 };
    history = { COR: [], SAO: [] };
    suddenDeath = false;
    turn = "COR";

    updateScoreboardUI();

    menuOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    scoreboard.classList.remove('hidden');

    setupPlayerKick();
}

function updateScoreboardUI() {
    scoreCorEl.textContent = score.COR;
    scoreSaoEl.textContent = score.SAO;
    renderDots(dotsCor, history.COR, 'cor');
    renderDots(dotsSao, history.SAO, 'sao');
}

function renderDots(container, teamHist, teamType) {
    container.innerHTML = "";
    const count = Math.max(maxRounds, teamHist.length);
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (i < teamHist.length) {
            if (teamHist[i]) dot.classList.add('goal');
            else dot.classList.add('miss');
        }
        container.appendChild(dot);
    }
}

function showPopup(msg, duration = 1500, type = 'success') {
    popupText.textContent = msg;
    popupOverlay.classList.remove('miss-popup');
    if (type === 'miss') popupOverlay.classList.add('miss-popup');

    popupOverlay.classList.remove('hidden');
    setTimeout(() => popupOverlay.classList.add('show'), 10);

    setTimeout(() => {
        popupOverlay.classList.remove('show');
        setTimeout(() => {
            popupOverlay.classList.add('hidden');
            popupOverlay.classList.remove('miss-popup');
        }, 300);
    }, duration);
}

// Global click handler
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return;

    if (currentState === STATE.P_AIM) {
        cancelAnimationFrame(reqAim);
        startPowerFill();
    } else if (currentState === STATE.P_POWER) {
        cancelAnimationFrame(reqPower);
        resolvePlayerKickAimAndPower();
    } else if (currentState === STATE.P_DEFEND) {
        const zoneElem = e.target.closest('.zone');
        if (zoneElem) {
            const zId = parseInt(zoneElem.dataset.zone);
            resolvePlayerDefend(zId);
        }
    }
});

// ==========================================
// PLAYER KICKING
// ==========================================
function setupPlayerKick() {
    currentState = STATE.P_AIM;
    resetEntities();

    kickUI.classList.remove('hidden');
    setTimeout(() => kickUI.classList.remove('opacity-0'), 50);
    showInstruction("SUA VEZ: CLIQUE PARA TRAVAR A MIRA");

    aimAngle = 0;
    power = 0;
    powerFill.style.width = '0%';
    drawAim();

    lastTime = performance.now();
    reqAim = requestAnimationFrame(animateAim);
}

function drawAim() {
    aimArrow.style.transform = `rotate(${aimAngle}deg)`;
}

function animateAim(time) {
    if (currentState !== STATE.P_AIM) return;
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    aimAngle += aimDir * aimSpeed * dt;
    if (aimAngle >= 45) { aimAngle = 45; aimDir = -1; }
    else if (aimAngle <= -45) { aimAngle = -45; aimDir = 1; }

    drawAim();
    reqAim = requestAnimationFrame(animateAim);
}

function startPowerFill() {
    currentState = STATE.P_POWER;
    showInstruction("CLIQUE PARA TRAVAR A FORÇA");
    lastTime = performance.now();
    reqPower = requestAnimationFrame(animatePower);
}

function animatePower(time) {
    if (currentState !== STATE.P_POWER) return;
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    power += powerDir * powerSpeed * dt;
    if (power >= 100) { power = 100; powerDir = -1; }
    else if (power <= 0) { power = 0; powerDir = 1; }

    powerFill.style.width = `${power}%`;
    reqPower = requestAnimationFrame(animatePower);
}

function resolvePlayerKickAimAndPower() {
    currentState = STATE.C_DEFEND;
    kickUI.classList.add('opacity-0');
    setTimeout(() => kickUI.classList.add('hidden'), 400);
    hideInstruction();

    if (power >= 90 || Math.abs(aimAngle) >= 42) {
        kickZone = "OUT";
    } else {
        let col = aimAngle < -15 ? 0 : (aimAngle <= 15 ? 1 : 2);
        let row = power < 33 ? 2 : (power < 66 ? 1 : 0);
        kickZone = row * 3 + col + 1;
    }

    cpuZone = Math.floor(Math.random() * 9) + 1;

    // Play Animations
    if (kickZone === "OUT") {
        stadiumBall.classList.add('ball-kick-out');
    } else {
        stadiumBall.classList.add(`ball-kick-${kickZone}`);
    }
    goalkeeper.classList.add(`dive-${cpuZone}`);

    setTimeout(() => {
        if (kickZone === "OUT") {
            showPopup("ISOLOU A BOLA!", 1500, 'miss');
            history.COR.push(false);
        } else if (kickZone === cpuZone) {
            showPopup("O GOLEIRO ESPALMOU!", 1500, 'miss');
            history.COR.push(false);
        } else {
            showPopup("GOL DO TIMÃO!", 1500, 'success');
            history.COR.push(true);
            score.COR++;
        }
        updateScoreboardUI();

        setTimeout(checkMatchLogic, 2000);
    }, 600); // Wait for dive & kick CSS transition
}

// ==========================================
// PLAYER DEFENDING
// ==========================================
function setupPlayerDefend() {
    currentState = STATE.P_DEFEND;
    resetEntities();
    showInstruction("SUA VEZ DE DEFENDER: CLIQUE NO QUADRADO!");
}

function resolvePlayerDefend(playerZone) {
    currentState = STATE.C_KICK;
    hideInstruction();

    let cpuKickZone = "OUT";
    if (Math.random() < 0.75) {
        cpuKickZone = Math.floor(Math.random() * 9) + 1;
    }

    // Play Animations
    document.querySelector(`.zone[data-zone="${playerZone}"]`).classList.add('active');
    goalkeeper.classList.add(`dive-${playerZone}`);

    if (cpuKickZone === "OUT") {
        stadiumBall.classList.add('ball-kick-out');
    } else {
        stadiumBall.classList.add(`ball-kick-${cpuKickZone}`);
    }

    setTimeout(() => {
        if (cpuKickZone === "OUT") {
            showPopup("BATEU PRA FORA!!", 1500, 'success');
            history.SAO.push(false);
        } else if (cpuKickZone === playerZone) {
            showPopup("GIGANTE CÁSSIO DEFENDEU!!", 1500, 'success');
            history.SAO.push(false);
        } else {
            showPopup("GOL DO SÃO PAULO :(", 1500, 'miss');
            history.SAO.push(true);
            score.SAO++;
        }
        updateScoreboardUI();

        setTimeout(checkMatchLogic, 2000);
    }, 600);
}

// ==========================================
// MATCH LOGIC
// ==========================================
function checkMatchLogic() {
    const roundsCor = history.COR.length;
    const roundsSao = history.SAO.length;

    if (!suddenDeath) {
        const remCor = maxRounds - roundsCor;
        const remSao = maxRounds - roundsSao;

        const maxCor = score.COR + remCor;
        const maxSao = score.SAO + remSao;

        if (score.COR > maxSao) return finishMatch("VITÓRIA DO CORINTHIANS!");
        if (score.SAO > maxCor) return finishMatch("SÃO PAULO VENCE");

        if (roundsCor === maxRounds && roundsSao === maxRounds) {
            if (score.COR === score.SAO) {
                suddenDeath = true;
                showPopup("MORTE SÚBITA!", 2000, 'miss'); // Miss style for red/warning
            }
        }
    } else {
        if (roundsCor === roundsSao) {
            if (score.COR > score.SAO) return finishMatch("VITÓRIA NA MORTE SÚBITA!");
            if (score.SAO > score.COR) return finishMatch("SÃO PAULO VENCE :(");
        }
    }

    // Switch turns
    if (turn === "COR") {
        turn = "SAO";
        setupPlayerDefend();
    } else {
        turn = "COR";
        setupPlayerKick();
    }
}

function finishMatch(msg) {
    currentState = STATE.OVER;
    gameOverTitle.innerHTML = msg;
    gameOverOverlay.classList.remove('hidden');
    setTimeout(() => gameOverOverlay.classList.add('active'), 100);
}