/* VIIPE: konto teekond, hele/tume režiim ja arvuti kõrvalpaneel */
(() => {
  const byId = (id) => document.getElementById(id);
  const screens = {
    onboarding: byId("onboardingScreen"),
    login: byId("loginScreen"),
    goal: byId("goalScreen"),
    path: byId("pathScreen"),
    profile: byId("profileScreen"),
    game: byId("gameScreen"),
    complete: byId("completeScreen")
  };

  if (Object.values(screens).some((screen) => !screen)) return;

  const show = (screenName) => {
    Object.entries(screens).forEach(([name, screen]) => {
      screen.hidden = name !== screenName;
    });
  };

  const renderPathSafe = () => {
    if (typeof renderPath === "function") renderPath();
  };

  const getAccount = () => ({
    name: localStorage.getItem("viipeName") || "",
    goal: localStorage.getItem("viipeGoal") || "",
    complete: localStorage.getItem("viipeOnboardingDone") === "true"
  });

  const hasAccount = () => {
    const account = getAccount();
    return Boolean(account.name && account.complete);
  };

  const goToPath = () => {
    show("path");
    renderPathSafe();
    updateRail();
  };

  const loginStart = byId("loginStart");
  const registerStart = byId("registerStart");
  const guestStart = byId("guestStart");
  const loginScreen = byId("loginScreen");
  const loginName = byId("loginName");
  const loginSubmit = byId("loginSubmit");
  const loginBack = byId("loginBack");
  const onboardingBack = byId("onboardingBack");
  const goalContinue = byId("goalContinue");
  const profileBack = byId("profileBack");
  const profileStart = byId("profileStart");
  const quickCards = document.querySelectorAll(".quick-card");
  const loginHeading = loginScreen.querySelector("h2");
  const loginText = loginScreen.querySelector("p:not(.eyebrow)");
  const authActions = document.querySelector(".auth-actions");

  const message = document.createElement("p");
  message.className = "account-message";
  message.setAttribute("aria-live", "polite");
  authActions.insertAdjacentElement("afterend", message);

  const setMessage = (text = "") => {
    message.textContent = text;
  };

  const openRegister = () => {
    setMessage();
    loginHeading.textContent = "Loo konto";
    loginText.textContent = "Kirjuta oma nimi. See jääb sellesse brauserisse meelde.";
    loginSubmit.textContent = "Jätka →";
    loginName.value = "";
    show("login");
    loginName.focus();
  };

  const openProfile = () => {
    const account = getAccount();
    byId("profileNameOutput").textContent = account.name || "õppija";
    byId("profileGoalOutput").textContent = account.goal || "Õppida viipekeelt";
    byId("profileXpOutput").textContent = byId("xp")?.textContent || "0";
    const unlocked = Number(localStorage.getItem("viipeUnlockedLevel")) || 0;
    byId("profileLevelOutput").textContent =
      unlocked >= 1 ? "Tase 2 avatud" : "Tase 1 õppimisel";
    show("profile");
  };

  const interceptClick = (element, handler) => {
    if (!element) return;
    element.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        handler(event);
      },
      true
    );
  };

  interceptClick(loginStart, () => {
    if (hasAccount()) {
      openProfile();
    } else {
      show("onboarding");
      setMessage("Selles brauseris pole veel kontot. Vali „Registreeru“ või proovi ilma kontota.");
    }
  });

  interceptClick(registerStart, openRegister);
  interceptClick(guestStart, () => {
    setMessage();
    goToPath();
  });

  interceptClick(loginSubmit, () => {
    const name = loginName.value.trim();
    if (!name) {
      loginName.focus();
      return;
    }
    localStorage.setItem("viipeName", name);
    localStorage.removeItem("viipeOnboardingDone");
    show("goal");
  });

  loginName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loginSubmit.click();
    }
  });

  interceptClick(loginBack, () => {
    setMessage();
    show("onboarding");
  });

  interceptClick(onboardingBack, openRegister);

  interceptClick(goalContinue, () => {
    const choice = screens.goal.querySelector(".goal-option.selected");
    if (!choice) return;
    localStorage.setItem("viipeGoal", choice.dataset.goal);
    localStorage.setItem("viipeOnboardingDone", "true");
    goToPath();
  });

  interceptClick(profileBack, goToPath);
  interceptClick(profileStart, goToPath);

  interceptClick(quickCards[2], () => {
    if (hasAccount()) openProfile();
    else {
      show("onboarding");
      setMessage("Loo konto, kui soovid oma edenemist salvestada.");
    }
  });

  interceptClick(quickCards[3], () => {
    if (hasAccount()) openProfile();
    else {
      show("onboarding");
      setMessage("Logi sisse on olemasolevale kasutajale. Uue kasutaja jaoks vali „Registreeru“.");
    }
  });

  const video = byId("signVideo");
  if (video) {
   const correctVideoPath = () => {
  const source = video.src;
  if (false) {
    video.src = source.replace("/assets/videos/", "/assets/");
    video.load();
    video.play().catch(() => {});
  }
};
    new MutationObserver(correctVideoPath).observe(video, {
      attributes: true,
      attributeFilter: ["src"]
    });
  }

  const themeKey = "viipeTheme";
  const themeButton = document.createElement("button");
  themeButton.className = "theme-toggle";
  themeButton.type = "button";
  themeButton.setAttribute("aria-label", "Muuda värvirežiimi");
  document.body.append(themeButton);

  const setTheme = (theme) => {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-theme", dark);
    themeButton.textContent = dark ? "☀️" : "🌙";
    themeButton.title = dark ? "Kasuta heledat režiimi" : "Kasuta tumedat režiimi";
    localStorage.setItem(themeKey, dark ? "dark" : "light");
  };

  const savedTheme = localStorage.getItem(themeKey);
  setTheme(savedTheme || "light");
  themeButton.addEventListener("click", () => {
    setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark");
  });

  const rail = document.createElement("aside");
  rail.className = "desktop-rail";
  rail.innerHTML = `
    <p class="eyebrow purple">SINU EDENEMINE</p>
    <h2 id="railGreeting">Õpi omas tempos.</h2>
    <p>Väikesed sammud iga päev viivad kaugele.</p>
    <div class="rail-stat"><span>✨ KOGUTUD XP</span><strong id="railXp">0 XP</strong></div>
    <p class="rail-level" id="railLevel">Tase 1 ootab sind.</p>
    <button class="rail-start" type="button">Jätka õppimist →</button>
  `;
  screens.path.append(rail);

  const updateRail = () => {
    const account = getAccount();
    const xp = byId("xp")?.textContent || "0";
    const unlocked = Number(localStorage.getItem("viipeUnlockedLevel")) || 0;
    const greeting = byId("railGreeting");
    const railXp = byId("railXp");
    const railLevel = byId("railLevel");
    if (greeting) greeting.textContent = account.name ? `Tere, ${account.name}!` : "Õpi omas tempos.";
    if (railXp) railXp.textContent = `${xp} XP`;
    if (railLevel) railLevel.textContent = unlocked >= 1 ? "Tase 2 on nüüd avatud." : "Järgmine samm: Tase 1 — Tervitused.";
  };

  rail.querySelector(".rail-start")?.addEventListener("click", () => {
    const available = Array.from(document.querySelectorAll(".level-button:not(:disabled)"));
    available.at(-1)?.click();
  });

  const xpOutput = byId("xp");
  if (xpOutput) {
    new MutationObserver(updateRail).observe(xpOutput, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  if (hasAccount()) goToPath();
  else show("onboarding");
  updateRail();
})();
