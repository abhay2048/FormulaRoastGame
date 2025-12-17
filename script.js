/***********************
 * GLOBAL STATE
 ***********************/
let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

/***********************
 * SCREEN NAVIGATION
 ***********************/
window.showScreen = function (id) {
    document.querySelectorAll(".screen").forEach(s =>
        s.classList.remove("active")
    );
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
};

/***********************
 * NORMALIZATION
 ***********************/
function normalize(str) {
    if (!str) return "";
    let s = str.toLowerCase().replace(/\s+/g, "");

    s = s.replace(/π/g, "pi")
         .replace(/√/g, "sqrt")
         .replace(/²/g, "^2")
         .replace(/³/g, "^3")
         .replace(/cosec/g, "csc");

    // sinx -> sin(x)
    s = s.replace(/(sin|cos|tan|csc|sec|cot)([a-z0-9]+)/g, "$1($2)");

    // 2x -> 2*x
    s = s.replace(/(\d)([a-z])/g, "$1*$2");

    // ab -> a*b
    s = s.replace(/([a-z])([a-z])/g, "$1*$2");

    return s;
}

/***********************
 * MATH CHECK (NERDAMER)
 ***********************/
function isMathEqual(user, answer) {
    try {
        const u = normalize(user);
        const a = normalize(answer);

        const diff = nerdamer(`(${u})-(${a})`)
            .expand()
            .simplify()
            .text();

        if (diff === "0") return true;

        // numeric fallback
        const scope = { x: 0.7, a: 1.2, b: -0.4 };
        const val = nerdamer(`(${u})-(${a})`, scope)
            .evaluate()
            .text();

        return Math.abs(parseFloat(val)) < 0.001;
    } catch (e) {
        return false;
    }
}

/***********************
 * GAME CONTROL
 ***********************/
window.startGame = function () {
    if (!formulas.length) {
        alert("maths.txt not loaded yet");
        return;
    }
    score = 0;
    chances = 3;
    window.showScreen("game");
    nextQuestion();
};

window.checkAnswer = function () {
    const input = document.getElementById("answer").value.trim();
    if (!input || !current) return;

    if (isMathEqual(input, current.rhs)) {
        score++;
        showFeedback("CORRECT! ✨", "#00d2ff");
        setTimeout(nextQuestion, 700);
    } else {
        chances--;
        const roast =
            roasts[Math.floor(Math.random() * roasts.length)] || "Wrong!";
        showFeedback(roast, "#ff4b2b");

        if (chances <= 0) {
            setTimeout(() => {
                window.showScreen("lose");
                document.getElementById("roast").innerText =
                    `Correct Answer: ${current.rhs}\n\n${roast}`;
            }, 700);
        }
    }
    updateStats();
};

/***********************
 * HELPERS
 ***********************/
function nextQuestion() {
    current = formulas[Math.floor(Math.random() * formulas.length)];
    document.getElementById("question").innerText =
        current.lhs + " = ?";
    document.getElementById("answer").value = "";
    document.getElementById("feedback").innerText = "";
    document.getElementById("answer").focus();
    updateStats();
}

function updateStats() {
    document.getElementById("lives").innerHTML =
        `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
}

function showFeedback(text, color) {
    const f = document.getElementById("feedback");
    f.style.color = color;
    f.innerText = text;
}

/***********************
 * LEARN MODE
 ***********************/
window.openLearn = function () {
    document.getElementById("formulaList").innerHTML =
        formulas.map(f => `<div>${f.lhs} = ${f.rhs}</div>`).join("");
    window.showScreen("learn");
};

/***********************
 * LOAD FILES
 ***********************/
async function loadData() {
    try {
        const fText = await fetch("maths.txt").then(r => r.text());
        const rText = await fetch("roast.txt").then(r => r.text());

        formulas = fText
            .split("\n")
            .filter(l => l.includes("="))
            .map(l => {
                const [lhs, rhs] = l.split("=");
                return { lhs: lhs.trim(), rhs: rhs.trim() };
            });

        roasts = rText.split("\n").filter(Boolean);

        console.log("✅ scipt.js loaded");
        console.log("Formulas:", formulas.length);
        console.log("Roasts:", roasts.length);
    } catch (e) {
        console.error("❌ Failed loading data", e);
    }
}

document.addEventListener("DOMContentLoaded", loadData);
