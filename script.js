let allQ = [], roasts = [], failLogs = {};
let sessionQueue = [], currentQ = null;
let score = 0, lives = 3, xp = parseInt(localStorage.getItem('ax_xp')) || 0;
let best = parseInt(localStorage.getItem('ax_best')) || 0;
let callsign = localStorage.getItem('ax_id') || "";
let history = JSON.parse(localStorage.getItem('ax_hist')) || { total: 0, correct: 0 };
let timerId = null, timeLimit = 30;

// Symbol Logic
function genSymbols() {
    const symbols = ["∫", "∑", "π", "∂", "∞", "θ", "Δ", "√", "Ω", "φ", "λ"];
    const container = document.getElementById('symbol-layer');
    if(!container) return;
    for(let i=0; i<25; i++) {
        const span = document.createElement('span');
        span.className = 'float-symbol';
        span.innerText = symbols[Math.floor(Math.random()*symbols.length)];
        span.style.left = Math.random() * 100 + "%";
        span.style.top = Math.random() * 100 + "%";
        span.style.fontSize = (Math.random() * 2 + 1) + "rem";
        container.appendChild(span);
    }
}

// Parallax Movement
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    document.querySelectorAll('.float-symbol').forEach((s, i) => {
        const speed = (i % 5) + 2;
        s.style.transform = `translate(${x * 45 * speed}px, ${y * 45 * speed}px)`;
    });
});

async function init() {
    genSymbols();
    try {
        // Fix 404s with relative paths
        const [fRes, rRes] = await Promise.all([
            fetch('./mathformula.txt'),
            fetch('./roast.txt')
        ]);
        const fText = await fRes.text();
        const rText = await rRes.text();

        allQ = fText.split('\n').filter(l => l.includes('::')).map(l => {
            const p = l.split('::').map(s => s.trim());
            return { chap: p[0], q: p[1], a: p[2], opts: [p[2], p[3], p[4], p[5]] };
        });
        roasts = rText.split('\n').filter(l => l.trim() !== "");
        
        const chapters = [...new Set(allQ.map(q => q.chap))];
        document.getElementById('chapter-list').innerHTML = chapters.map(c => `
            <button class="menu-action-card" onclick="selectChapter('${c}')">
                <strong>${c.toUpperCase()}</strong>
                <small>Archive Manuscripts</small>
            </button>
        `).join('');
        
        if(callsign) showScreen('screen-home');
    } catch (e) { console.error("Archive initialization failed.", e); }
}

window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('main-dock').classList.toggle('hidden', id === 'screen-login' || id === 'screen-game');
    
    if(id === 'screen-home') {
        document.getElementById('display-name').innerText = callsign;
        document.getElementById('best-val').innerText = best;
        document.getElementById('xp-fill').style.width = (xp % 1000) / 10 + "%";
        document.getElementById('repair-btn').classList.toggle('hidden', Object.keys(failLogs).length === 0);
    }
    if(id === 'screen-vault') populateVault();
    if(id === 'screen-logs') populateLogs();
    
    document.querySelectorAll('.nav-item').forEach(t => {
        t.classList.toggle('active', t.getAttribute('onclick').includes(id));
    });
    safeTypeset();
};

window.submitLogin = () => {
    const val = document.getElementById('callsign-input').value.trim();
    if(val) {
        callsign = val.toUpperCase();
        localStorage.setItem('ax_id', callsign);
        showScreen('screen-home');
    }
};

window.selectChapter = (c) => {
    sessionQueue = allQ.filter(q => q.chap === c).sort(() => Math.random() - 0.5);
    showScreen('screen-difficulty');
};

window.setDiff = (s) => {
    timeLimit = s; score = 0; lives = 3;
    showScreen('screen-game');
    nextRound();
};

function nextRound() {
    clearInterval(timerId);
    if(lives <= 0 || !sessionQueue.length) { showScreen('screen-home'); return; }
    
    currentQ = sessionQueue.shift();
    document.getElementById('formula-display').innerHTML = `\\[${currentQ.q}\\]`;
    document.getElementById('streak-box').innerText = score;
    document.getElementById('lives-box').innerText = "❤️".repeat(lives);

    const stack = document.getElementById('options-stack');
    stack.innerHTML = "";
    [...currentQ.opts].sort(() => Math.random() - 0.5).forEach(o => {
        const b = document.createElement('button');
        b.className = 'option-btn';
        b.innerHTML = `\\(${o}\\)`;
        b.onclick = () => {
            history.total++;
            if(o === currentQ.a) { 
                score++; xp += 20; history.correct++;
                if(score > best) { best = score; localStorage.setItem('ax_best', best); }
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
    let cur = 100;
    timerId = setInterval(() => {
        cur -= (100 / (timeLimit * 10));
        document.getElementById('timer-fill').style.width = cur + "%";
        if(cur <= 0) handleFail();
    }, 100);
}

function handleFail() {
    clearInterval(timerId);
    lives--;
    failLogs[currentQ.q] = (failLogs[currentQ.q] || 0) + 1;
    document.getElementById('roast-msg').innerText = roasts[Math.floor(Math.random()*roasts.length)];
    document.getElementById('correct-display').innerHTML = `\\[${currentQ.a}\\]`;
    document.getElementById('roast-overlay').classList.remove('hidden');
    safeTypeset();
}

window.closeRoast = () => {
    document.getElementById('roast-overlay').classList.add('hidden');
    nextRound();
};

window.startRepair = () => {
    const bad = Object.keys(failLogs);
    sessionQueue = allQ.filter(q => bad.includes(q.q)).sort(() => Math.random() - 0.5);
    showScreen('screen-difficulty');
};

function populateVault() {
    document.getElementById('vault-list').innerHTML = allQ.map(q => `
        <div class="vault-item" onclick="const a = this.querySelector('.v-ans'); a.style.display = a.style.display === 'block' ? 'none' : 'block'">
            <div class="math-main">\\(${q.q}\\)</div>
            <div class="v-ans" style="display:none; color:var(--accent); margin-top:10px; border-top:1px dashed var(--border); padding-top:10px;">\\(${q.a}\\)</div>
        </div>
    `).join('');
    safeTypeset();
}

function populateLogs() {
    const items = Object.entries(failLogs).map(([q, c]) => `
        <div class="vault-item"><div class="math-main">\\(${q}\\)</div><small style="color:var(--accent)">GAPS: ${c}</small></div>
    `);
    document.getElementById('logs-list').innerHTML = items.length ? items.join('') : "<p style='text-align:center; padding:40px; opacity:0.5;'>Cognitive map is clear.</p>";
    safeTypeset();
}

function safeTypeset() {
    if(window.MathJax && window.MathJax.typesetPromise) MathJax.typesetPromise();
}

init();
