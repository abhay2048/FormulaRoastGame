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
        
        // Parsing formulas and removing the / symbols as in your original code
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
            
        console.log("✅ Engine Loaded. Formulas:", formulas.length);
    } catch (err) {
        console.error("❌ Failed to load files:", err);
    }
}
loadData();

// 2. The Leniency Engine (Normalization)
function normalize(str) {
    if (!str) return "";
    let s = str.toLowerCase().replace(/\s+/g, "");

    // Basic replacements
    s = s.replace(/π/g, "pi").replace(/√/g, "sqrt")
         .replace(/²/g, "^2").replace(/³/g, "^3")
         .replace(/cosec/g, "csc");

    // FIX: sin^2(x) or sin^2x -> (sin(x))^2
    // This handles the user writing powers directly on the function name
    s = s.replace(/(sin|cos|tan|csc|sec|cot)\^?(\d+)\(?([a-z0-9]+)\)?/g, "($1($3))^$2");

    // FIX: sinx -> sin(x)
    // Ensures functions have parentheses even if the user forgot them
    s = s.replace(/(sin|cos|tan|csc|sec|cot)([a-z0-9]+)/g, "$1($2)");

    // FIX: 2ab or 2x -> 2*a*b or 2*x
    s = s.replace(/(\d)([a-z])/g, "$1*$2");
    
    // FIX: Implicit multiplication ab -> a*b 
    // Uses a regex that avoids breaking function names like 'sin'
    s = s.replace(/([a-z])(?=[a-z])/g, (match, p1, offset, whole) => {
        const check = whole.substr(offset, 3);
        const funcs = ["sin", "cos", "tan", "csc", "sec", "cot"];
        if (funcs.includes(check)) return p1; // Don't split "sin"
        return p1 + "*";
    });

    // FIX: (a+b)(a-b) -> (a+b)*(a-b)
    s = s.replace(/\)\(/g, ")*(");
    s = s.replace(/(\d|[a-z])\(/g, "$1*(");

    return s;
}

// 3. Mathematical Comparison
function isMathEqual(userInput, answer) {
    try {
        const uN = normalize(userInput);
        const aN = normalize(answer);

        // Test 1: Symbolic check (Difference should be 0)
        const diff = nerdamer(`(${uN}) - (${aN})`).expand().simplify().text();
        if (diff === "0") return true;

        // Test 2: Numeric fallback (Plugin values to handle complex equivalence)
        // We use common trig values to ensure trig identities match
        const testVals = [0.5, 1.2, Math.PI/6];
        const vars = ['x', 'a', 'b', 'y'];
        
        for (let v of testVals) {
            let scope = {};
            vars.forEach(variable => scope[variable] = v);
            let result = nerdamer(`(${uN}) - (${aN})`, scope).evaluate().text();
            if (Math.abs(parseFloat(result)) < 0.00001) return true;
        }
        return false;
    } catch (e) {
        console.warn("Math parse error, likely invalid syntax");
        return false;
    }
}

// 4. Game Logic & UI
window.showScreen = id => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
};

window.goMenu = () => showScreen('menu');

window.openLearn = () => {
    const list = document.getElementById("formulaList");
    list.innerHTML = formulas.length 
        ? formulas.map(f => `<div style="margin:8px 0; border-bottom:1px solid #333;">${f.lhs} = ${f.rhs}</div>`).join("") 
        : "Loading formulas...";
    showScreen('learn');
};

window.startGame = () => {
    if (!formulas.length) return alert("Still loading formulas...");
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
    if(statsDiv) statsDiv.innerHTML = `SCORE: ${score} | LIVES: ${"❤️".repeat(chances)}`;
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
        const roast = roasts[Math.floor(Math.random() * roasts.length)] || "Wrong!";
        document.getElementById("feedback").innerText = roast;

        if (chances <= 0) {
            setTimeout(() => {
                showScreen('lose');
                document.getElementById("roast").innerText =
                    `The correct answer was: ${current.rhs}\n\n${roast}`;
            }, 800);
        }
    }
    updateStats();
};

// Custom Keyboard
window.addInput = v => document.getElementById("answer").value += v;
window.backspace = () => {
    const input = document.getElementById("answer");
    input.value = input.value.slice(0, -1);
};
