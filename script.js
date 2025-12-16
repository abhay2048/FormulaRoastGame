let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

// 1. Data Loading
async function loadData() {
  try {
    const f = await fetch("maths.txt");
    const r = await fetch("roast.txt");
    const fText = await f.text();
    const rText = await r.text();

    formulas = fText.split("\n")
      .map(l => l.replace(/\/g, "").trim())
      .filter(l => l.includes("="))
      .map(l => {
        const parts = l.split("=");
        return { lhs: parts[0].trim(), rhs: parts.slice(1).join("=").trim() };
      });

    roasts = rText.split("\n")
      .map(l => l.replace(/\/g, "").trim())
      .filter(l => l.length > 5);

    console.log("System Ready");
  } catch (e) {
    console.error("File loading failed:", e);
  }
}

loadData();

// 2. Navigation (Attached to window so buttons can always see them)
window.showScreen = function(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
};

window.goMenu = function() { showScreen('menu'); };

window.openLearn = function() {
  const list = document.getElementById("formulaList");
  list.innerHTML = formulas.map(f => `<div style="margin:10px 0; border-bottom:1px solid #333; padding-bottom:5px;">${f.lhs} = ${f.rhs}</div>`).join("");
  showScreen('learn');
};

window.startGame = function() {
  if (formulas.length === 0) {
    alert("Data is still loading from the server. Please wait 2 seconds.");
    return;
  }
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
  document.getElementById("lives").innerText = "Score: " + score + " | Lives: " + "❤️".repeat(chances);
}

window.checkAnswer = function() {
  const user = document.getElementById("answer").value;
  if (!user) return;

  if (isMathEqual(user, current.rhs)) {
    score++;
    document.getElementById("feedback").style.color = "#00d2ff";
    document.getElementById("feedback").innerText = "Correct! ✨";
    setTimeout(nextQuestion, 1000);
  } else {
    chances--;
    document.getElementById("feedback").style.color = "#ff4b2b";
    document.getElementById("feedback").innerText = roasts[Math.floor(Math.random() * roasts.length)];
    if (chances <= 0) {
        showScreen('lose');
        document.getElementById("roast").innerText = document.getElementById("feedback").innerText;
    }
  }
  updateStats();
};

// 4. Math Comparison (Simplified to prevent Regex errors)
function normalize(str) {
  return str.toLowerCase()
    .split(" ").join("")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3");
}

function isMathEqual(u, a) {
  try {
    const uN = normalize(u);
    const aN = normalize(a);
    // Symbolic check using nerdamer
    if (nerdamer(uN).equals(aN)) return true;
    
    // Numeric check fallback
    const testVal = 1.2;
    const scope = { x: testVal, a: testVal, b: testVal, y: testVal };
    const uv = Number(nerdamer(uN, scope).evaluate().text());
    const av = Number(nerdamer(aN, scope).evaluate().text());
    return Math.abs(uv - av) < 0.01;
  } catch (e) {
    return false;
  }
}

// 5. Keyboard
window.addInput = function(v) {
  document.getElementById("answer").value += v;
};

window.backspace = function() {
  const input = document.getElementById("answer");
  input.value = input.value.slice(0, -1);
};
