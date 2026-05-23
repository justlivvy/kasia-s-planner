const todayISO = new Date().toISOString().slice(0, 10);
const storageKey = "bloom-organiser-state";

const defaultState = {
  dataVersion: 4,
  appName: "Kasia's World",
  greetingName: "",
  mood: "",
  reflection: "",
  monthOffset: 0,
  tasks: [],
  events: [],
  habits: [
    { id: crypto.randomUUID(), icon: "💧", title: "Drink water", streak: 0, doneToday: false },
    { id: crypto.randomUUID(), icon: "📖", title: "Read", streak: 0, doneToday: false },
    { id: crypto.randomUUID(), icon: "🌿", title: "Meditate", streak: 0, doneToday: false }
  ],
  chores: [],
  journal: []
};

let state = loadState();

const views = document.querySelectorAll(".view");
const navTabs = document.querySelectorAll(".nav-tab");
const viewTitle = document.getElementById("viewTitle");
const todayLabel = document.getElementById("todayLabel");
const emptyTemplate = document.getElementById("emptyTemplate");
const brandName = document.getElementById("brandName");
const appNameInput = document.getElementById("appNameInput");
const greetingNameInput = document.getElementById("greetingNameInput");
const searchInput = document.getElementById("searchInput");
const notificationsPanel = document.getElementById("notificationsPanel");
const notificationsList = document.getElementById("notificationsList");

const titles = {
  dashboard: () => state.greetingName ? `Good morning, ${state.greetingName}! ✿` : "Good morning! ✿",
  tasks: "Organise the week",
  calendar: "See what's next",
  journal: "Write it down",
  chores: "Keep home moving",
  habits: "Build gentle routines",
  settings: "Make it hers"
};

const subtitles = {
  dashboard: "Let's make today amazing!",
  tasks: "Sort daily, weekly, and monthly goals.",
  calendar: "Plan the dates that matter.",
  journal: "A calm place for thoughts.",
  chores: "Keep the routine simple.",
  habits: "Track the little things that help.",
  settings: "Change the name and greeting anytime."
};

document.getElementById("taskDate").value = todayISO;
document.getElementById("eventDate").value = todayISO;

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

document.querySelectorAll("[data-view-link]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewLink));
});

searchInput.addEventListener("input", () => applySearch(searchInput.value));

document.getElementById("notificationsButton").addEventListener("click", () => {
  notificationsPanel.hidden = !notificationsPanel.hidden;
  renderNotifications();
});

document.getElementById("closeNotifications").addEventListener("click", () => {
  notificationsPanel.hidden = true;
});

document.querySelector(".avatar").addEventListener("click", () => showView("settings"));

document.getElementById("quickTaskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("quickTaskInput");
  const title = input.value.trim();
  if (!title) return;
  addTask({ title, cadence: "Daily", priority: "Medium", date: todayISO, time: "Any time" });
  input.value = "";
});

document.getElementById("taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addTask({
    title: document.getElementById("taskTitle").value.trim(),
    cadence: document.getElementById("taskCadence").value,
    priority: document.getElementById("taskPriority").value,
    date: document.getElementById("taskDate").value || todayISO,
    time: "Any time"
  });
  event.currentTarget.reset();
  document.getElementById("taskDate").value = todayISO;
});

document.getElementById("choreForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("choreTitle").value.trim();
  if (!title) return;
  state.chores.unshift({
    id: crypto.randomUUID(),
    title,
    repeat: document.getElementById("choreRepeat").value,
    owner: document.getElementById("choreOwner").value.trim() || "Me",
    done: false
  });
  event.currentTarget.reset();
  saveAndRender();
});

document.getElementById("journalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("journalTitle").value.trim();
  const body = document.getElementById("journalBody").value.trim();
  if (!title || !body) return;
  state.journal.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    date: new Intl.DateTimeFormat("en-GB", { month: "long", day: "numeric", year: "numeric" }).format(new Date())
  });
  event.currentTarget.reset();
  saveAndRender();
});

