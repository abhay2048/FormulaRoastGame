let formulas = [];
let current = null;
let chances = 3;
let score = 0;
let mode = "test";

/* ---------------- LOAD FORMULAS ---------------- */

async function loadFormulas() {
  try {
    const res = await fetch("maths.txt");
    if (!res.ok) throw new Error("maths.txt not found or failed to load.");
    const text = await res.text();

    formulas = text
      .split(/\r?\n/) // handles LF and CRLF
      .map(l => l.trim())
      .filter(l => l && l.includes("="))
      .map(l => {
        const parts = l.split("=");
        const lhs = parts.shift().trim();
        const rhs = parts.join("=").trim();
        return { lhs, rhs };
      });

    startIntro();
  } catch (err) {
    alert("Error loading formulas: " + err.message);
    console.error(err);
  }
}

loadFormulas();

/* ---------------- INTRO ---------------- */

function startIntro() {
  setText("Do you want to learn or jump straight into the test?");
  showButtons([
    { text: "Learn", action: showLearning },
    { text: "Test", action: startTest }
  ]);
}

/* ---------------- LEARNING MODE ---------------- */

function showLearning() {
  mode = "learn";
  let content = "<h3>Formula Sheet</h3><ul>";

  formulas.forEach(f => {
    content += `<li><b>${f.lhs}</b> = ${f.rhs}</li>`;
  });

  content += "</ul>";
  document.getElementById("content").innerHTML = content;

  showButtons([
    { text: "Start Test", action: startTest }
  ]);
}

/* ---------------- TEST MODE ---------------- */

function startTest() {
  mode = "test";
  chances = 3;
  score = 0;
  updateStats();
  nextQuestion();
}

function nextQuestion() {
  current = formulas[Math.floor(Math.random() * formulas.length)];

  setText(`Complete this:\n\n${current.lhs} = ?`);
  document.getElementById("answer").value = "";
  updateStats();
}

/* ---------------- SUBMIT ANSWER ---------------- */

function submitAnswer() {
  const user = document.getElementById("answer").value.trim();
  if (!user) return;

  if (normalize(user) === normalize(current.rhs)) {
    score++;
    setText(getWinRoast());
    setTimeout(nextQuestion, 1200);
  } else {
    chances--;
    if (chances > 0) {
      setText(getFailRoast() + `\nChances left: ${chances}`);
    } else {
      setText(
        `You’re done.\nCorrect answer:\n${current.lhs} = ${current.rhs}\n\nDo you want to learn?`
      );
      showButtons([
        { text: "Learn", action: showLearning },
        { text: "Retry Test", action: startTest }
      ]);
    }
  }
  updateStats();
}

/* ---------------- UTILITIES ---------------- */

function normalize(str) {
  return str
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .replace(/√/g, "sqrt") // optional mapping for square roots
    .toLowerCase();
}

function setText(text) {
  document.getElementById("question").innerText = text;
}

function updateStats() {
  document.getElementById("stats").innerText =
    `Score: ${score} | Chances: ${chances}`;
}

function showButtons(buttons) {
  const box = document.getElementById("buttons");
  box.innerHTML = "";
  buttons.forEach(b => {
    const btn = document.createElement("button");
    btn.innerText = b.text;
    btn.onclick = b.action;
    box.appendChild(btn);
  });
}

/* ---------------- SARCASTIC ROAST ENGINE ---------------- */

const adjectives = ["bold", "tragic", "confident", "brave", "desperate"];
const verbs = ["typed", "guessed", "clicked", "entered", "pretended"];
const exclamations = ["Wow", "Hmm", "Oh really", "Yikes", "Look at that"];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWinRoast() {
  return `${randomElement(exclamations)}! That was ${randomElement(adjectives)} and correct.`;
}

function getFailRoast() {
  return `${randomElement(exclamations)}… you ${randomElement(verbs)} like a fool. Incorrect!`;
}

/* ---------------- KEYBOARD SUPPORT ---------------- */

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && mode === "test") submitAnswer();
});
