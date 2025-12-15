let formulas = [];
let current = null;
let chances = 3;
let score = 0;
let mode = "test";

/* ---------------- LOAD FORMULAS ---------------- */

async function loadFormulas() {
  const res = await fetch("maths.txt");
  const text = await res.text();

  formulas = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && l.includes("="))
    .map(l => {
      const parts = l.split("=");
      const lhs = parts.shift().trim();
      const rhs = parts.join("=").trim();
      return { lhs, rhs };
    });

  startIntro();
}

loadFormulas();

/* ---------------- INTRO ---------------- */

function startIntro() {
  // Clear any content from previous modes
  document.getElementById("content").innerHTML = ""; 
  
  setText("Do you want to learn or jump straight into the test?");
  showButtons([
    { text: "Learn", action: showLearning },
    { text: "Test", action: startTest }
  ]);
}

/* ---------------- LEARNING MODE ---------------- */

function showLearning() {
  mode = "learn";
  // Clear the question text area
  setText(""); 
  
  let content = "<h3>Formula Sheet</h3><ul>";

  formulas.forEach(f => {
    content += `<li><b>${f.lhs}</b> = ${f.rhs}</li>`;
  });

  content += "</ul>";
  document.getElementById("content").innerHTML = content;

  showButtons([
    { text: "Start Test", action: startTest },
    { text: "Menu", action: startIntro } // Added button to return to menu
  ]);
}

/* ---------------- TEST MODE ---------------- */

function startTest() {
  mode = "test";
  chances = 3;
  score = 0;
  // Clear the formula list area
  document.getElementById("content").innerHTML = ""; 
  nextQuestion();
}

function nextQuestion() {
  current = formulas[Math.floor(Math.random() * formulas.length)];
  
  // Ensure the answer input is visible and the cursor is focused
  document.getElementById("answer").style.display = "block";
  document.getElementById("answer").focus();

  setText(`Complete this:\n\n${current.lhs} = ?`);
  document.getElementById("answer").value = "";
  updateStats();
  
  // ADDED: Dynamically show the submit and quit buttons for the test
  showButtons([
    { text: "Submit", action: submitAnswer },
    { text: "Quit", action: startIntro }
  ]);
}

/* ---------------- SUBMIT ANSWER ---------------- */

function submitAnswer() {
  const user = document.getElementById("answer").value.trim();

  if (!user || mode !== "test") return; // Added mode check

  if (normalize(user) === normalize(current.rhs)) {
    score++;
    setText(getWinRoast());
    setTimeout(nextQuestion, 1200);
  } else {
    chances--;
    if (chances > 0) {
      setText(getFailRoast() + `\nChances left: ${chances}`);
      // Re-display the submit/quit buttons after the toast
      showButtons([
        { text: "Submit", action: submitAnswer },
        { text: "Quit", action: startIntro }
      ]);
    } else {
      // Game Over state
      document.getElementById("answer").style.display = "none";
      setText(
        `You’re done.\nCorrect answer:\n${current.lhs} = ${current.rhs}\n\nDo you want to learn?`
      );
      showButtons([
        { text: "Learn", action: showLearning },
        { text: "Retry Test", action: startTest },
        { text: "Menu", action: startIntro }
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

/* ---------------- ROAST ENGINE ---------------- */

// Retaining original win roasts
const winRoasts = [
  "Oh wow. A correct answer. Mark the calendar.",
  "Look at you pretending you studied.",
  "That was right. Don’t let it get to your head.",
  "Even a broken clock is right sometimes.",
  "I’m shocked. Genuinely."
];

// Retaining original fail roasts
const failRoasts = [
  "That answer was confident… and wrong.",
  "You typed that like it owed you money.",
  "Interesting choice. Incorrect, but interesting.",
  "I admire the bravery. Not the accuracy.",
  "Math just sighed."
];

function getWinRoast() {
  return winRoasts[Math.floor(Math.random() * winRoasts.length)];
}

function getFailRoast() {
  return failRoasts[Math.floor(Math.random() * failRoasts.length)];
}

/* ---------------- KEYBOARD SUPPORT ---------------- */

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && mode === "test") submitAnswer();
});
