const levels = [
  {
    name: "Tase 1 — Tervitused",
    description: "Õpi viisakad põhisõnad.",
    words: [
      {
        word: "Tere",
        video: "assets/videos/tere.mov",
        choices: ["Tere", "Aitäh", "Palun"]
      },
      {
        word: "Aitäh",
        video: "assets/videos/aitah.mov",
        choices: ["Head aega", "Aitäh", "Vabandust"]
      },
      {
        word: "Head aega",
        video: "assets/videos/head-aega.mov",
        choices: ["Tere", "Head aega", "Hästi"]
      }
    ]
  },
  {
    name: "Tase 2 — Tutvumine",
    description: "Õpi ennast ja teisi tutvustama.",
    words: [
      {
  word: "Minu nimi on",
  video: "assets/videos/minunimion.mov",
  choices: ["Minu nimi on", "Aitäh", "Palun"]
},
      
      {
  word: "Kuidas sul läheb?",
  video: "assets/videos/kuidassullaheb.mov",
  choices: ["Head aega", "Kuidas sul läheb?", "Tere"]
},

      {
  word: "Hästi",
  video: "assets/videos/hasti.mov",
  choices: ["Vabandust", "Hästi", "Aitäh"]
},
    ]
  },
  {
    name: "Tase 3 — Igapäevased sõnad",
    description: "See tase avaneb peagi.",
    words: []
  }
];


const questions = {
  Tere: "Mida ütled, kui kohtad kedagi?",
  Aitäh: "Mida ütled, kui keegi aitab sind?",
  "Head aega": "Mida ütled, kui lahkud kellegi juurest?",
  "Minu nimi on": "Kuidas tutvustad ennast?",
  "Kuidas sul läheb?": "Mida küsid, kui tahad teada, kuidas teisel inimesel läheb?",
  Hästi: "Kuidas vastad, kui sul läheb hästi?"
};

const answerHints = {
  Tere: "„Tere” kasutatakse siis, kui kohtad kedagi.",
  Aitäh: "„Aitäh” kasutatakse siis, kui keegi aitab sind.",
  "Head aega": "„Head aega” kasutatakse siis, kui lahkud.",
  "Minu nimi on": "Selle lausega alustad enda tutvustamist.",
  "Kuidas sul läheb?": "Seda küsid, kui tahad teada, kuidas teisel inimesel läheb.",
  Hästi: "„Hästi” on vastus küsimusele „Kuidas sul läheb?”."
};

const pathScreen = document.getElementById("pathScreen");
const gameScreen = document.getElementById("gameScreen");
const completeScreen = document.getElementById("completeScreen");
const levelPath = document.getElementById("levelPath");
const xp = document.getElementById("xp");
const gameXp = document.getElementById("gameXp");
const levelName = document.getElementById("levelName");
const stepText = document.getElementById("stepText");
const progressFill = document.getElementById("progressFill");
const wordTitle = document.getElementById("wordTitle");
const wordDescription = document.getElementById("wordDescription");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const nextButton = document.getElementById("nextButton");
const backButton = document.getElementById("backButton");
const completeTitle = document.getElementById("completeTitle");
const completeText = document.getElementById("completeText");
const earnedXp = document.getElementById("earnedXp");
const unlockButton = document.getElementById("unlockButton");
const homeButton = document.getElementById("homeButton");
const signVideo = document.getElementById("signVideo");
const signPlaceholder = document.getElementById("signPlaceholder");

let unlockedLevel = Math.min(
  Number(localStorage.getItem("viipeUnlockedLevel")) || 0,
  1
);

let totalXp = Number(localStorage.getItem("viipeXp")) || 0;
let currentLevel = 0;
let currentStep = 0;
let answeredCorrectly = false;

function saveProgress() {
  localStorage.setItem("viipeUnlockedLevel", unlockedLevel);
  localStorage.setItem("viipeXp", totalXp);
}

function updateXp() {
  xp.textContent = totalXp;
  gameXp.textContent = totalXp;
}

function showScreen(screen) {
  const changeScreen = () => {
    pathScreen.hidden = screen !== "path";
    gameScreen.hidden = screen !== "game";
    completeScreen.hidden = screen !== "complete";
  };

  if (document.startViewTransition) {
    document.startViewTransition(changeScreen);
  } else {
    changeScreen();
  }
}

