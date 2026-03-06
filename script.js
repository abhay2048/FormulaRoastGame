let allQ = [], filteredQ = [], roasts = [], failLogs = {};
let sessionQueue = [], currentQ = null;
let score = 0, lives = 3, xp = parseInt(localStorage.getItem('ax_xp')) || 0;
let best = parseInt(localStorage.getItem('ax_best')) || 0;
let callsign = localStorage.getItem('ax_id') || "";
let history = JSON.parse(localStorage.getItem('ax_hist')) || { total: 0, correct: 0 };
let timerId = null, timeLimit = 30;

// Optimized Symbol Generator with Parallax
function genSymbols() {
    const symbols = ["∫", "∑", "π", "∂", "∞", "θ", "Δ", "√", "Ω", "μ", "φ", "λ"];
    const container = document.getElementById('symbol-layer');
    if(!container) return;
    container.innerHTML = "";
    
    for(let i=0; i<25; i++) {
        const span = document.createElement('span');
        span.className = 'float-symbol';
        span.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Randomize depth for 3D effect
        const size = Math.random() * (2.2 - 0.8) + 0.8;
        span.style.fontSize = `${size}rem`;
        span.style.opacity = (size / 2.5) * 0.3; // Smaller symbols are "further" and dimmer
        span.style.left = Math.random() * 95 + "%";
        span.style.top = Math.random() * 95 + "%";
        
        // Randomize floating animation speeds
        const dur = Math.random() * (20 - 10) + 10;
        span.style.animation = `drift ${dur}s linear infinite alternate`;
        span.style.animationDelay = `${Math.random() * -20}s`;
        
        container.appendChild(span);
    }
}

