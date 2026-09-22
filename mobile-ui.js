/* VIIPE telefoni navigeerimine ja väike ülesannete vaade. */
(() => {
  const pathScreen = document.getElementById("pathScreen");
  const gameScreen = document.getElementById("gameScreen");
  const completeScreen = document.getElementById("completeScreen");
  const onboardingScreen = document.getElementById("onboardingScreen");
  const loginScreen = document.getElementById("loginScreen");
  const goalScreen = document.getElementById("goalScreen");
  const profileScreen = document.getElementById("profileScreen");

  if (!pathScreen || !gameScreen || !completeScreen || !profileScreen) return;

  const mobileQuery = window.matchMedia("(max-width: 999px)");
  const allScreens = {
    onboarding: onboardingScreen,
    login: loginScreen,
    goal: goalScreen,
    path: pathScreen,
    profile: profileScreen,
    game: gameScreen,
    complete: completeScreen
  };

  const nav = document.createElement("nav");
  nav.className = "viipe-mobile-nav";
  nav.setAttribute("aria-label", "VIIPE telefoni menüü");
  nav.innerHTML = `
    <button type="button" class="is-active" data-mobile-action="learn"><span>⌂</span><span>Õpi</span></button>
    <button type="button" data-mobile-action="practice"><span>✦</span><span>Harjuta</span></button>
    <button type="button" data-mobile-action="quests"><span>✓</span><span>Ülesanded</span></button>
    <button type="button" data-mobile-action="profile"><span>◉</span><span>Profiil</span></button>
  `;

  const sheet = document.createElement("section");
  sheet.className = "viipe-mobile-sheet";
  sheet.hidden = true;
  sheet.setAttribute("aria-label", "Tänased ülesanded");
  sheet.innerHTML = `
    <div class="mobile-sheet-card" role="dialog" aria-modal="true" aria-labelledby="mobileQuestTitle">
      <div class="mobile-sheet-handle" aria-hidden="true"></div>
      <p class="eyebrow purple">TÄNANE ÜLESANNE</p>
      <h2 id="mobileQuestTitle">Kolm õiget vastust</h2>
      <p>Harjuta täna kolm viibet ja kogu lisaks 20 XP.</p>
      <div class="mobile-quest-progress" aria-label="Ülesande edenemine"><span></span></div>
      <div class="mobile-quest-meta"><span id="mobileQuestCount">0 / 3 vastust</span><span>+20 XP</span></div>
      <button class="mobile-sheet-button" type="button" data-mobile-action="start-quest">Alusta harjutust →</button>
      <button class="mobile-sheet-close" type="button" data-mobile-action="close-quest">Sulge</button>
    </div>
  `;

  document.body.append(nav, sheet);

  const getXp = () => Number(document.getElementById("xp")?.textContent || 0);
  const getQuestAnswers = () => Math.min(3, Math.floor(getXp() / 10));

  const updateQuest = () => {
    const count = getQuestAnswers();
    const progress = sheet.querySelector(".mobile-quest-progress span");
    const countText = sheet.querySelector("#mobileQuestCount");
    if (progress) progress.style.width = `${(count / 3) * 100}%`;
    if (countText) countText.textContent = `${count} / 3 vastust`;
  };

  const setMobileScreen = (screenName) => {
    Object.entries(allScreens).forEach(([name, screen]) => {
      if (screen) screen.hidden = name !== screenName;
    });
    if (screenName === "path" && typeof window.renderPath === "function") {
      window.renderPath();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    sync();
  };

  const updateProfile = () => {
    const name = localStorage.getItem("viipeName") || "õppija";
    const goal = localStorage.getItem("viipeGoal") || "Õppida viipekeelt";
    const unlocked = Number(localStorage.getItem("viipeUnlockedLevel")) || 0;
    const nameOutput = document.getElementById("profileNameOutput");
    const goalOutput = document.getElementById("profileGoalOutput");
    const xpOutput = document.getElementById("profileXpOutput");
    const levelOutput = document.getElementById("profileLevelOutput");

    if (nameOutput) nameOutput.textContent = name;
    if (goalOutput) goalOutput.textContent = goal;
    if (xpOutput) xpOutput.textContent = String(getXp());
    if (levelOutput) levelOutput.textContent = unlocked >= 1 ? "Tase 2 avatud" : "Tase 1 õppimisel";
  };

  const openPractice = () => {
    sheet.hidden = true;
    const availableLevels = Array.from(document.querySelectorAll(".level-button:not(:disabled)"));
    const level = availableLevels.at(-1) || availableLevels[0];
    if (level) level.click();
  };

  const setActiveNav = (action) => {
    nav.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mobileAction === action);
    });
  };

  const sync = () => {
    const showNav = mobileQuery.matches && !pathScreen.hidden;
    nav.hidden = !showNav;
    if (!showNav) sheet.hidden = true;
    if (showNav) setActiveNav("learn");
    updateQuest();
  };

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mobile-action]");
    if (!button) return;
    const action = button.dataset.mobileAction;

    if (action === "learn") {
      setMobileScreen("path");
      setActiveNav(action);
    }
    if (action === "practice") openPractice();
    if (action === "quests") {
      updateQuest();
      sheet.hidden = false;
      setActiveNav(action);
    }
    if (action === "profile") {
      updateProfile();
      setMobileScreen("profile");
    }
  });

  sheet.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mobile-action]");
    if (button?.dataset.mobileAction === "start-quest") openPractice();
    if (button?.dataset.mobileAction === "close-quest") {
      sheet.hidden = true;
      setActiveNav("learn");
    }
    if (event.target === sheet) {
      sheet.hidden = true;
      setActiveNav("learn");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") sheet.hidden = true;
  });

  Object.values(allScreens).forEach((screen) => {
    if (!screen) return;
    new MutationObserver(sync).observe(screen, {
      attributes: true,
      attributeFilter: ["hidden"]
    });
  });

  const xp = document.getElementById("xp");
  if (xp) {
    new MutationObserver(updateQuest).observe(xp, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  mobileQuery.addEventListener("change", sync);
  window.addEventListener("resize", sync);
  sync();
})();