document.getElementById("eventForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("eventTitle").value.trim();
  const date = document.getElementById("eventDate").value || todayISO;
  if (!title) return;

  state.events.push({
    id: crypto.randomUUID(),
    title,
    date,
    time: document.getElementById("eventTime").value,
    type: document.getElementById("eventType").value
  });

  event.currentTarget.reset();
  document.getElementById("eventDate").value = todayISO;
  saveAndRender();
});

document.getElementById("habitForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("habitTitle").value.trim();
  if (!title) return;

  state.habits.unshift({
    id: crypto.randomUUID(),
    icon: document.getElementById("habitIcon").value,
    title,
    streak: 0,
    doneToday: false
  });

  event.currentTarget.reset();
  saveAndRender();
});

document.getElementById("settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.appName = appNameInput.value.trim() || defaultState.appName;
  state.greetingName = greetingNameInput.value.trim();
  saveAndRender();
});

document.getElementById("dailyReflection").addEventListener("input", (event) => {
  state.reflection = event.target.value;
  saveState();
});

document.querySelectorAll("#moodPicker button").forEach((button) => {
  button.addEventListener("click", () => {
    state.mood = button.dataset.mood;
    saveAndRender();
  });
});

document.getElementById("prevMonth").addEventListener("click", () => {
  state.monthOffset -= 1;
  saveAndRender();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  state.monthOffset += 1;
  saveAndRender();
});

document.getElementById("calendarPrevMonth").addEventListener("click", () => {
  state.monthOffset -= 1;
  saveAndRender();
});

document.getElementById("calendarNextMonth").addEventListener("click", () => {
  state.monthOffset += 1;
  saveAndRender();
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return defaultState;

    if ((saved.dataVersion || 1) < defaultState.dataVersion) {
      return { ...defaultState, ...saved, dataVersion: defaultState.dataVersion, tasks: [], chores: [], journal: [] };
    }

    return { ...defaultState, ...saved };
  } catch {
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function saveAndRender() {
  saveState();
  render();
}

function addTask(task) {
  if (!task.title) return;
  state.tasks.unshift({ id: crypto.randomUUID(), done: false, ...task });
  saveAndRender();
}

function showView(id) {
  views.forEach((view) => view.classList.toggle("active", view.id === id));
  navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === id));
  viewTitle.textContent = typeof titles[id] === "function" ? titles[id]() : titles[id];
  todayLabel.textContent = subtitles[id];
}

function createEmpty() {
  return emptyTemplate.content.firstElementChild.cloneNode(true);
}

function render() {
  renderSettings();

  const todayTasks = state.tasks.filter((task) => task.date === todayISO || task.cadence === "Daily");
  const doneTasks = todayTasks.filter((task) => task.done).length;
  const dueChores = state.chores.filter((chore) => !chore.done);
  const doneChores = state.chores.filter((chore) => chore.done).length;
  const todayEvents = state.events.filter((event) => event.date === todayISO);
  const upcomingEvents = getUpcomingEvents();

  document.getElementById("taskTotal").textContent = todayTasks.length;
  document.getElementById("doneCount").textContent = doneTasks;
  document.getElementById("eventTotal").textContent = todayEvents.length;
  document.getElementById("upcomingEventCount").textContent = upcomingEvents.length;
  document.getElementById("choreTotal").textContent = dueChores.length;
  document.getElementById("choreDoneCount").textContent = doneChores;
  document.getElementById("streakCount").textContent = Math.min(12, doneTasks + doneChores);

  renderMood();
  renderTaskLists(todayTasks);
  renderEvents(upcomingEvents, todayEvents);
  renderCalendar();
  renderJournal();
  renderChores(dueChores);
  renderHabits();
  renderNotifications();
  applySearch(searchInput.value);
}

function renderSettings() {
  brandName.textContent = state.appName || defaultState.appName;
  document.title = `${state.appName || defaultState.appName} - Daily Organiser`;
  appNameInput.value = state.appName || defaultState.appName;
  greetingNameInput.value = state.greetingName || "";

  if (document.getElementById("dashboard").classList.contains("active")) {
    viewTitle.textContent = titles.dashboard();
  }
}