// Touch/Mouse Parallax
document.addEventListener('mousemove', (e) => {
    const symbols = document.querySelectorAll('.float-symbol');
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    
    symbols.forEach((s, i) => {
        const depth = (i % 5) + 1; 
        const moveX = x * 30 * depth;
        const moveY = y * 30 * depth;
        s.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
});

async function init() {
    genSymbols();
    try {
        const [fRes, rRes] = await Promise.all([
            fetch('mathformula.txt').then(r => r.text()),
            fetch('roast.txt').then(r => r.text())
        ]);
        allQ = fRes.split('\n').filter(l => l.includes('::')).map(l => {
            const p = l.split('::').map(s => s.trim());
            return { chap: p[0], q: p[1], a: p[2], opts: [p[2], p[3], p[4], p[5]] };
        });
        roasts = rRes.split('\n').filter(l => l.trim() !== "");
        
        const chapters = [...new Set(allQ.map(q => q.chap))];
        document.getElementById('chapter-list').innerHTML = chapters.map(c => `
            <button class="menu-action-card" onclick="selectChapter('${c}')">
                <span class="serif-title">${c.toUpperCase()}</span>
                <small>Archive Manuscripts</small>
            </button>
        `).join('');
    } catch (e) { console.error("Archive load failed."); }
    
    if (!callsign) showScreen('screen-login');
    else { document.getElementById('main-dock').classList.remove('hidden'); showScreen('screen-home'); }
}

function safeTypeset() {
    if (window.mjReady && window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(e => {});
    }
}

window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    
    if (id === 'screen-home') { 
        updateDash(); 
        document.querySelectorAll('.nav-item')[0].classList.add('active'); 
    }
    if (id === 'screen-vault') { 
        populateVault(); 
        document.querySelectorAll('.nav-item')[1].classList.add('active'); 
    }
    if (id === 'screen-logs') { 
        populateLogs(); 
        document.querySelectorAll('.nav-item')[2].classList.add('active'); 
    }
    safeTypeset();
};

window.submitLogin = () => {
    const val = document.getElementById('callsign-input').value.trim();
    if (val) {
        callsign = val.toUpperCase();
        localStorage.setItem('ax_id', callsign);
        document.getElementById('main-dock').classList.remove('hidden');
        window.showScreen('screen-home');
    }
};

function updateDash() {
    document.getElementById('display-name').innerText = callsign;
    document.getElementById('best-val').innerText = best;
    
    const progress = (xp % 1000) / 10;
    document.getElementById('level-val').innerText = Math.floor(xp / 1000) + 1;
    document.getElementById('xp-ring').style.strokeDasharray = `${progress}, 100`;
    
    const acc = history.total > 0 ? Math.round((history.correct / history.total) * 100) : 0;
    document.getElementById('accuracy-val').innerText = acc + "%";
    
    document.getElementById('repair-btn').style.display = Object.keys(failLogs).length > 0 ? 'block' : 'none';
}

window.selectChapter = (c) => {
    filteredQ = allQ.filter(q => q.chap.toLowerCase() === c.toLowerCase());
    window.showScreen('screen-difficulty');
};

window.setDiff = (s) => {
    timeLimit = s; score = 0; lives = 3;
    sessionQueue = [...filteredQ].sort(() => Math.random() - 0.5);
    window.showScreen('screen-game');
    nextRound();
};

function nextRound() {
    clearInterval(timerId);
    if (lives <= 0 || sessionQueue.length === 0) { window.showScreen('screen-home'); return; }

    currentQ = sessionQueue[0];
    document.getElementById('formula-display').innerHTML = "\\[" + currentQ.q + "\\]";
    document.getElementById('streak-box').innerText = score;
    document.getElementById('lives-box').innerText = "❤️".repeat(lives);

    const stack = document.getElementById('options-stack');
    stack.innerHTML = "";
    [...currentQ.opts].sort(() => Math.random() - 0.5).forEach(o => {
        const b = document.createElement('button');
        b.className = 'opt-node';
        b.innerHTML = "\\(" + o + "\\)";
        b.onclick = () => {
            history.total++;
            if (o === currentQ.a) { 
                score++; xp += 20; history.correct++; 
                if(score > best) { best = score; localStorage.setItem('ax_best', best); }
                sessionQueue.shift();
                nextRound(); 
            } else handleFail();
            localStorage.setItem('ax_xp', xp);
            localStorage.setItem('ax_hist', JSON.stringify(history));
        };
        stack.appendChild(b);
    });
    safeTypeset();
    startTimer();
}

function startTimer() {
    let cur = timeLimit;
    const bar = document.getElementById('timer-fill');
    timerId = setInterval(() => {
        cur -= 0.1;
        if(bar) bar.style.width = (cur / timeLimit) * 100 + "%";
        if (cur <= 0) handleFail();
    }, 100);
}

function handleFail() {
    clearInterval(timerId);
    lives--;
    
    // Add shake effect to the game screen
    const gameScreen = document.getElementById('screen-game');
    gameScreen.classList.add('shake');
    setTimeout(() => gameScreen.classList.remove('shake'), 400);

    failLogs[currentQ.q] = (failLogs[currentQ.q] || 0) + 1;
    const failedQ = sessionQueue.shift();
    sessionQueue.push(failedQ);
    
    document.getElementById('roast-msg').innerText = roasts[Math.floor(Math.random() * roasts.length)] || "Study harder.";
    document.getElementById('correct-display').innerHTML = "\\[" + currentQ.a + "\\]";
    document.getElementById('roast-overlay').classList.remove('hidden');
    safeTypeset();
}

window.closeRoast = () => { 
    document.getElementById('roast-overlay').classList.add('hidden'); 
    nextRound(); 
};

function populateVault() {
    document.getElementById('vault-list').innerHTML = allQ.map(q => `
        <div class="vault-item" onclick="const a = this.querySelector('.vault-ans'); a.style.display = (a.style.display === 'block') ? 'none' : 'block'">
            <div class="math-main" style="font-size:1.1rem">\\(${q.q}\\)</div>
            <div class="vault-ans">\\(${q.a}\\)</div>
        </div>
    `).join('');
}

function populateLogs() {
    const list = document.getElementById('logs-list');
    const items = Object.entries(failLogs).map(([q, c]) => `
        <div class="vault-item">
            <div>\\(${q}\\)</div>
            <div style="color:var(--accent);margin-top:10px;font-size:0.8rem">Gaps: ${c}</div>
        </div>
    `);
    list.innerHTML = items.length ? items.join('') : "<p style='text-align:center; padding:40px; color:var(--text-muted)'>No gaps identified.</p>";
}

window.startRepair = () => {
    const bad = Object.keys(failLogs);
    filteredQ = allQ.filter(q => bad.includes(q.q));
    window.showScreen('screen-difficulty');
};

init();
