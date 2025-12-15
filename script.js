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
  document.getElementById("keyboard").innerHTML = ""; // Clear keyboard on menu screen
  document.getElementById("answer").style.display = "none"; // Hide input on menu

  setText("Do you want to learn or jump straight into the test?");
  showButtons([
    { text: "Learn", action: showLearning },
    { text: "Test", action: startTest }
  ]);
}

/* ---------------- LEARNING MODE ---------------- */

function showLearning() {
  mode = "learn";
  document.getElementById("answer").style.display = "none"; // Hide input
  document.getElementById("keyboard").innerHTML = ""; // Clear keyboard
  setText("Formula Sheet"); 
  
  let content = "<ul>";

  formulas.forEach(f => {
    content += `<li><b>${f.lhs}</b> = ${f.rhs}</li>`;
  });

  content += "</ul>";
  document.getElementById("content").innerHTML = content;

  showButtons([
    { text: "Start Test", action: startTest },
    { text: "Menu", action: startIntro } 
  ]);
}

/* ---------------- TEST MODE ---------------- */

function startTest() {
  mode = "test";
  chances = 3;
  score = 0;
  // Clear the formula list area
  document.getElementById("content").innerHTML = ""; 
  createKeyboard(); // Initialize the special keyboard
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
  
  // Dynamically show the submit and quit buttons
  showButtons([
    { text: "Submit", action: submitAnswer },
    { text: "Quit", action: startIntro } 
  ]);
}

/* ---------------- SUBMIT ANSWER ---------------- */

function submitAnswer() {
  let user = document.getElementById("answer").value.trim();

  if (!user || mode !== "test") return; 

  // --- Lineancy Implementation ---
  // A helper to apply additional, formula-specific replacements (like exponents and multiplication)
  // This logic is applied BEFORE calling normalize() to achieve lineancy 
  // without modifying the normalize function itself.
  const applyLineancy = (s) => s
      .replace(/(\^2|\²)/g, "2") // Convert exponents to number 2 (e.g., sin^2 to sin2)
      .replace(/(\^3|\³)/g, "3") // Convert exponents to number 3
      .replace(/\*|⋅/g, ""); // Remove multiplication symbols (a*b and a⋅b become ab)

  const userPrepped = applyLineancy(user);
  const correctPrepped = applyLineancy(current.rhs);

  // Compare the prepped strings using the original normalize function
  if (normalize(userPrepped) === normalize(correctPrepped)) {
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
      document.getElementById("keyboard").innerHTML = ""; // Clear keyboard
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

// USER REQUEST: DO NOT CHANGE THIS BLOCK
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

/* ---------------- KEYBOARD INTEGRATION ---------------- */

const specialKeys = [
  'π', 'θ', 'sin', 'cos', 'tan', 'cot',
  '²', '³', '√', 'α', 'β', '∆',
  '/', '*', '+', '-', '='
];

function createKeyboard() {
  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = "";

  specialKeys.forEach(key => {
    const btn = document.createElement("button");
    btn.innerText = key;
    btn.onclick = () => insertKey(key);
    keyboard.appendChild(btn);
  });
}

function insertKey(char) {
  const input = document.getElementById("answer");
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const value = input.value;
  
  // Logic to insert the key at the cursor position
  input.value = value.substring(0, start) + char + value.substring(end);
  input.focus();
  
  // Set cursor position after the inserted character
  const newPos = start + char.length;
  input.setSelectionRange(newPos, newPos);
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