function renderMood() {
  document.getElementById("dailyReflection").value = state.reflection || "";
  document.querySelectorAll("#moodPicker button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === state.mood);
  });
}

function renderTaskLists(todayTasks) {
  renderItemList(document.getElementById("todayTasks"), todayTasks, "task", { limit: 5, showTime: true });
  renderColumns();
}

function renderColumns() {
  const container = document.getElementById("taskColumns");
  container.innerHTML = "";
  ["Daily", "Weekly", "Monthly"].forEach((cadence) => {
    const column = document.createElement("article");
    column.className = "panel column";
    column.innerHTML = `<h4>${cadence}</h4>`;
    const list = document.createElement("div");
    list.className = "item-list";
    renderItemList(list, state.tasks.filter((task) => task.cadence === cadence), "task");
    column.append(list);
    container.append(column);
  });
}

function renderItemList(container, items, type, options = {}) {
  container.innerHTML = "";
  const visibleItems = options.limit ? items.slice(0, options.limit) : items;

  if (!visibleItems.length) {
    container.append(createEmpty());
    return;
  }

  visibleItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = `item ${item.done ? "done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;
    checkbox.setAttribute("aria-label", `Mark ${item.title} as complete`);
    checkbox.addEventListener("change", () => toggleDone(type, item.id));

    const subtitle = type === "chore" ? item.repeat || "Today" : options.showTime ? item.time || "Any time" : item.date || "";
    const label = type === "chore" ? item.owner || "Me" : item.priority || "Due";

    const title = document.createElement("div");
    title.className = "item-title";
    title.innerHTML = `<strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(subtitle)}</span>`;

    const tag = document.createElement("span");
    tag.className = `tag ${(item.priority || "").toLowerCase()}`;
    tag.textContent = label;

    row.append(checkbox, title, tag);
    container.append(row);
  });
}

function toggleDone(type, id) {
  const collection = type === "task" ? state.tasks : state.chores;
  const item = collection.find((entry) => entry.id === id);
  if (item) item.done = !item.done;
  saveAndRender();
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const mini = document.getElementById("miniCalendar");
  const monthLabel = document.getElementById("monthLabel");
  const calendarMonthLabel = document.getElementById("calendarMonthLabel");
  const base = new Date();
  const date = new Date(base.getFullYear(), base.getMonth() + state.monthOffset, 1);
  const year = date.getFullYear();
  const month = date.getMonth();
  monthLabel.textContent = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
  calendarMonthLabel.textContent = monthLabel.textContent;

  grid.innerHTML = "";
  mini.innerHTML = "";
  ["S", "M", "T", "W", "T", "F", "S"].forEach((day) => {
    const label = document.createElement("div");
    label.className = "weekday";
    label.textContent = day;
    mini.append(label.cloneNode(true));
    grid.append(label);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i += 1) {
    mini.append(createDayCell("", "mini-day muted"));
    grid.append(createDayCell("", "calendar-day muted"));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toISO(year, month, day);
    const miniDay = createDayCell(day, `mini-day ${iso === todayISO ? "today" : ""}`);
    mini.append(miniDay);

    const cell = createDayCell("", `calendar-day ${iso === todayISO ? "today" : ""}`);
    cell.innerHTML = `<strong>${day}</strong>`;
    const dayItems = [
      ...state.events.filter((event) => event.date === iso).map((event) => ({ title: event.title, kind: "event" })),
      ...state.tasks.filter((task) => task.date === iso).map((task) => ({ title: task.title, kind: "task" }))
    ];
    dayItems.slice(0, 3).forEach((item) => {
      const chip = document.createElement("span");
      chip.className = `calendar-chip ${item.kind === "event" ? "event-chip" : "task-chip"}`;
      chip.textContent = item.title;
      cell.append(chip);
    });
    if (dayItems.length > 3) {
      const more = document.createElement("span");
      more.className = "calendar-chip";
      more.textContent = `+${dayItems.length - 3} more`;
      cell.append(more);
    }
    grid.append(cell);
  }
}

function getUpcomingEvents() {
  return [...state.events]
    .filter((event) => event.date >= todayISO)
    .sort((a, b) => `${a.date} ${a.time || "99:99"}`.localeCompare(`${b.date} ${b.time || "99:99"}`))
    .slice(0, 5);
}

function renderEvents(upcomingEvents, todayEvents) {
  const upcoming = document.getElementById("upcomingEvents");
  const schedule = document.getElementById("scheduleList");
  upcoming.innerHTML = "";
  schedule.innerHTML = "";

  if (!upcomingEvents.length) {
    const empty = document.createElement("div");
    empty.className = "event-card empty-card";
    empty.textContent = "No events yet. Add one from the Calendar page.";
    upcoming.append(empty);
  } else {
    upcomingEvents.slice(0, 3).forEach((event) => {
      const card = document.createElement("div");
      card.className = `event-card ${eventTone(event.type)}`;
      const eventDate = parseISODate(event.date);
      card.innerHTML = `
        <time><span>${eventDate.toLocaleDateString("en-GB", { month: "short" })}</span><strong>${eventDate.getDate()}</strong></time>
        <div>
          <strong>${escapeHTML(event.title)}</strong>
          <span>● ${escapeHTML(formatEventTime(event))}</span>
        </div>
      `;
      upcoming.append(card);
    });
  }

  if (!todayEvents.length) {
    const item = document.createElement("li");
    item.innerHTML = `<span class="dot green-dot"></span><time>Today</time><strong>No events planned</strong>`;
    schedule.append(item);
    return;
  }

  todayEvents
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"))
    .forEach((event) => {
      const item = document.createElement("li");
      item.innerHTML = `<span class="dot ${eventDot(event.type)}"></span><time>${escapeHTML(formatShortTime(event.time))}</time><strong>${escapeHTML(event.title)}</strong>`;
      schedule.append(item);
    });
}

function renderNotifications() {
  const reminders = [
    ...getUpcomingEvents().slice(0, 3).map((event) => ({
      icon: "📅",
      title: event.title,
      detail: `${event.date} · ${formatEventTime(event)}`
    })),
    ...state.tasks.filter((task) => !task.done).slice(0, 2).map((task) => ({
      icon: "✅",
      title: task.title,
      detail: task.time || task.date || "Task to complete"
    })),
    ...state.chores.filter((chore) => !chore.done).slice(0, 2).map((chore) => ({
      icon: "🧹",
      title: chore.title,
      detail: chore.repeat || "Chore due"
    }))
  ];

  notificationsList.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "notice-list";

  if (!reminders.length) {
    const empty = document.createElement("div");
    empty.className = "notice";
    empty.innerHTML = `<span>🌱</span><div><strong>All clear</strong><span>No reminders right now.</span></div>`;
    wrapper.append(empty);
  } else {
    reminders.forEach((reminder) => {
      const item = document.createElement("div");
      item.className = "notice";
      item.innerHTML = `<span>${reminder.icon}</span><div><strong>${escapeHTML(reminder.title)}</strong><span>${escapeHTML(reminder.detail)}</span></div>`;
      wrapper.append(item);
    });
  }

  notificationsList.append(wrapper);
}

function applySearch(value) {
  const query = value.trim().toLowerCase();
  document.querySelectorAll(".item, .event-card, .journal-card, .chore-card, .habit-card, .habit-row").forEach((element) => {
    if (!query) {
      element.classList.remove("is-hidden-by-search");
      return;
    }

    element.classList.toggle("is-hidden-by-search", !element.textContent.toLowerCase().includes(query));
  });
}

function formatEventTime(event) {
  return event.time ? formatShortTime(event.time) : "All day";
}

function formatShortTime(time) {
  if (!time) return "All day";
  const [hour, minute] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function eventTone(type) {
  return {
    Appointment: "lavender",
    Family: "peach",
    Work: "rose",
    Personal: "lavender"
  }[type] || "lavender";
}

function eventDot(type) {
  return {
    Appointment: "purple-dot",
    Family: "green-dot",
    Work: "pink-dot",
    Personal: "purple-dot"
  }[type] || "purple-dot";
}

function createDayCell(text, className) {
  const cell = document.createElement("div");
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function renderJournal() {
  const list = document.getElementById("journalList");
  const preview = document.getElementById("journalPreview");
  list.innerHTML = "";
  preview.innerHTML = "";

  if (!state.journal.length) {
    list.append(createEmpty());
    preview.append(createEmpty());
    return;
  }

  const latest = state.journal[0];
  preview.innerHTML = `
    <time>${escapeHTML(latest.date)}</time>
    <p>${escapeHTML(latest.body)}</p>
  `;

  state.journal.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "journal-card";
    card.innerHTML = `
      <time>${escapeHTML(entry.date)}</time>
      <h4>${escapeHTML(entry.title)}</h4>
      <p>${escapeHTML(entry.body)}</p>
    `;
    list.append(card);
  });
}

function renderChores(dueChores) {
  renderItemList(document.getElementById("dueChores"), state.chores, "chore", { limit: 4 });

  const list = document.getElementById("choreList");
  list.innerHTML = "";
  if (!state.chores.length) {
    list.append(createEmpty());
    return;
  }

  state.chores.forEach((chore) => {
    const card = document.createElement("article");
    card.className = "chore-card";
    const summary = document.createElement("div");
    summary.innerHTML = `<strong>${escapeHTML(chore.title)}</strong><span>${escapeHTML(chore.repeat)} · ${escapeHTML(chore.owner || "Me")}</span>`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = chore.done ? "Reset" : "Done";
    button.addEventListener("click", () => toggleDone("chore", chore.id));
    card.append(summary, button);
    list.append(card);
  });
}

function renderHabits() {
  const container = document.getElementById("habitList");
  const pageList = document.getElementById("habitPageList");
  container.innerHTML = "";
  pageList.innerHTML = "";

  if (!state.habits.length) {
    container.append(createEmpty());
    pageList.append(createEmpty());
    return;
  }

  state.habits.slice(0, 4).forEach((habit) => {
    const row = document.createElement("div");
    row.className = "habit-row";
    const count = Math.min(5, habit.streak + (habit.doneToday ? 1 : 0));
    row.innerHTML = `
      <span class="habit-symbol">${habit.icon}</span>
      <div>
        <strong>${escapeHTML(habit.title)}</strong>
        <div class="habit-dots">
          ${Array.from({ length: 5 }, (_, index) => `<span class="${index < count ? "filled green" : ""}"></span>`).join("")}
        </div>
      </div>
      <small>${habit.streak} day streak</small>
    `;
    container.append(row);
  });

  state.habits.forEach((habit) => {
    const card = document.createElement("article");
    card.className = "habit-card";
    const status = habit.doneToday ? "Done today" : "Not done yet";
    card.innerHTML = `
      <span class="habit-symbol">${habit.icon}</span>
      <div>
        <h4>${escapeHTML(habit.title)}</h4>
        <span>${habit.streak} day streak · ${status}</span>
      </div>
    `;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = habit.doneToday ? "done-button" : "";
    toggle.textContent = habit.doneToday ? "Undo" : "Done today";
    toggle.addEventListener("click", () => toggleHabit(habit.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeHabit(habit.id));

    card.append(toggle, remove);
    pageList.append(card);
  });
}

function toggleHabit(id) {
  const habit = state.habits.find((entry) => entry.id === id);
  if (!habit) return;

  if (habit.doneToday) {
    habit.doneToday = false;
    habit.streak = Math.max(0, habit.streak - 1);
  } else {
    habit.doneToday = true;
    habit.streak += 1;
  }

  saveAndRender();
}

function removeHabit(id) {
  state.habits = state.habits.filter((habit) => habit.id !== id);
  saveAndRender();
}

function toISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

render();
