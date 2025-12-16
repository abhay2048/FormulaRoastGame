// Global variables
let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

// 1. Load Data Safely
async function loadData() {
    try {
        const fRes = await fetch("maths.txt");
        const rRes = await fetch("roast.txt");
        const fText = await fRes.text();
        const rText = await rRes.text();

        // Parse formulas correctly
        formulas = fText.split("\n")
            .map(l => l.replace(/\//g, "").trim())
            .filter(l => l.includes("="))
            .map(l => {
                const parts = l.split("=");
                return { lhs: parts[0].trim(), rhs: parts.slice(1).join("=").trim() };
            });

        // Parse roasts
        roasts = rText.split("\n")
            .map(l => l.replace(/\//g, "").trim())
            .filter(l => l.length > 3);

        console.log("✅ Math Engine Ready. Formulas loaded:", formulas.length);
    } catch (err) {
        console.error("❌ Failed to load text files:", err);
    }
}
loadData();

// 2. Screen Navigation
window.showScreen = function(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
};
window.goMenu = function() { showScreen('menu'); };

window.openLearn = function() {
    const list = document.getElementById("formulaList");
    if (formulas.length === 0) {
        list.innerHTML = "Loading formulas...";
    } else {
        list.innerHTML = formulas.map(f => `<div style="margin:8px 0; border-bottom:1px solid #333; padding-bottom:4px;">${f.lhs} = ${f.rhs}</div>`).join("");
    }
    showScreen('learn');
};

window.startGame = function() {
    if (formulas.length === 0) return alert("Game data is still loading. Try again in 1 second.");
    score = 0;
    chances = 3;
    showScreen('game');
    nextQuestion();
};

// 3. Game Logic
function nextQuestion() {
    current = formulas[Math.floor(Math.random() * formulas.length)];
    document.getElementById("question").innerText = current.lhs + " = ?";
    document.getElementById("answer").value = "";
    document.getElementById("feedback").innerText = "";
    updateStats();
}

function updateStats() {
    const statsDiv = document.getElementById("lives");
    if (statsDiv) {
        statsDiv.innerHTML = `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
    }
}

window.checkAnswer = function() {
    const user = document.getElementById("answer").value.trim();
    if (!user) return;

    if (isMathEqual(user, current.rhs)) {
        score++;
        document.getElementById("feedback").style.color = "#00d2ff";
        document.getElementById("feedback").innerText = "CORRECT! ✨";
        setTimeout(nextQuestion, 1000);
    } else {
        chances--;
        document.getElementById("feedback").style.color = "#ff4b2b";
        document.getElementById("feedback").innerText = roasts[Math.floor(Math.random() * roasts.length)] || "Wrong!";
        if (chances <= 0) {
            setTimeout(() => {
                showScreen('lose');
                document.getElementById("roast").innerText = document.getElementById("feedback").innerText;
            }, 1000);
        }
    }
    updateStats();
};

// 4. Math Engine
function normalize(str) {
    return str.toLowerCase()
        .replace(/\s+/g, "")
        .replace(/π/g, "pi")
        .replace(/√/g, "sqrt")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3");
}

function isMathEqual(u, a) {
    try {
        const uN = normalize(u);
        const aN = normalize(a);
        
        // Symbolic equality
        if (nerdamer(uN).equals(aN)) return true;

        // Numeric fallback
        const testVal = 1.25;
        const scope = { x: testVal, a: testVal, b: testVal, y: testVal };
        const uv = Number(nerdamer(uN, scope).evaluate().text());
        const av = Number(nerdamer(aN, scope).evaluate().text());
        return Math.abs(uv - av) < 0.01;
    } catch (e) {
        return false;
    }
}

// 5. Custom Keyboard
window.addInput = function(v) {
    document.getElementById("answer").value += v;
};

window.backspace = function() {
    const input = document.getElementById("answer");
    input.value = input.value.slice(0, -1);
};