function renderPath() {
  levelPath.innerHTML = "";

  levels.forEach((level, index) => {
    const hasWords = level.words.length > 0;
    const isUnlocked = index <= unlockedLevel && hasWords;
    const isCompleted = index < unlockedLevel;

    const button = document.createElement("button");
    button.className = "level-button";
    button.disabled = !isUnlocked;

    let status = "Lukus";

    if (!hasWords) {
      status = "Peagi";
    } else if (isCompleted) {
      status = "Tehtud ✓";
    } else if (isUnlocked) {
      status = "Alusta →";
    }

    button.innerHTML = `
      <span class="level-icon">${isUnlocked ? index + 1 : "🔒"}</span>
      <span class="level-copy">
        <small>TASE ${index + 1}</small>
        <h3>${level.name.replace(`Tase ${index + 1} — `, "")}</h3>
        <p>${level.description}</p>
      </span>
      <span class="level-status">${status}</span>
    `;

    if (isUnlocked) {
      button.addEventListener("click", () => openLevel(index));
    }

    levelPath.appendChild(button);
  });
}

function openLevel(levelIndex) {
  currentLevel = levelIndex;
  currentStep = 0;
  showScreen("game");
  showQuestion();
}

function loadVideo(lesson) {
  if (!signVideo || !signPlaceholder) return;

  if (lesson.video) {
    const videoPaths = [
      lesson.video,
      lesson.video.replace("assets/videos/", "assets/")
    ].filter((path, index, paths) => path && paths.indexOf(path) === index);
    let pathIndex = 0;

    const useVideoPath = () => {
      signVideo.src = videoPaths[pathIndex];
      signVideo.load();
      signVideo.play().catch(() => {});
    };

    signPlaceholder.hidden = true;
    signVideo.hidden = false;
    signVideo.muted = true;
    signVideo.loop = true;
    signVideo.onerror = () => {
      pathIndex += 1;
      if (pathIndex < videoPaths.length) useVideoPath();
    };
    useVideoPath();
  } else {
    signVideo.onerror = null;
    signVideo.pause();
    signVideo.removeAttribute("src");
    signVideo.load();
    signVideo.hidden = true;
    signPlaceholder.hidden = false;
  }
}

function showQuestion() {
  const level = levels[currentLevel];
  const lesson = level.words[currentStep];

  answeredCorrectly = false;
  loadVideo(lesson);

  levelName.textContent = level.name;
  stepText.textContent = `${currentStep + 1} / ${level.words.length}`;
  progressFill.style.width = `${((currentStep + 1) / level.words.length) * 100}%`;

  wordTitle.textContent = questions[lesson.word];
  wordDescription.textContent =
    "Vaata viipevideot ja vali vastus, mis sobib selle olukorraga.";

  answers.innerHTML = "";
  feedback.textContent = "";
  nextButton.disabled = true;
  nextButton.textContent =
    currentStep === level.words.length - 1
      ? "Lõpeta tase →"
      : "Järgmine sõna →";

  lesson.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.textContent = choice;

    button.addEventListener("click", () => {
      if (answeredCorrectly) return;

      document.querySelectorAll(".answer").forEach((answer) => {
        answer.classList.remove("correct", "incorrect");
      });

      if (choice === lesson.word) {
        answeredCorrectly = true;
        button.classList.add("correct");
        feedback.textContent = "Õige! +10 XP";
        feedback.style.color = "#20c77a";
        nextButton.disabled = false;

        totalXp += 10;
        updateXp();
        saveProgress();
      } else {
        button.classList.add("incorrect");
        feedback.textContent = `Proovi veel kord. ${answerHints[lesson.word]}`;
        feedback.style.color = "#ff6f78";
      }
    });

    answers.appendChild(button);
  });
}

function finishLevel() {
  if (currentLevel === 0) {
    unlockedLevel = 1;
    saveProgress();
  }

  completeTitle.textContent = `${levels[currentLevel].name} tehtud!`;
  earnedXp.textContent = levels[currentLevel].words.length * 10;

  if (currentLevel === 0) {
    completeText.textContent = "Tase 2 — Tutvumine on nüüd avatud.";
    unlockButton.textContent = "Ava tase 2 →";
  } else {
    completeText.textContent = "Väga tubli — uusi tasemeid lisame peagi.";
    unlockButton.textContent = "Tagasi õpirajale";
  }

  showScreen("complete");
}

nextButton.addEventListener("click", () => {
  if (!answeredCorrectly) return;

  if (currentStep < levels[currentLevel].words.length - 1) {
    currentStep += 1;
    showQuestion();
  } else {
    finishLevel();
  }
});

backButton.addEventListener("click", () => {
  showScreen("path");
  renderPath();
});

