/* VIIPE arvutivaade — eraldi töölaud, telefonivaadet see ei muuda. */
(() => {
  const byId = (id) => document.getElementById(id);
  const pathScreen = byId("pathScreen");
  const xpOutput = byId("xp");
  const completeScreen = byId("completeScreen");

  if (!pathScreen || !xpOutput) return;

  const desktopState = {
    view: "learn",
    matchIndex: 0,
    matchResult: null,
    matchChoice: null
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[character]));

  const today = () => new Date().toISOString().slice(0, 10);

  const getAccount = () => ({
    name: localStorage.getItem("viipeName") || "",
    goal: localStorage.getItem("viipeGoal") || "Õppida viipekeelt",
    complete: localStorage.getItem("viipeOnboardingDone") === "true"
  });

  const getXp = () => Number(localStorage.getItem("viipeXp") || xpOutput.textContent || 0);
  const getUnlockedLevel = () => Number(localStorage.getItem("viipeUnlockedLevel") || 0);
  const getCorrectTotal = () => {
    const saved = localStorage.getItem("viipeCorrectAnswers");
    if (saved !== null) return Number(saved || 0);
    const initial = Math.floor(getXp() / 10);
    localStorage.setItem("viipeCorrectAnswers", String(initial));
    return initial;
  };
  const getCompletedLevels = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("viipeCompletedLevels") || "null");
      if (Array.isArray(saved)) return saved;
    } catch {
      // Kasutame allpool praegust avatud taset algandmetena.
    }
    const initial = getUnlockedLevel() >= 1 ? [0] : [];
    localStorage.setItem("viipeCompletedLevels", JSON.stringify(initial));
    return initial;
  };
  const getLessons = () => {
    if (typeof levels === "undefined") return [];
    return levels.flatMap((level, levelIndex) =>
      level.words.map((word, wordIndex) => ({ ...word, levelIndex, wordIndex }))
    );
  };

  const activityKey = () => `viipeActivity-${today()}`;
  const getActivity = () => {
    try {
      return {
        correct: 0,
        levels: 0,
        claimed: [],
        ...JSON.parse(localStorage.getItem(activityKey()) || "{}")
      };
    } catch {
      return { correct: 0, levels: 0, claimed: [] };
    }
  };

  const saveActivity = (activity) => {
    localStorage.setItem(activityKey(), JSON.stringify(activity));
  };

  const getStreak = () => Number(localStorage.getItem("viipeStreak") || 0);

  const recordStudyDay = () => {
    const currentDay = today();
    const lastDay = localStorage.getItem("viipeLastStudyDay");
    let streak = getStreak();

    if (lastDay !== currentDay) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      streak = lastDay === yesterdayKey ? Math.max(1, streak + 1) : 1;
      localStorage.setItem("viipeLastStudyDay", currentDay);
      localStorage.setItem("viipeStreak", String(streak));
    }
  };

  let watchedXp = getXp();
  let ignoredXp = 0;

  const recordCorrectAnswers = (amount) => {
    if (amount <= 0) return;
    const activity = getActivity();
    activity.correct += amount;
    saveActivity(activity);
    localStorage.setItem("viipeCorrectAnswers", String(getCorrectTotal() + amount));
    recordStudyDay();
  };

  const addXp = (amount, { countsAsCorrect = false } = {}) => {
    if (typeof totalXp !== "undefined") {
      totalXp += amount;
      if (typeof updateXp === "function") updateXp();
      if (typeof saveProgress === "function") saveProgress();
    } else {
      localStorage.setItem("viipeXp", String(getXp() + amount));
      xpOutput.textContent = String(getXp());
    }

    if (!countsAsCorrect) ignoredXp += amount;
    updateDashboard();
  };

  const handleXpChange = () => {
    const nextXp = getXp();
    const difference = nextXp - watchedXp;
    if (difference > 0) {
      const countedXp = Math.max(0, difference - ignoredXp);
      ignoredXp = Math.max(0, ignoredXp - difference);
      recordCorrectAnswers(Math.round(countedXp / 10));
    }
    watchedXp = nextXp;
    updateDashboard();
  };

  new MutationObserver(handleXpChange).observe(xpOutput, {
    childList: true,
    characterData: true,
    subtree: true
  });

  if (completeScreen) {
    new MutationObserver(() => {
      if (!completeScreen.hidden) {
        const activity = getActivity();
        activity.levels += 1;
        saveActivity(activity);
        if (typeof currentLevel !== "undefined") {
          const completed = getCompletedLevels();
          if (!completed.includes(currentLevel)) {
            completed.push(currentLevel);
            localStorage.setItem("viipeCompletedLevels", JSON.stringify(completed));
          }
        }
        recordStudyDay();
        updateDashboard();
      }
    }).observe(completeScreen, { attributes: true, attributeFilter: ["hidden"] });
  }

  const sidebar = document.createElement("aside");
  sidebar.className = "viipe-desktop-sidebar";
  sidebar.setAttribute("aria-label", "VIIPE arvutimenüü");
  sidebar.innerHTML = `
    <button class="desktop-brand" type="button" data-view="learn" aria-label="VIIPE avaleht">
      <span class="desktop-brand-mark"><img src="assets/viipe-logo.png" alt="" /></span>
      <span>VIIPE</span>
    </button>
    <nav class="desktop-nav-list" aria-label="Õppimise menüü">
      <button type="button" data-view="learn"><span class="desktop-nav-icon">⌂</span>Õpi</button>
      <button type="button" data-view="matches"><span class="desktop-nav-icon">⌘</span>Sobita</button>
      <button type="button" data-view="leaderboard"><span class="desktop-nav-icon">♛</span>Edetabel</button>
      <button type="button" data-view="quests"><span class="desktop-nav-icon">✦</span>Ülesanded</button>
      <button type="button" data-view="shop"><span class="desktop-nav-icon">✿</span>Pood</button>
      <button type="button" data-view="profile"><span class="desktop-nav-icon">◉</span>Profiil</button>
    </nav>
    <div class="desktop-nav-bottom">
      <span>VIIPE · arvutivaade</span>
      <span>Telefonivaade jääb eraldi.</span>
    </div>
  `;

  const status = document.createElement("div");
  status.className = "viipe-desktop-status";

  const panel = document.createElement("section");
  panel.className = "viipe-desktop-panel";
  panel.setAttribute("aria-live", "polite");

  const context = document.createElement("aside");
  context.className = "viipe-desktop-context";

  pathScreen.prepend(sidebar);
  pathScreen.append(status, panel, context);

  const setDesktopView = (view) => {
    desktopState.view = view;
    desktopState.matchResult = null;
    desktopState.matchChoice = null;
    pathScreen.dataset.desktopView = view;
    renderDesktop();
  };

  const getDisplayName = () => getAccount().name || "Õppija";

  const levelSummary = () => {
    const unlocked = getUnlockedLevel();
    return unlocked >= 1 ? "Tase 2 on avatud" : "Alusta tasemest 1";
  };

  const renderStatus = () => {
    status.innerHTML = `
      <span class="desktop-status-item"><b>🔥</b> <strong>${getStreak()}</strong> päeva</span>
      <span class="desktop-status-item"><b>✨</b> <strong>${getXp()}</strong> XP</span>
      <button class="desktop-status-theme" type="button" data-action="toggle-theme" aria-label="Muuda värvirežiimi">${document.body.classList.contains("dark-theme") ? "☀️" : "🌙"}</button>
      <button class="desktop-account-chip" type="button" data-view="profile" aria-label="Ava profiil">
        ${escapeHtml(getDisplayName().slice(0, 1).toUpperCase())}
      </button>
    `;
  };

  const levelCard = (level, index) => {
    const hasWords = level.words.length > 0;
    const unlocked = hasWords && index <= getUnlockedLevel();
    const done = index < getUnlockedLevel();
    const name = level.name.replace(`Tase ${index + 1} — `, "");
    const statusText = !hasWords ? "Peagi" : done ? "Tehtud" : unlocked ? "Alusta" : "Lukus";
    const action = unlocked ? `data-action="open-level" data-level="${index}"` : "disabled";

    return `
      <button class="desktop-level ${done ? "is-done" : ""} ${!unlocked ? "is-locked" : ""}" type="button" ${action}>
        <span class="desktop-level-node">${unlocked ? index + 1 : "🔒"}</span>
        <span class="desktop-level-label">
          <small>TASE ${index + 1}</small>
          <strong>${escapeHtml(name)}</strong>
          <em>${statusText} ${unlocked && !done ? "→" : done ? "✓" : ""}</em>
        </span>
      </button>
    `;
  };

  const renderLearn = () => {
    const allLevels = typeof levels !== "undefined" ? levels : [];
    panel.innerHTML = `
      <header class="desktop-page-heading">
        <p class="desktop-kicker">ÕPPEALA</p>
        <h1>Õpi viipekeelt.</h1>
        <p>Alusta tasemest või jätka sealt, kus viimati pooleli jäid.</p>
      </header>
      <div class="desktop-learning-path">
        ${allLevels.map(levelCard).join("")}
      </div>
    `;
    context.innerHTML = `
      <section class="desktop-context-card accent-card">
        <p class="desktop-kicker">TÄNANE EESMÄRK</p>
        <h2>Õpi 3 viibet</h2>
        <div class="mini-progress"><span style="width:${Math.min(100, (getActivity().correct / 3) * 100)}%"></span></div>
        <p>${Math.min(3, getActivity().correct)} / 3 õiget vastust täna</p>
      </section>
      <section class="desktop-context-card">
        <p class="desktop-kicker">SINU EDENEMINE</p>
        <strong class="context-xp">${getXp()} XP</strong>
        <p>${levelSummary()}</p>
        <button class="context-button" type="button" data-action="continue-learning">Jätka õppimist →</button>
      </section>
    `;
  };

  const getMatch = () => {
    const lessons = getLessons();
    if (!lessons.length) return null;
    return lessons[desktopState.matchIndex % lessons.length];
  };

  const addVideoFallback = (video, preferredPath) => {
    if (!video || !preferredPath || !preferredPath.includes("assets/videos/")) return;
    const fallbackPath = preferredPath.replace("assets/videos/", "assets/");
    video.addEventListener("error", () => {
      if (video.dataset.fallbackTried === "true") return;
      video.dataset.fallbackTried = "true";
      video.src = fallbackPath;
      video.load();
      video.play().catch(() => {});
    }, { once: true });
  };

  const renderMatches = () => {
    const match = getMatch();
    if (!match) {
      panel.innerHTML = "<p>Harjutused laaditakse peagi.</p>";
      return;
    }

    const answerMessage = desktopState.matchResult === "correct"
      ? "Õige! +10 XP"
      : desktopState.matchResult === "wrong"
        ? `Proovi veel kord. ${(typeof answerHints !== "undefined" && answerHints[match.word]) || "Vaata viibet veel üks kord."}`
        : "Vaata viibet ja vali sellele sobiv sõna.";

    panel.innerHTML = `
      <header class="desktop-page-heading">
        <p class="desktop-kicker">SÕNAPARID</p>
        <h1>Sobita viibe sõnaga.</h1>
        <p>Vaata videot, vali õige sõna ja jäta viipe tähendus meelde.</p>
      </header>
      <section class="desktop-match-card">
        <div class="desktop-match-video">
          <video autoplay muted loop playsinline preload="auto" src="${escapeHtml(match.video)}"></video>
          <span>VIIPEVIDEO</span>
        </div>
        <div class="desktop-match-question">
          <p class="desktop-kicker">MIDA SEE VIIBE TÄHENDAB?</p>
          <div class="desktop-match-options">
            ${match.choices.map((choice) => {
              const isCorrect = desktopState.matchResult === "correct" && choice === match.word;
              const isWrong = desktopState.matchResult === "wrong" && choice === desktopState.matchChoice;
              return `<button type="button" data-action="match-choice" data-choice="${escapeHtml(choice)}" class="${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}" ${desktopState.matchResult === "correct" ? "disabled" : ""}>${escapeHtml(choice)}</button>`;
            }).join("")}
          </div>
          <p class="desktop-match-feedback ${desktopState.matchResult || ""}">${escapeHtml(answerMessage)}</p>
          ${desktopState.matchResult === "correct" ? '<button class="context-button" type="button" data-action="next-match">Järgmine viipe →</button>' : ""}
        </div>
      </section>
    `;
    context.innerHTML = `
      <section class="desktop-context-card accent-card">
        <p class="desktop-kicker">ÕPPEVIIS</p>
        <h2>Vaata · vali · korda</h2>
        <p>Sõnapaarid aitavad sul viipe ja tähenduse kiiresti kokku viia.</p>
      </section>
      <section class="desktop-context-card">
        <p class="desktop-kicker">TÄNA ÕIGESTI</p>
        <strong class="context-xp">${getActivity().correct}</strong>
        <p>õiget vastust</p>
      </section>
    `;
    addVideoFallback(panel.querySelector(".desktop-match-video video"), match.video);
  };

  const renderLeaderboard = () => {
    const account = getAccount();
    const user = { name: account.name || "Sina", xp: getXp(), you: true };
    const entries = [
      { name: "Liis", xp: Math.max(120, user.xp + 60) },
      { name: "Markus", xp: Math.max(90, user.xp + 30) },
      { name: "Anni", xp: Math.max(70, user.xp + 10) },
      user,
      { name: "Robin", xp: Math.max(20, user.xp - 15) }
    ].sort((a, b) => b.xp - a.xp).slice(0, 5);

    panel.innerHTML = `
      <header class="desktop-page-heading">
        <p class="desktop-kicker">ÕPPIJATE RING</p>
        <h1>Edetabel.</h1>
        <p>Võrdle õpimotivatsiooni ja kogu XP-d.</p>
      </header>
      <section class="desktop-leaderboard-card">
        <div class="desktop-demo-note">Näidis-edetabel · päris teiste õppijate nimekiri lisandub koos kontodega.</div>
        <ol class="desktop-ranking-list">
          ${entries.map((entry, index) => `
            <li class="${entry.you ? "is-you" : ""}">
              <span class="ranking-place">${index + 1}</span>
              <span class="ranking-avatar">${escapeHtml(entry.name.slice(0, 1).toUpperCase())}</span>
              <strong>${escapeHtml(entry.name)}${entry.you ? " <em>Sina</em>" : ""}</strong>
              <span class="ranking-xp">✨ ${entry.xp} XP</span>
            </li>
          `).join("")}
        </ol>
      </section>
    `;
    context.innerHTML = `
      <section class="desktop-context-card accent-card">
        <p class="desktop-kicker">SINU KOHT</p>
        <h2>${entries.findIndex((entry) => entry.you) + 1}. koht</h2>
        <p>${getXp()} XP selles brauseris.</p>
      </section>
      <section class="desktop-context-card">
        <p class="desktop-kicker">ROHKEM XP-D</p>
        <p>Harjuta sõnapaaridega või lõpeta järgmine tase.</p>
        <button class="context-button" type="button" data-view="matches">Ava Sobita →</button>
      </section>
    `;
  };

  const questRows = () => {
    const activity = getActivity();
    return [
      { id: "correct", title: "Vasta 3 korda õigesti", text: "Harjuta viipeid täna.", value: activity.correct, goal: 3, reward: 15 },
      { id: "level", title: "Lõpeta üks tase", text: "Tee harjutus lõpuni.", value: activity.levels, goal: 1, reward: 25 },
      { id: "words", title: "Õpi 5 viibet", text: "Iga õige vastus viib edasi.", value: activity.correct, goal: 5, reward: 30 }
    ];
  };

  const renderQuests = () => {
    const activity = getActivity();
    panel.innerHTML = `
      <header class="desktop-page-heading">
        <p class="desktop-kicker">TÄNASED ÜLESANDED</p>
        <h1>Väikesed eesmärgid.</h1>
        <p>Tee harjutused lõpuni ja kogu lisaks XP-d.</p>
      </header>
      <div class="desktop-quest-list">
        ${questRows().map((quest) => {
          const done = quest.value >= quest.goal;
          const claimed = activity.claimed.includes(quest.id);
          const progress = Math.min(100, (quest.value / quest.goal) * 100);
          return `
            <article class="desktop-quest ${done ? "is-ready" : ""}">
              <span class="quest-mark">${done ? "✓" : "✦"}</span>
              <div>
                <h2>${quest.title}</h2>
                <p>${quest.text}</p>
                <div class="mini-progress"><span style="width:${progress}%"></span></div>
                <small>${Math.min(quest.value, quest.goal)} / ${quest.goal}</small>
              </div>
              ${done
                ? `<button type="button" data-action="claim-quest" data-quest="${quest.id}" ${claimed ? "disabled" : ""}>${claimed ? "Võetud ✓" : `Võta +${quest.reward} XP`}</button>`
                : `<span class="quest-reward">+${quest.reward} XP</span>`}
            </article>
          `;
        }).join("")}
      </div>
    `;
    context.innerHTML = `
      <section class="desktop-context-card accent-card">
        <p class="desktop-kicker">TÄNA</p>
        <h2>${getActivity().correct} õiget vastust</h2>
        <p>Iga väike samm loeb.</p>
      </section>
      <section class="desktop-context-card">
        <p class="desktop-kicker">ALUSTA NÜÜD</p>
        <p>Leia järgmine avatav harjutus õpiteelt.</p>
        <button class="context-button" type="button" data-view="learn">Õpi nüüd →</button>
      </section>
    `;
  };

  const renderShop = () => {
    panel.innerHTML = `
      <header class="desktop-page-heading">
        <p class="desktop-kicker">ÕPPIMISE ABILISED</p>
        <h1>Pood.</h1>
        <p>Abilised ja märgid, mis teevad õppimise mängulisemaks.</p>
      </header>
      <section class="desktop-shop-banner">
        <div><p class="desktop-kicker">VIIPE PLUSS</p><h2>Õpi oma tempos.</h2><p>Uusi abivahendeid lisame koos uute tasemetega.</p></div>
        <span aria-hidden="true">✋</span>
      </section>
      <section class="desktop-shop-section">
        <h2>Abilised</h2>
        <article class="desktop-shop-item">
          <span class="shop-icon coral">♥</span>
          <div><h3>Seeria kaitse</h3><p>Hoia oma õppimise rütmi ka kiirel päeval.</p></div>
          <button type="button" disabled>Peagi</button>
        </article>
        <article class="desktop-shop-item">
          <span class="shop-icon aqua">✦</span>
          <div><h3>Vihjekaart</h3><p>Anna endale keerulise viipe puhul väike abikäsi.</p></div>
          <button type="button" disabled>Peagi</button>
        </article>
      </section>
      <section class="desktop-shop-section">
        <h2>Märgid</h2>
        <article class="desktop-shop-item">
          <span class="shop-icon purple">☾</span>
          <div><h3>Ööõppija</h3><p>Kasuta tumedat režiimi ja õpi endale sobival ajal.</p></div>
          <button type="button" data-action="toggle-theme">Muuda teemat</button>
        </article>
      </section>
    `;
    context.innerHTML = `
      <section class="desktop-context-card accent-card">
        <p class="desktop-kicker">SINU XP</p>
        <strong class="context-xp">${getXp()} XP</strong>
        <p>XP on sinu edenemise tulemus — poes seda ei kulutata.</p>
      </section>
      <section class="desktop-context-card">
        <p class="desktop-kicker">UUSI ASJU</p>
        <p>Pood on valmis tulevaste lisaharjutuste ja märkide jaoks.</p>
      </section>
    `;
  };

  const renderProfile = () => {
    const account = getAccount();
    const correctTotal = getCorrectTotal();
    const completed = getCompletedLevels().length;
    const defaultGoals = ["Igapäevased viiped", "Suhtlemine", "Kool või töö", "Lihtsalt proovin"];

    panel.innerHTML = `
      <header class="desktop-profile-banner">
        <span class="profile-avatar">${escapeHtml(getDisplayName().slice(0, 1).toUpperCase())}</span>
        <div>
          <p class="desktop-kicker">MINU VIIPE</p>
          <h1>${escapeHtml(getDisplayName())}</h1>
          <p>${account.complete ? "Sinu edenemine jääb sellesse brauserisse meelde." : "Õpid praegu külalisena selles brauseris."}</p>
        </div>
      </header>
      <section class="desktop-profile-stats">
        <article><span>✨</span><strong>${getXp()}</strong><small>Kogutud XP</small></article>
        <article><span>🔥</span><strong>${getStreak()}</strong><small>Õppepäeva järjest</small></article>
        <article><span>✋</span><strong>${correctTotal}</strong><small>Õiget vastust</small></article>
        <article><span>✓</span><strong>${completed}</strong><small>Lõpetatud taset</small></article>
      </section>
      <section class="desktop-profile-grid">
        <article class="desktop-profile-card">
          <p class="desktop-kicker">SINU EESMÄRK</p>
          <h2>${escapeHtml(account.goal)}</h2>
          <form data-profile-form>
            <label>Nimi<input name="name" maxlength="24" value="${escapeHtml(account.name)}" placeholder="Sinu nimi" /></label>
            <label>Eesmärk<select name="goal">${defaultGoals.map((goal) => `<option ${goal === account.goal ? "selected" : ""}>${escapeHtml(goal)}</option>`).join("")}</select></label>
            <button type="submit">Salvesta muudatused</button>
          </form>
        </article>
        <article class="desktop-profile-card">
          <p class="desktop-kicker">SAAVUTUSED</p>
          <div class="achievement"><span>🌱</span><div><strong>Esimene samm</strong><p>${getXp() > 0 ? "Sa kogusid oma esimesed XP-d." : "Vasta esimest korda õigesti."}</p></div></div>
          <div class="achievement"><span>⚡</span><div><strong>50 XP</strong><p>${Math.min(50, getXp())} / 50 XP kogutud</p></div></div>
          <div class="achievement"><span>☀️</span><div><strong>Päeva väljakutse</strong><p>${getActivity().correct} / 3 õiget vastust täna</p></div></div>
        </article>
      </section>
    `;
    context.innerHTML = `
      <section class="desktop-context-card accent-card">
        <p class="desktop-kicker">JÄRGMINE SAMM</p>
        <h2>${levelSummary()}</h2>
        <button class="context-button" type="button" data-view="learn">Jätka õppimist →</button>
      </section>
      <section class="desktop-context-card">
        <p class="desktop-kicker">PRIVAATSUS</p>
        <p>Praegu hoitakse sinu nimi ja edasiminek ainult selles brauseris.</p>
      </section>
    `;
  };

  const renderDesktop = () => {
    renderStatus();
    sidebar.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === desktopState.view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    if (desktopState.view === "matches") renderMatches();
    else if (desktopState.view === "leaderboard") renderLeaderboard();
    else if (desktopState.view === "quests") renderQuests();
    else if (desktopState.view === "shop") renderShop();
    else if (desktopState.view === "profile") renderProfile();
    else renderLearn();
  };

  const updateDashboard = () => {
    if (!panel.isConnected) return;
    renderDesktop();
  };

  const openLevel = (index) => {
    if (typeof window.openLevel === "function") window.openLevel(index);
  };

  const claimQuest = (id) => {
    const quest = questRows().find((item) => item.id === id);
    const activity = getActivity();
    if (!quest || activity.claimed.includes(id) || quest.value < quest.goal) return;
    activity.claimed.push(id);
    saveActivity(activity);
    addXp(quest.reward);
  };

  const toggleTheme = () => {
    document.querySelector(".theme-toggle")?.click();
    updateDashboard();
  };

  const handleAction = (event) => {
    const trigger = event.target.closest("[data-action], [data-view]");
    if (!trigger) return;

    const view = trigger.dataset.view;
    if (view) {
      event.preventDefault();
      setDesktopView(view);
      return;
    }

    const action = trigger.dataset.action;
    if (action === "open-level") openLevel(Number(trigger.dataset.level));
    if (action === "continue-learning") openLevel(getUnlockedLevel() >= 1 ? 1 : 0);
    if (action === "match-choice") {
      const match = getMatch();
      if (!match || desktopState.matchResult === "correct") return;
      if (trigger.dataset.choice === match.word) {
        desktopState.matchResult = "correct";
        desktopState.matchChoice = trigger.dataset.choice;
        addXp(10, { countsAsCorrect: true });
      } else {
        desktopState.matchResult = "wrong";
        desktopState.matchChoice = trigger.dataset.choice;
        renderDesktop();
      }
    }
    if (action === "next-match") {
      desktopState.matchIndex += 1;
      desktopState.matchResult = null;
      desktopState.matchChoice = null;
      renderDesktop();
    }
    if (action === "claim-quest") claimQuest(trigger.dataset.quest);
    if (action === "toggle-theme") toggleTheme();
  };

  sidebar.addEventListener("click", handleAction);
  status.addEventListener("click", handleAction);
  panel.addEventListener("click", handleAction);
  context.addEventListener("click", handleAction);

  panel.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-profile-form]");
    if (!form) return;
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const goal = String(formData.get("goal") || "Õppida viipekeelt");
    if (name) localStorage.setItem("viipeName", name);
    localStorage.setItem("viipeGoal", goal);
    updateDashboard();
  });

  new MutationObserver(() => {
    if (!pathScreen.hidden) updateDashboard();
  }).observe(pathScreen, { attributes: true, attributeFilter: ["hidden"] });

  pathScreen.dataset.desktopView = desktopState.view;
  renderDesktop();
})();
