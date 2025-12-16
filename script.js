let formulas = [];
let roasts = [];
let current = null;
let chances = 3;
let score = 0;

/* ---------- LOAD FILES ---------- */

async function loadFiles() {
  const fRes = await fetch("maths.txt");
  const fText = await fRes.text();

  formulas = fText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.includes("="))
    .map(l => {
      const p = l.split("=");
      return {
        lhs: p[0].trim(),
        rhs: p.slice(1).join("=").trim()
      };
    });

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
  document.querySelectorAll(".screen")
    .forEach(s => s.classList.remove("active"));
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
  document.getElementById("question").innerText =
    `${current.lhs} = ?`;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
  updateStats();
}

function checkAnswer() {
  const rawUser = document.getElementById("answer").value.trim();
  if (!rawUser) return;

  const user = normalize(rawUser);
  const correct = normalize(current.rhs);

  // HARD SAFETY: power vs argument mismatch
  if (isDangerousMismatch(user, correct)) {
    chances--;
    document.getElementById("feedback").innerText =
      "Wrong concept. Think again.";
    updateStats();
    return;
  }

  const userSorted =
    sortProduct(sortSum(user));
  const correctSorted =
    sortProduct(sortSum(correct));

  if (userSorted === correctSorted) {
    score++;
    document.getElementById("feedback").innerText =
      "Correct. Algebra approves. Barely.";
    setTimeout(nextQuestion, 1200);
  } else {
    chances--;
    if (chances > 0) {
      document.getElementById("feedback").innerText =
        randomRoast() + ` | Chances left: ${chances}`;
    } else {
      show("lose");
      document.getElementById("roast").innerText =
        `Correct answer:\n${current.lhs} = ${current.rhs}\n\n` +
        randomRoast();
    }
  }

  updateStats();
}

/* ---------- NORMALIZATION ---------- */

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/π/g, "pi")

    // sinx → sin(x)
    .replace(/(sin|cos|tan)([a-z])/g, "$1($2)")

    // implicit multiplication
    .replace(/([a-z0-9])([a-z])/g, "$1*$2")
    .replace(/([a-z0-9])\(/g, "$1*(")
    .replace(/\)([a-z0-9])/g, ")*$1");
}

/* ---------- SAFETY CHECK ---------- */

function isDangerousMismatch(a, b) {
  const power = /\^[0-9]/;
  const argument = /\([^)]+\)/;

  return (
    power.test(a) !== power.test(b) &&
    argument.test(a) !== argument.test(b)
  );
}

/* ---------- ORDER HANDLING ---------- */

function sortSum(expr) {
  return expr
    .split(/(?=[+-])/g)
    .sort()
    .join("");
}

function sortProduct(expr) {
  return expr
    .split("*")
    .sort()
    .join("*");
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
  if (
    e.key === "Enter" &&
    document.getElementById("game").classList.contains("active")
  ) {
    checkAnswer();
  }
});
