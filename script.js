// Global State
let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

// 1. Navigation
window.showScreen = function(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
};

// 2. Math Engine (Leniency)
function normalize(str) {
    if (!str) return "";
    let s = str.toLowerCase().replace(/\s+/g, ""); 
    
    s = s.replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/²/g, "^2").replace(/³/g, "^3").replace(/cosec/g, "csc");
    
    // sin^2x -> (sin(x))^2
    s = s.replace(/(sin|cos|tan|csc|sec|cot)\^?(\d+)\(?([a-z0-9]+)\)?/g, "($1($3))^$2");
    
    // sinx -> sin(x)
    s = s.replace(/(sin|cos|tan|csc|sec|cot)([a-z0-9]+)/g, "$1($2)");

    // ab -> a*b
    s = s.replace(/(\d)([a-z])/g, "$1*$2");
    s = s.replace(/([a-z])(?=[a-z])/g, (match, p1, offset, whole) => {
        const funcs = ["sin", "cos", "tan", "csc", "sec", "cot"];
        const check = whole.substr(offset, 3);
        return funcs.includes(check) ? p1 : p1 + "*";
    });
    
    return s;
}

function isMathEqual(userInput, answer) {
    try {
        const uN = normalize(userInput);
        const aN = normalize(answer);
        const diff = nerdamer(`(${uN}) - (${aN})`).expand().simplify().text();
        if (diff === "0") return true;

        const p = 0.5;
        const scope = { x: p, a: p + 0.1, b: p - 0.1, y: p * 2 };
        const result = nerdamer(`(${uN}) - (${aN})`, scope).evaluate().text();
        return Math.abs(parseFloat(result)) < 0.001;
    } catch (e) { return false; }
}

// 3. Game Actions
window.startGame = function() {
    if (formulas.length === 0) {
        alert("Data is still loading from maths.txt...");
        return;
    }
    score = 0;
    chances = 3;
    window.showScreen('game');
    nextQuestion();
};

window.checkAnswer = function() {
    const userValue = document.getElementById("answer").value.trim();
    if (!userValue) return;

    if (isMathEqual(userValue, current.rhs)) {
        score++;
        document.getElementById("feedback").style.color = "#00d2ff";
        document.getElementById("feedback").innerText = "CORRECT! ✨";
        setTimeout(nextQuestion, 800);
    } else {
        chances--;
        const roast = roasts[Math.floor(Math.random() * roasts.length)] || "Wrong!";
        document.getElementById("feedback").style.color = "#ff4b2b";
        document.getElementById("feedback").innerText = roast;
        if (chances <= 0) {
            setTimeout(() => {
                window.showScreen('lose');
                document.getElementById("roast").innerText = `Correct Answer: ${current.rhs}\n\n${roast}`;
            }, 800);
        }
    }
    updateStats();
};

function nextQuestion() {
    current = formulas[Math.floor(Math.random() * formulas.length)];
    document.getElementById("question").innerText = current.lhs + " = ?";
    document.getElementById("answer").value = "";
    document.getElementById("feedback").innerText = "";
    document.getElementById("answer").focus();
    updateStats();
}

function updateStats() {
    const stats = document.getElementById("lives");
    if (stats) stats.innerHTML = `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
}

window.openLearn = function() {
    document.getElementById("formulaList").innerHTML = formulas.map(f => `<div>${f.lhs} = ${f.rhs}</div>`).join("");
    window.showScreen('learn');
};

// 4. Initialization
async function loadData() {
    try {
        const fRes = await fetch("maths.txt");
        const rRes = await fetch("roast.txt");
        const fText = await fRes.text();
        const rText = await rRes.text();
        
        formulas = fText.split("\n").filter(l => l.includes("=")).map(l => {
            const parts = l.split("=");
            return { lhs: parts[0].trim(), rhs: parts[1].trim() };
        });
        roasts = rText.split("\n").filter(l => l.trim().length > 2);
        console.log("✅ Game Logic Loaded");
    } catch (e) {
        console.error("Critical: Could not load maths.txt or roast.txt");
    }
}

// Event Listeners
document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const gameScreen = document.getElementById("game");
        if (gameScreen && gameScreen.classList.contains("active")) window.checkAnswer();
    }
});

loadData();
