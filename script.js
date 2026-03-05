const state = {
    scoreHome: 0,
    scoreAway: 0,
    round: 1,
    isPlayerDefending: true, // Start defending
    homeHistory: [], // ['goal', 'saved', 'miss']
    awayHistory: [],
    gameEnded: false,
    waitingForInput: false
};

const zones = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];

// DOM Elements
const elements = {
    startBtn: document.getElementById('start-btn'),
    overlay: document.getElementById('overlay'),
    goalkeeper: document.getElementById('goalkeeper'),
    ball: document.getElementById('ball'),
    status: document.getElementById('game-status'),
    scoreHome: document.getElementById('score-home'),
    scoreAway: document.getElementById('score-away'),
    dotsHome: document.getElementById('shots-counter-home'),
    dotsAway: document.getElementById('shots-counter-away'),
    popup: document.getElementById('alert-popup'),
    popupText: document.getElementById('alert-text'),
    zoneBtns: document.querySelectorAll('.goal-zone')
};

// Initialization
elements.startBtn.addEventListener('click', () => {
    elements.overlay.classList.add('hidden');
    resetGame();
    startRound();
});

function resetGame() {
    state.scoreHome = 0;
    state.scoreAway = 0;
    state.round = 1;
    state.isPlayerDefending = true;
    state.homeHistory = [];
    state.awayHistory = [];
    state.gameEnded = false;

    updateScoreUI();
    renderDots();
}

function updateScoreUI() {
    elements.scoreHome.textContent = state.scoreHome;
    elements.scoreAway.textContent = state.scoreAway;
}

function renderDots() {
    elements.dotsHome.innerHTML = '';
    elements.dotsAway.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const dH = document.createElement('div');
        dH.className = `dot ${state.homeHistory[i] === 'goal' ? 'green' : (state.homeHistory[i] ? 'red' : '')}`;
        elements.dotsHome.appendChild(dH);

        const dA = document.createElement('div');
        dA.className = `dot ${state.awayHistory[i] === 'goal' ? 'green' : (state.awayHistory[i] ? 'red' : '')}`;
        elements.dotsAway.appendChild(dA);
    }
}

function startRound() {
    if (state.gameEnded) return;

    // Reset positions
    elements.goalkeeper.className = '';
    elements.ball.className = '';
    elements.ball.style.bottom = "-50px";

    if (state.isPlayerDefending) {
        elements.status.textContent = "DEFENDA! ESCOLHA UM CANTO";
        state.waitingForInput = true;
    } else {
        elements.status.textContent = "SEU TIME VAI BATER...";
        setTimeout(simulatePlayerTeamKick, 1500);
    }
}

// Player Inputs (ZONES)
elements.zoneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!state.waitingForInput || !state.isPlayerDefending) return;

        const playerZone = btn.dataset.zone;
        handleDefenseShot(playerZone);
    });
});

function handleDefenseShot(playerZone) {
    state.waitingForInput = false;

    // CPU decides kick direction
    const cpuZone = zones[Math.floor(Math.random() * zones.length)];

    // Animate Goalkeeper
    animateGoalkeeper(playerZone);

    // Animate Ball
    setTimeout(() => {
        animateBall(cpuZone);
    }, 100);

    // Calculate Result
    setTimeout(() => {
        const isSaved = playerZone === cpuZone;
        if (isSaved) {
            showPopup("DEFESA!", "success");
            state.awayHistory.push('saved');
        } else {
            showPopup("GOL!", "fail");
            state.scoreAway++;
            state.awayHistory.push('goal');
        }

        updateScoreUI();
        renderDots();

        setTimeout(() => {
            state.isPlayerDefending = false;
            nextStep();
        }, 1500);
    }, 800);
}

function simulatePlayerTeamKick() {
    // 75% Goal chance
    const isGoal = Math.random() < 0.75;
    const kickZone = zones[Math.floor(Math.random() * zones.length)];
    const gkZone = isGoal ? zones.filter(z => z !== kickZone)[Math.floor(Math.random() * 4)] : kickZone;

    animateGoalkeeper(gkZone);
    setTimeout(() => animateBall(kickZone), 100);

    setTimeout(() => {
        if (isGoal) {
            showPopup("GOL DO TIMÃO!", "success");
            state.scoreHome++;
            state.homeHistory.push('goal');
        } else {
            showPopup("DEFENDEU!", "fail");
            state.homeHistory.push('saved');
        }

        updateScoreUI();
        renderDots();

        setTimeout(() => {
            state.round++;
            state.isPlayerDefending = true;
            nextStep();
        }, 1500);
    }, 800);
}

function nextStep() {
    if (checkMatchEnd()) {
        endGame();
    } else {
        startRound();
    }
}

function checkMatchEnd() {
    const h = state.scoreHome;
    const a = state.scoreAway;
    const roundsLeftHome = 5 - state.homeHistory.length;
    const roundsLeftAway = 5 - state.awayHistory.length;

    // Standard 5 kicks
    if (state.homeHistory.length >= 5 && state.awayHistory.length >= 5) {
        if (h !== a) return true; // Winner found after 5
        // Sudden death logic would go here, for now let's just loop round 6, 7...
    } else {
        // Mathematical impossibility to catch up
        if (h > a + roundsLeftAway) return true;
        if (a > h + roundsLeftHome) return true;
    }

    return false;
}

function endGame() {
    state.gameEnded = true;
    const winner = state.scoreHome > state.scoreAway ? "CAMPEÃO!" : "DERROTA";
    elements.overlay.classList.remove('hidden');
    document.querySelector('.main-title').innerHTML = `${winner}<span>${state.scoreHome} - ${state.scoreAway}</span>`;
    document.querySelector('.subtitle').textContent = "Pressione para revanche";
    elements.startBtn.textContent = "REINICIAR";
}

// View Utilities
function animateGoalkeeper(zone) {
    elements.goalkeeper.className = ''; // reset
    if (zone === 'top-left') elements.goalkeeper.classList.add('dive-tl');
    if (zone === 'top-right') elements.goalkeeper.classList.add('dive-tr');
    if (zone === 'bottom-left') elements.goalkeeper.classList.add('dive-bl');
    if (zone === 'bottom-right') elements.goalkeeper.classList.add('dive-br');
    if (zone === 'center') elements.goalkeeper.classList.add('stay-c');
}

function animateBall(zone) {
    elements.ball.className = '';
    if (zone === 'top-left') elements.ball.classList.add('ball-tl');
    if (zone === 'top-right') elements.ball.classList.add('ball-tr');
    if (zone === 'bottom-left') elements.ball.classList.add('ball-bl');
    if (zone === 'bottom-right') elements.ball.classList.add('ball-br');
    if (zone === 'center') elements.ball.classList.add('ball-c');
}

function showPopup(text, type) {
    elements.popupText.textContent = text;
    elements.popup.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    elements.popup.classList.add('show');
    setTimeout(() => {
        elements.popup.classList.remove('show');
    }, 1200);
}
