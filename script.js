const questions = [
  {
    question: "यदि 2x + 4 = 10, तो x का मान क्या होगा?",
    options: ["2", "3", "4", "5"],
    answer: 1,
    hint: "पहले 4 को दूसरी तरफ ले जाओ।",
    explanation: "2x + 4 = 10\n2x = 10 - 4\n2x = 6\nx = 3",
    source: "NCERT-based Practice"
  },
  {
    question: "एक त्रिभुज के तीनों कोणों का योग कितना होता है?",
    options: ["90°", "180°", "270°", "360°"],
    answer: 1,
    hint: "यह ज्यामिति का एक मूल नियम है।",
    explanation: "किसी भी त्रिभुज के तीनों आंतरिक कोणों का योग 180° होता है।",
    source: "NCERT-based Practice"
  },
  {
    question: "5, 10, 15, 20, अगली संख्या क्या होगी?",
    options: ["22", "24", "25", "30"],
    answer: 2,
    hint: "हर बार 5 जोड़ रहे हैं।",
    explanation: "यह एक समानांतर श्रेणी है। हर पद में 5 जुड़ रहा है। इसलिए अगला पद 25 है।",
    source: "NCERT-based Practice"
  }
];

let current = 0;
let time = 30;
let timer = null;
let score = 0;
let answered = false;
let usedQuestions = [];

let xp = Number(localStorage.getItem("jarvisXP")) || 0;
let streak = Number(localStorage.getItem("jarvisStreak")) || 1;
let total = Number(localStorage.getItem("jarvisTotal")) || 0;
let correct = Number(localStorage.getItem("jarvisCorrect")) || 0;

const $ = id => document.getElementById(id);

function updateStats() {
  $("xp").textContent = xp;
  $("streak").textContent = streak;
  $("total").textContent = total;
  $("correct").textContent = correct;
  $("accuracy").textContent =
    total ? Math.round(correct / total * 100) + "%" : "0%";

  localStorage.setItem("jarvisXP", xp);
  localStorage.setItem("jarvisStreak", streak);
  localStorage.setItem("jarvisTotal", total);
  localStorage.setItem("jarvisCorrect", correct);
}

function startQuiz() {
  const classValue = $("classSelect").value;
  const subject = $("subjectSelect").value;

  if (!classValue || !subject) {
    alert("Please select your class and subject first!");
    return;
  }

  if (subject !== "Mathematics" || classValue !== "10") {
    alert("Is class aur subject ka verified question bank abhi Coming Soon hai.");
    return;
  }

  current = 0;
  score = 0;
  usedQuestions = [];

  $("quiz").hidden = false;
  $("quiz").scrollIntoView({ behavior: "smooth" });

  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  answered = false;

  if (usedQuestions.length === questions.length) {
    finishQuiz();
    return;
  }

  let available = questions
    .map((q, i) => i)
    .filter(i => !usedQuestions.includes(i));

  let index = available[Math.floor(Math.random() * available.length)];
  usedQuestions.push(index);
  current = index;

  const q = questions[index];

  $("question").textContent = q.question;
  $("questionNumber").textContent =
    `Question ${usedQuestions.length} / ${questions.length}`;

  $("feedback").textContent = "";
  $("nextBtn").hidden = true;
  $("progressBar").style.width =
    (usedQuestions.length / questions.length * 100) + "%";

  $("options").innerHTML = "";

  q.options.forEach((option, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = `${String.fromCharCode(65 + i)}. ${option}`;
    btn.onclick = () => checkAnswer(i);
    $("options").appendChild(btn);
  });

  time = 30;
  $("timer").textContent = time;

  timer = setInterval(() => {
    time--;
    $("timer").textContent = time;

    if (time <= 0) {
      clearInterval(timer);
      checkAnswer(-1);
    }
  }, 1000);
}

function checkAnswer(selected) {
  if (answered) return;

  answered = true;
  clearInterval(timer);

  const q = questions[current];
  const buttons = document.querySelectorAll(".option");

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add("correct");
    if (i === selected && selected !== q.answer)
      btn.classList.add("wrong");
  });

  total++;

  if (selected === q.answer) {
    correct++;
    xp += 10;
    score += 10;
    $("feedback").textContent = "✅ Correct! +10 XP";
  } else if (selected === -1) {
    $("feedback").textContent =
      `⏰ Time's up! Correct answer: ${q.options[q.answer]}`;
  } else {
    $("feedback").textContent =
      `❌ Incorrect! Correct answer: ${q.options[q.answer]}`;
  }

  updateStats();
  $("nextBtn").hidden = false;
  $("nextBtn").textContent =
    usedQuestions.length === questions.length
      ? "FINISH QUIZ"
      : "NEXT QUESTION →";
}

function nextQuestion() {
  if (usedQuestions.length === questions.length) {
    finishQuiz();
  } else {
    showQuestion();
  }
}

function showHint() {
  $("feedback").textContent = "💡 Hint: " + questions[current].hint;
}

function explain() {
  $("feedback").textContent =
    "📖 " + questions[current].explanation;
}

function finishQuiz() {
  clearInterval(timer);
  $("question").textContent = "🎉 Quiz Completed!";
  $("options").innerHTML = "";
  $("feedback").textContent =
    `Your score: ${score} XP. Great effort!`;
  $("questionNumber").textContent = "RESULT";
  $("nextBtn").hidden = true;
}

updateStats();
