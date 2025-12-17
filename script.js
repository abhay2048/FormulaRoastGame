// ---------- GLOBAL STATE ----------
let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

// ---------- SCREEN NAV ----------
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
}
window.showScreen = showScreen;

// ---------- NORMALIZATION ----------
function normalize(str) {
    if (!str) return "";
    let s = str.toLowerCase().replace(/\s+/g, "");

    s = s.replace(/π/g, "pi")
         .replace(/√/g, "sqrt")
         .replace(/²/g, "^2")
         .replace(/³/g, "^3")
         .replace(/cosec/g, "csc");

    s = s.replace(/(sin|cos|tan|csc|sec|cot)([a-z0-9]+)/g, "$1($2)");
    s = s.replace(/(\d)([a-z])/g, "$1*$2");
    s = s.replace(/([a-z])([a-z])/g, "$1*$2");

    return s;
}

// ---------- MATH CHECK ----------
function isMathEqual(user, answer) {
    try {
        const u = normalize(user);
        const a = normalize(answer);

        const diff = nerdamer(`(${u})-(${a})`).expand().simplify().text();
        if (diff === "0") return true;

        const scope = { x: 0.7, a: 1.1, b: -0.4 };
        const val = nerdamer(`(${u})-(${a})`, scope).evaluate().text();
        return Math.abs(parseFloat(val)) < 0.001;
    } catch {
        return false;
    }
}

// ---------- GAME ----------
window.startGame = function () {
    if (!formulas.length) {
        alert("maths.txt still loading");
        return;
    }
    score = 0;
    chances = 3;
    showScreen("game");
    nextQuestion();
};

window.checkAnswer = function () {
    const input = document.getElementById("answer").value.trim();
    if (!input) return;

    if (isMathEqual(input, current.rhs)) {
        score++;
        feedback("CORRECT! ✨", "#00d2ff");
        setTimeout(nextQuestion, 700);
    } else {
        chances--;
        const roast = roasts[Math.floor(Math.random() * roasts.length)] || "Wrong!";
        feedback(roast, "#ff4b2b");

        if (chances <= 0) {
            setTimeout(() => {
                showScreen("lose");
                document.getElementById("roast").innerText =
                    `Correct Answer: ${current.rhs}\n\n${roast}`;
            }, 700);
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
    document.getElementById("lives").innerHTML =
        `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
}

function feedback(text, color) {
    const f = document.getElementById("feedback");
    f.style.color = color;
    f.innerText = text;
}

// ---------- LEARN ----------
window.openLearn = function () {
    document.getElementById("formulaList").innerHTML =
        formulas.map(f => `<div>${f.lhs} = ${f.rhs}</div>`).join("");
    showScreen("learn");
};

// ---------- LOAD FILES ----------
async function loadData() {
    const fText = await fetch("maths.txt").then(r => r.text());
    const rText = await fetch("roast.txt").then(r => r.text());

    formulas = fText.split("\n")
        .filter(l => l.includes("="))
        .map(l => {
            const [lhs, rhs] = l.split("=");
            return { lhs: lhs.trim(), rhs: rhs.trim() };
        });

    roasts = rText.split("\n").filter(Boolean);
    console.log("Loaded:", formulas.length, "formulas");
}

document.addEventListener("DOMContentLoaded", loadData);
