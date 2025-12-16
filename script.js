// Global variables
let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

// 1. Load Data
async function loadData() {
    try {
        const fRes = await fetch("maths.txt");
        const rRes = await fetch("roast.txt");
        const fText = await fRes.text();
        const rText = await rRes.text();

        formulas = fText.split("\n")
            .map(l => l.replace(/\//g, "").trim())
            .filter(l => l.includes("="))
            .map(l => {
                const parts = l.split("=");
                return { lhs: parts[0].trim(), rhs: parts.slice(1).join("=").trim() };
            });

        roasts = rText.split("\n")
            .map(l => l.replace(/\//g, "").trim())
            .filter(l => l.length > 3);

        console.log("✅ Formulas Loaded:", formulas.length);
    } catch (err) {
        console.error("❌ Failed to load files:", err);
    }
}
loadData();

// 2. Screen Navigation
window.showScreen = id => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
};
window.goMenu = () => showScreen('menu');

window.openLearn = () => {
    const list = document.getElementById("formulaList");
    list.innerHTML = formulas.length 
        ? formulas.map(f => `<div style="margin:8px 0; border-bottom:1px solid #333; padding-bottom:4px;">${f.lhs} = ${f.rhs}</div>`).join("") 
        : "Loading formulas...";
    showScreen('learn');
};

// 3. Game Logic
window.startGame = () => {
    if (!formulas.length) return alert("Loading data… wait 1 sec");
    score = 0;
    chances = 3;
    showScreen('game');
    nextQuestion();
};

function nextQuestion() {
    current = formulas[Math.floor(Math.random() * formulas.length)];
    document.getElementById("question").innerText = current.lhs + " = ?";
    document.getElementById("answer").value = "";
    document.getElementById("feedback").innerText = "";
    updateStats();
}

function updateStats() {
    const statsDiv = document.getElementById("lives");
    statsDiv.innerHTML = `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
}

window.checkAnswer = () => {
    const user = document.getElementById("answer").value.trim();
    if (!user) return;

    if (isMathEqual(user, current.rhs)) {
        score++;
        document.getElementById("feedback").style.color = "#00d2ff";
        document.getElementById("feedback").innerText = "CORRECT! ✨";
        setTimeout(nextQuestion, 800);
    } else {
        chances--;
        document.getElementById("feedback").style.color = "#ff4b2b";
        document.getElementById("feedback").innerText = roasts[Math.floor(Math.random() * roasts.length)] || "Wrong!";

        if (chances <= 0) {
            setTimeout(() => {
                showScreen('lose');
                document.getElementById("roast").innerText =
                    `Answer: ${current.lhs} = ${current.rhs}\n${document.getElementById("feedback").innerText}`;
            }, 800);
        }
    }
    updateStats();
};

// 4. Bulletproof Math Engine
function normalize(str) {
    let s = str.toLowerCase()
        .replace(/\s+/g, "")
        .replace(/π/g, "pi")
        .replace(/√/g, "sqrt")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3");

    // Insert * between adjacent functions/variables
    s = s.replace(/([a-z]\([^\)]*\))([a-z]\([^\)]*\))/g, "$1*$2"); // sin(x)cos(x)
    s = s.replace(/([a-z]\([^\)]*\))([a-z])/g, "$1*$2");             // sin(x)x
    s = s.replace(/([0-9a-z\)])([a-z]\()/g, "$1*$2");               // 2x sin(x)
    return s;
}

function isMathEqual(userInput, answer) {
    try {
        const uN = normalize(userInput);
        const aN = normalize(answer);

        // 1. Symbolic check with expand() + simplify()
        const uSim = nerdamer(uN).expand().simplify().text();
        const aSim = nerdamer(aN).expand().simplify().text();
        if (nerdamer(uSim).equals(aSim)) return true;

        // 2. Numeric fallback (multiple variables with different test values)
        const testVals = [1.25, 2.3, -0.75, 0, Math.PI/4, -Math.PI/3];
        for (let v of testVals) {
            const scope = { x: v, a: v/2, b: v/3, y: v/4 }; // assign different numbers to variables
            const uv = Number(nerdamer(uN, scope).evaluate().text());
            const av = Number(nerdamer(aN, scope).evaluate().text());
            if (Math.abs(uv - av) > 0.01) return false;
        }

        return true;
    } catch {
        return false;
    }
}

// 5. Custom Keyboard
window.addInput = v => document.getElementById("answer").value += v;
window.backspace = () => {
    const input = document.getElementById("answer");
    input.value = input.value.slice(0, -1);
};