homeButton.addEventListener("click", () => {
  showScreen("path");
  renderPath();
});

unlockButton.addEventListener("click", () => {
  if (currentLevel === 0) {
    openLevel(1);
  } else {
    showScreen("path");
    renderPath();
  }
});

updateXp();
renderPath();

const quickCards = document.querySelectorAll(".quick-card");

quickCards[0]?.addEventListener("click", () => {
  openLevel(0);
});

quickCards[1]?.addEventListener("click", () => {
  if (unlockedLevel < 1) {
    alert("Lõpeta kõigepealt Tase 1. Siis avaneb Tase 2!");
    return;
  }

  openLevel(1);
});

quickCards[2]?.addEventListener("click", () => {
  renderProfile();
  showViipeScreen("profile");
});

quickCards[3]?.addEventListener("click", () => {
  showViipeScreen("login");
});
;const onboardingScreen = document.getElementById("onboardingScreen");
const goalScreen = document.getElementById("goalScreen");
const loginStart = document.getElementById("loginStart");
const registerStart = document.getElementById("registerStart");
const guestStart = document.getElementById("guestStart");
const onboardingBack = document.getElementById("onboardingBack");
const goalContinue = document.getElementById("goalContinue");
const goalOptions = document.querySelectorAll(".goal-option");

let selectedGoal = "";

function showScreen(screen) {
  const screens = {
    onboarding: onboardingScreen,
    goal: goalScreen,
    path: pathScreen,
    game: gameScreen,
    complete: completeScreen
  };

  const changeScreen = () => {
    Object.entries(screens).forEach(([name, element]) => {
      element.hidden = name !== screen;
    });
  };

  if (document.startViewTransition) {
    document.startViewTransition(changeScreen);
  } else {
    changeScreen();
  }
}

loginStart.addEventListener("click", () => showScreen("goal"));
registerStart.addEventListener("click", () => showScreen("goal"));
guestStart.addEventListener("click", () => {
  showScreen("path");
  renderPath();
});

onboardingBack.addEventListener("click", () => {
  showScreen("onboarding");
});

goalOptions.forEach((button) => {
  button.addEventListener("click", () => {
    goalOptions.forEach((option) => option.classList.remove("selected"));
    button.classList.add("selected");
    selectedGoal = button.dataset.goal;
    goalContinue.disabled = false;
  });
});

goalContinue.addEventListener("click", () => {
  localStorage.setItem("viipeGoal", selectedGoal);
  localStorage.setItem("viipeOnboardingDone", "true");
  showScreen("path");
});

const hasFinishedOnboarding =
  localStorage.getItem("viipeOnboardingDone") === "true";

showScreen(hasFinishedOnboarding ? "path" : "onboarding");

showScreen("onboarding");
const loginScreen = document.getElementById("loginScreen");
const profileScreen = document.getElementById("profileScreen");
const loginName = document.getElementById("loginName");
const loginSubmit = document.getElementById("loginSubmit");
const loginBack = document.getElementById("loginBack");
const profileBack = document.getElementById("profileBack");
const profileStart = document.getElementById("profileStart");
const profileNameOutput = document.getElementById("profileNameOutput");
const profileGoalOutput = document.getElementById("profileGoalOutput");
const profileXpOutput = document.getElementById("profileXpOutput");
const profileLevelOutput = document.getElementById("profileLevelOutput");

function showViipeScreen(screen) {
  const screens = {
    onboarding: onboardingScreen,
    login: loginScreen,
    goal: goalScreen,
    path: pathScreen,
    profile: profileScreen,
    game: gameScreen,
    complete: completeScreen
  };

  Object.entries(screens).forEach(([name, element]) => {
    element.hidden = name !== screen;
  });
}

function renderProfile() {
  profileNameOutput.textContent =
    localStorage.getItem("viipeName") || "õppija";

  profileGoalOutput.textContent =
    localStorage.getItem("viipeGoal") || "Õppida viipekeelt";

  profileXpOutput.textContent = totalXp;

  profileLevelOutput.textContent =
    unlockedLevel >= 1 ? "Tase 2 avatud" : "Tase 1 õppimisel";
}

loginSubmit.addEventListener("click", () => {
  const name = loginName.value.trim() || "õppija";
  localStorage.setItem("viipeName", name);
  showScreen("goal");
});

loginBack.addEventListener("click", () => {
  showScreen("onboarding");
});

profileBack.addEventListener("click", () => {
  showScreen("path");
});

profileStart.addEventListener("click", () => {
  showScreen("path");
});
