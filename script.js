let formulas = [];
let roasts = [];
let current = null;
let score = 0;
let chances = 3;

async function loadData() {
  try {
    const fResponse = await fetch("maths.txt");
    const rResponse = await fetch("roast.txt");
    
    const fText = await fResponse.text();
    const rText = await rResponse.text();

    // Clean and parse [cite: 1, 2]
    formulas = fText.split("\n")
      .map(l => l.replace(/\/g, "").trim())
      .filter(l => l.includes("="))
      .map(l => {
        const [lhs, ...rhs] = l.split("=");
        return { lhs: lhs.trim(), rhs: rhs.join("=").trim() };
      });

    // Clean roasts [cite: 3, 4]
    roasts = rText.split("\n")
      .map(l => l.replace(/\/g, "").trim())
      .filter(l => l.length > 5);

  } catch (err) {
    console.error("Initialization error:", err);
  }
}

loadData();

/* --- NAVIGATION --- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goMenu() { showScreen('menu'); }

function openLearn() {
  const list = document.getElementById("formulaList");
  list.innerHTML = formulas.map(f => `<div style="padding:8px; border-bottom:1px solid #222">${f.lhs} = ${f.rhs}</div>`).join("");
  showScreen('learn');
}

function startGame() {
  score = 0;
  chances = 3;
  showScreen('game');
  nextQuestion();
}

/* --- GAMEPLAY --- */
function nextQuestion() {
  current = formulas[Math.floor(Math.random() * formulas.length)];
  document.getElementById("question").innerText = `${current.lhs} = ?`;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
  updateStats();
}

function updateStats() {
  document.getElementById("lives").innerHTML = 
    `<span style="color:#666">SCORE: ${score}</span> &nbsp;&nbsp; ${"❤️".repeat(chances)}`;
}

function checkAnswer() {
  const user = document.getElementById("answer").value;
  if (!user) return;

  if (isMathEqual(user, current.rhs)) {
    score++;
    document.getElementById("feedback").style.color = "var(--primary-glow)";
    document.getElementById("feedback").innerText = "CORRECT";
    setTimeout(nextQuestion, 800);
  } else {
    chances--;
    const gameScreen = document.getElementById("game");
    gameScreen.style.animation = "shake 0.3s";
    setTimeout(() => gameScreen.style.animation = "", 300);
    
    document.getElementById("feedback").style.color = "var(--error)";
    document.getElementById("feedback").innerText = roasts[Math.floor(Math.random() * roasts.length)];
    
    if (chances <= 0) setTimeout(gameOver, 1000);
  }
  updateStats();
}

function gameOver() {
  showScreen('lose');
  document.getElementById("roast").innerText = roasts[Math.floor(Math.random() * roasts.length)];
}

/* --- MATH ENGINE --- */
function normalize(e) {
  return e.toLowerCase().replace(/\s+/g, "").replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/²/g, "^2").replace(/³/g, "^3");
}

function isMathEqual(u, a) {
  const uN = normalize(u);
  const aN = normalize(a);
  try {
    if (nerdamer(uN).equals(aN)) return true;
  } catch (e) {}
  
  // Numeric Check for variables [cite: 1, 2]
  for (let i = 0; i < 5; i++) {
    const val = Math.random() * 5 + 0.1;
    try {
      const scope = { x: val, a: val, b: val };
      const uv = Number(nerdamer(uN, scope).evaluate().text());
      const av = Number(nerdamer(aN, scope).evaluate().text());
      if (Math.abs(uv - av) > 1e-6) return false;
    } catch { return false; }
  }
  return true;
}

/* --- KEYBOARD --- */
function addInput(v) {
  const i = document.getElementById("answer");
  i.value += v;
  i.focus();
}

function backspace() {
  const i = document.getElementById("answer");
  i.value = i.value.slice(0, -1);
  i.focus();
}
