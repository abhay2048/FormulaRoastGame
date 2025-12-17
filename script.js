// ================== GLOBAL VARIABLES ==================
let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

// ================== LOAD DATA ==================
async function loadData() {
    try {
        const fRes = await fetch("maths.txt");
        const rRes = await fetch("roast.txt");

        const fText = await fRes.text();
        const rText = await rRes.text();

        formulas = fText
            .split("\n")
            .map(l => l.trim())
            .filter(l => l && l.includes("="))
            .map(l => {
                const [lhs, ...rhs] = l.split("=");
                return { lhs: lhs.trim(), rhs: rhs.join("=").trim() };
            });

        roasts = rText
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.length > 3);

        console.log("Loaded formulas:", formulas.length);
    } catch (e) {
        console.error("Load error:", e);
    }
}
loadData();

// ================== SCREEN NAVIGATION ==================
window.showScreen = id => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
};
window.goMenu = () => showScreen("menu");

window.openLearn = () => {
    const list = document.getElementById("formulaList");
    list.innerHTML = formulas.map(f =>
        `<div style="margin:6px 0;border-bottom:1px solid #333">${f.lhs} = ${f.rhs}</div>`
    ).join("");
    showScreen("learn");
};

// ================== GAME LOGIC ==================
window.startGame = () => {
    if (!formulas.length) return alert("Loading… wait");
    score = 0;
    chances = 3;
    showScreen("game");
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
    document.getElementById("lives").innerHTML =
        `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
}

window.checkAnswer = () => {
    const user = document.getElementById("answer").value.trim();
    if (!user) return;

    if (isMathEqual(user, current.rhs)) {
        score++;
        document.getElementById("feedback").style.color = "#00eaff";
        document.getElementById("feedback").innerText = "Correct ✨";
        setTimeout(nextQuestion, 700);
    } else {
        chances--;
        document.getElementById("feedback").style.color = "#ff4b2b";
        document.getElementById("feedback").innerText =
            roasts[Math.floor(Math.random() * roasts.length)] || "Wrong";

        if (chances <= 0) {
            setTimeout(() => {
                showScreen("lose");
                document.getElementById("roast").innerText =
                    `Correct Answer:\n${current.lhs} = ${current.rhs}`;
            }, 700);
        }
    }
    updateStats();
};

// ================== MATH ENGINE ==================

// teach nerdamer missing trig
nerdamer.setFunction('sec', ['x'], '1/cos(x)');
nerdamer.setFunction('csc', ['x'], '1/sin(x)');
nerdamer.setFunction('cot', ['x'], '1/tan(x)');

function normalize(str) {
    let s = str.toLowerCase();

    // remove spaces
    s = s.replace(/\s+/g, "");

    // constants
    s = s.replace(/π/g, "pi");

    // roots & powers
    s = s.replace(/√([a-z0-9\(\)]+)/g, "sqrt($1)");
    s = s.replace(/([a-z0-9\)])²/g, "$1^2");
    s = s.replace(/([a-z0-9\)])³/g, "$1^3");

    // sinx → sin(x)
    s = s.replace(/(sin|cos|tan|sec|csc|cot)([a-z])/g, "$1($2)");

    // implicit multiplication
    s = s
        .replace(/([0-9])([a-z\(])/g, "$1*$2")
        .replace(/([a-z\)])([0-9])/g, "$1*$2")
        .replace(/([a-z])([a-z])/g, "$1*$2")
        .replace(/(\))(\()/g, "$1*$2");

    return s;
}

function isMathEqual(userInput, answer) {
    try {
        const u = normalize(userInput);
        const a = normalize(answer);

        // symbolic check
        if (
            nerdamer(u).expand().simplify().equals(
                nerdamer(a).expand().simplify()
            )
        ) return true;

        // numeric fallback
        const tests = [
            {x: 1.2, a: 0.7, b: 0.4},
            {x: -0.9, a: -0.5, b: 0.3},
            {x: Math.PI / 4, a: 1, b: 2}
        ];

        for (let t of tests) {
            const uv = Number(nerdamer(u, t).evaluate().text());
            const av = Number(nerdamer(a, t).evaluate().text());
            if (Math.abs(uv - av) > 1e-3) return false;
        }

        return true;
    } catch {
        return false;
    }
}

// ================== CUSTOM KEYBOARD ==================
window.addInput = v => {
    document.getElementById("answer").value += v;
};
window.backspace = () => {
    const i = document.getElementById("answer");
    i.value = i.value.slice(0, -1);
};
