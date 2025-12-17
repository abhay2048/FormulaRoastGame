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
            .filter(l => l.includes("="))
            .map(l => {
                const parts = l.split("=");
                return { lhs: parts[0].trim(), rhs: parts[1].trim() };
            });

        roasts = rText.split("\n").filter(l => l.trim().length > 3);
        console.log("✅ Math Engine & Roasts Loaded");
    } catch (err) {
        console.error("❌ Error loading files. Ensure maths.txt and roast.txt exist.", err);
    }
}
loadData();

// 2. The Leniency Engine (The "Human-to-Math" Translator)
function normalize(str) {
    if (!str) return "";
    let s = str.toLowerCase().trim();

    // A. Remove spaces so "sin x" and "sinx" are the same
    s = s.replace(/\s+/g, "");

    // B. Replace Symbols
    s = s.replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/²/g, "^2").replace(/³/g, "^3").replace(/cosec/g, "csc");

    // C. Fix sin^2x or sin^2(x) -> (sin(x))^2
    s = s.replace(/(sin|cos|tan|csc|sec|cot)\^?(\d+)\(?([a-z0-9]+)\)?/g, "($1($3))^$2");

    // D. Fix sinx -> sin(x) (Single variables don't need brackets)
    s = s.replace(/(sin|cos|tan|csc|sec|cot)([a-z0-9]+)/g, "$1($2)");

    // E. Implicit Multiplication (2x -> 2*x, ab -> a*b)
    s = s.replace(/(\d)([a-z])/g, "$1*$2");
    s = s.replace(/([a-z])(?=[a-z])/g, (match, p1, offset, whole) => {
        const funcs = ["sin", "cos", "tan", "csc", "sec", "cot"];
        const check = whole.substr(offset, 3);
        return funcs.includes(check) ? p1 : p1 + "*";
    });

    // F. Grouping Multiplication (a+b)(c) -> (a+b)*(c)
    s = s.replace(/\)\(/g, ")*(");
    s = s.replace(/(\d|[a-z])\(/g, "$1*(");

    return s;
}

// 3. Comparison Logic
function isMathEqual(userInput, answer) {
    try {
        const uN = normalize(userInput);
        const aN = normalize(answer);

        // Test 1: Symbolic check
        const diff = nerdamer(`(${uN}) - (${aN})`).expand().simplify().text();
        if (diff === "0") return true;

        // Test 2: Numeric fallback (For identities like sin^2 + cos^2 = 1)
        const testPoints = [0.5, 1.2];
        const vars = ['x', 'a', 'b', 'y'];
        for (let v of testPoints) {
            let scope = { x: v, a: v + 0.1, b: v - 0.1, y: v * 2 };
            let result = nerdamer(`(${uN}) - (${aN})`, scope).evaluate().text();
            if (Math.abs(parseFloat(result)) < 0.0001) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// 4. UI Logic
window.startGame = () => {
    if (!formulas.length) return alert("Still loading formulas... wait a sec.");
    score = 0; chances = 3;
    showScreen('game');
    nextQuestion();
};

function nextQuestion() {
    current = formulas[Math.floor(Math.random() * formulas.length)];
    document.getElementById("question").innerText = current.lhs + " = ?";
    document.getElementById("answer").value = "";
    document.getElementById("feedback").innerText = "";
    document.getElementById("answer").focus(); // Auto-focus for speed
    updateStats();
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
        const roast = roasts[Math.floor(Math.random() * roasts.length)] || "Try using a brain!";
        document.getElementById("feedback").style.color = "#ff4b2b";
        document.getElementById("feedback").innerText = roast;
        if (chances <= 0) {
            setTimeout(() => {
                showScreen('lose');
                document.getElementById("roast").innerText = `Correct: ${current.rhs}\n\n"${roast}"`;
            }, 800);
        }
    }
    updateStats();
};

function updateStats() {
    document.getElementById("lives").innerHTML = `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
}

window.showScreen = id => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

window.goMenu = () => showScreen('menu');
window.openLearn = () => {
    document.getElementById("formulaList").innerHTML = formulas.map(f => `<div style="padding:5px; border-bottom:1px solid #222;">${f.lhs} = ${f.rhs}</div>`).join("");
    showScreen('learn');
};

// Listen for "Enter" key
document.getElementById("answer").addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
});
