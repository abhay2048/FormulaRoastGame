let formulas = [];
let roasts = [];
let current = null;
let chances = 3;
let score = 0;

/* ---------- LOAD FILES ---------- */

async function loadFiles() {
  // load formulas
  const fRes = await fetch("maths.txt");
  const fText = await fRes.text();
  formulas = fText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.includes("="))
    .map(l => {
      const p = l.split("=");
      return { lhs: p[0].trim(), rhs: p.slice(1).join("=").trim() };
    });

  // load roasts
  const rRes = await fetch("roast.txt");
  const rText = await rRes.text();
  roasts = rText
    .split("\n")
    .map(r => r.trim())
    .filter(r => r);

  buildKeyboard();
}

loadFiles();

/* ---------- SCREEN CONTROL ---------- */

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goMenu() {
  show("menu");
}

function openLearn() {
  show("learn");
  const box = document.getElementById("formulaList");
  box.innerHTML = "";
  formulas.forEach(f => {
    box.innerHTML += `<div><b>${f.lhs}</b> = ${f.rhs}</div>`;
  });
}

function startGame() {
  chances = 3;
  score = 0;
  show("game");
  nextQuestion();
}

/* ---------- GAME LOGIC ---------- */

function nextQuestion() {
  current = formulas[Math.floor(Math.random() * formulas.length)];
  document.getElementById("question").innerText = `${current.lhs} = ?`;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
  updateStats();
}

function checkAnswer() {
  const user = document.getElementById("answer").value.trim();
  if (!user) return;

  if (normalize(user) === normalize(current.rhs)) {
    score++;
    document.getElementById("feedback").innerText = "Correct. Don’t get cocky.";
    setTimeout(nextQuestion, 1200);
  } else {
    chances--;
    if (chances > 0) {
      document.getElementById("feedback").innerText =
        randomRoast() + ` | Chances left: ${chances}`;
    } else {
      show("lose");
      document.getElementById("roast").innerText =
        `Correct answer:\n${current.lhs} = ${current.rhs}\n\n` + randomRoast();
    }
  }
  updateStats();
}

/* ---------- NORMALIZATION ---------- */

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .replace(/π/g, "pi");
}

/* ---------- STATS ---------- */

function updateStats() {
  document.getElementById("stats").innerText =
    `Score: ${score} | Chances: ${chances}`;
}

/* ---------- ROAST ---------- */

function randomRoast() {
  return roasts[Math.floor(Math.random() * roasts.length)];
}

/* ---------- KEYBOARD ---------- */

function buildKeyboard() {
  const keys = [
    "sin", "cos", "tan", "π", "θ", "(",
    ")", "^", "/", "*", "+", "-",
    "√", "log", "ln", "e", "=", "⌫"
  ];

  const kb = document.getElementById("keyboard");
  kb.innerHTML = "";

  keys.forEach(k => {
    const b = document.createElement("button");
    b.innerText = k;
    b.onclick = () => {
      const input = document.getElementById("answer");
      if (k === "⌫") input.value = input.value.slice(0, -1);
      else input.value += k;
      input.focus();
    };
    kb.appendChild(b);
  });
}

/* ---------- ENTER ---------- */

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.getElementById("game").classList.contains("active")) {
    checkAnswer();
  }
});
