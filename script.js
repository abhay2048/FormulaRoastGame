let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

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
        const [lhs, ...rhs] = l.split("=");
        return { lhs: lhs.trim(), rhs: rhs.join("=").trim() };
      });

    roasts = rText.split("\n")
      .map(l => l.replace(/\/g, "").trim())
      .filter(l => l.length > 5);

    console.log("Data Loaded Successfully");
  } catch (e) {
    console.error("Loading Error:", e);
  }
}

loadData();

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

window.goMenu = () => showScreen('menu');

window.openLearn = () => {
  const list = document.getElementById("formulaList");
  list.innerHTML = formulas.map(f => `<div>${f.lhs} = ${f.rhs}</div>`).join("");
  showScreen('learn');
};

window.startGame = () => {
  if(formulas.length === 0) return alert("Wait for data to load!");
  score = 0;
  chances = 3;
  showScreen('game');
  nextQuestion();
};

function nextQuestion() {
  current = formulas[Math.floor(Math.random() * formulas.length)];
  document.getElementById("question").innerText = `${current.lhs} = ?`;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
  updateStats();
}

function updateStats() {
  document.getElementById("lives").innerText = `Score: ${score} | Lives: ${"❤️".repeat(chances)}`;
}

window.checkAnswer = () => {
  const user = document.getElementById("answer").value;
  if (!user) return;

  if (isMathEqual(user, current.rhs)) {
    score++;
    document.getElementById("feedback").innerText = "Correct! ✨";
    setTimeout(nextQuestion, 1000);
  } else {
    chances--;
    document.getElementById("feedback").innerText = roasts[Math.floor(Math.random() * roasts.length)];
    if (chances <= 0) gameOver();
  }
  updateStats();
};

function gameOver() {
  showScreen('lose');
  document.getElementById("roast").innerText = roasts[Math.floor(Math.random() * roasts.length)];
}

function normalize(expr) {
  return expr.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2");
}

function isMathEqual(u, a) {
  try {
    const uN = normalize(u);
    const aN = normalize(a);
    if (nerdamer(uN).equals(aN)) return true;
    
    // Numeric fallback
    const val = 1.5; 
    const uv = Number(nerdamer(uN, {x:val, a:val, b:val}).evaluate().text());
    const av = Number(nerdamer(aN, {x:val, a:val, b:val}).evaluate().text());
    return Math.abs(uv - av) < 0.001;
  } catch (e) { return false; }
}

window.addInput = (v) => { document.getElementById("answer").value += v; };
window.backspace = () => { 
  let val = document.getElementById("answer").value;
  document.getElementById("answer").value = val.slice(0, -1);
};
