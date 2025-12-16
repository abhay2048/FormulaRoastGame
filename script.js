let formulas = [];
let current = null;
let score = 0;
let chances = 3;

/* ---------- LOAD DATA ---------- */

async function loadData() {
  const f = await fetch("maths.txt");
  const r = await fetch("roast.txt");

  formulas = (await f.text())
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && l.includes("="))
    .map(l => {
      const [lhs, ...rhs] = l.split("=");
      return { lhs: lhs.trim(), rhs: rhs.join("=").trim() };
    });

  window.roasts = (await r.text())
    .split("\n")
    .map(l => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  nextQuestion();
}

loadData();

/* ---------- GAME ---------- */

function nextQuestion() {
  current = formulas[Math.floor(Math.random() * formulas.length)];
  document.getElementById("question").innerText = `${current.lhs} = ?`;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
  updateStats();
}

function checkAnswer() {
  const user = document.getElementById("answer").value;
  if (!user) return;

  if (isMathEqual(user, current.rhs)) {
    score++;
    document.getElementById("feedback").innerText = "Correct.";
    setTimeout(nextQuestion, 1000);
  } else {
    chances--;
    document.getElementById("feedback").innerText =
      roasts[Math.floor(Math.random() * roasts.length)];
    if (chances === 0) gameOver();
  }
  updateStats();
}

/* ---------- MATH CORE ---------- */

function normalize(expr) {
  return expr
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/sqrt(\d+|\w+)/g, "sqrt($1)");
}

function isMathEqual(u, a) {
  try {
    if (nerdamer(normalize(u)).equals(normalize(a))) {
      return numericCheck(u, a);
    }
  } catch {}
  return numericCheck(u, a);
}

function numericCheck(u, a) {
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 5 + 0.5;
    try {
      const uv = Number(nerdamer(normalize(u), { x }).evaluate().text());
      const av = Number(nerdamer(normalize(a), { x }).evaluate().text());
      if (Math.abs(uv - av) > 1e-6) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/* ---------- UI ---------- */

function updateStats() {
  document.getElementById("lives").innerText =
    `Score: ${score} | Lives: ${"❤️".repeat(chances)}`;
}

function gameOver() {
  document.getElementById("question").innerText =
    `Game Over\n${current.lhs} = ${current.rhs}`;
}
