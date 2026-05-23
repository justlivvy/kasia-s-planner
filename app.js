const todayISO = new Date().toISOString().slice(0, 10);
const storageKey = "bloom-organiser-state";

const defaultState = {
  mood: "",
  reflection: "",
  monthOffset: 0,
  tasks: [
    { id: crypto.randomUUID(), title: "Study for math quiz", cadence: "Daily", priority: "High", date: todayISO, time: "9:00 AM", done: true },
    { id: crypto.randomUUID(), title: "Finish English essay", cadence: "Daily", priority: "High", date: todayISO, time: "11:30 AM", done: false },
    { id: crypto.randomUUID(), title: "Workout", cadence: "Daily", priority: "Medium", date: todayISO, time: "4:00 PM", done: false },
    { id: crypto.randomUUID(), title: "Read 20 pages", cadence: "Weekly", priority: "Low", date: todayISO, time: "7:00 PM", done: false },
    { id: crypto.randomUUID(), title: "Skincare routine", cadence: "Daily", priority: "Low", date: todayISO, time: "9:30 PM", done: false }
  ],
  chores: [
    { id: crypto.randomUUID(), title: "Make the bed", repeat: "Today", owner: "Done", done: true },
    { id: crypto.randomUUID(), title: "Wash dishes", repeat: "Today", owner: "Me", done: false },
    { id: crypto.randomUUID(), title: "Laundry", repeat: "Tomorrow", owner: "Me", done: false },
    { id: crypto.randomUUID(), title: "Vacuum room", repeat: "May 26", owner: "Me", done: false }
  ],
  journal: [
    {
      id: crypto.randomUUID(),
      title: "Productive day",
      body: "Today was such a productive day! I finished two chapters of my book and went for a nice walk in the evening. Feeling grateful for the little things.",
      date: "May 23, 2024"
    }
  ]
};

let state = loadState();

const views = document.querySelectorAll(".view");
const navTabs = document.querySelectorAll(".nav-tab");
const viewTitle = document.getElementById("viewTitle");
const todayLabel = document.getElementById("todayLabel");
const emptyTemplate = document.getElementById("emptyTemplate");

const titles = {
  dashboard: "Good morning! ✿",
  tasks: "Organise the week",
  calendar: "See what's next",
  journal: "Write it down",
  chores: "Keep home moving"
};

const subtitles = {
  dashboard: "Let's make today amazing!",
  tasks: "Sort daily, weekly, and monthly goals.",
  calendar: "Plan the dates that matter.",
  journal: "A calm place for thoughts.",
  chores: "Keep the routine simple."
};

document.getElementById("taskDate").value = todayISO;

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

document.querySelectorAll("[data-view-link]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewLink));
});

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

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...defaultState, ...saved } : defaultState;
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
  viewTitle.textContent = titles[id];
  todayLabel.textContent = subtitles[id];
}

function createEmpty() {
  return emptyTemplate.content.firstElementChild.cloneNode(true);
}

function render() {
  const todayTasks = state.tasks.filter((task) => task.date === todayISO || task.cadence === "Daily");
  const doneTasks = todayTasks.filter((task) => task.done).length;
  const dueChores = state.chores.filter((chore) => !chore.done);
  const doneChores = state.chores.filter((chore) => chore.done).length;

  document.getElementById("taskTotal").textContent = todayTasks.length;
  document.getElementById("doneCount").textContent = doneTasks;
  document.getElementById("choreTotal").textContent = dueChores.length;
  document.getElementById("choreDoneCount").textContent = doneChores;
  document.getElementById("streakCount").textContent = Math.max(1, Math.min(12, doneTasks + doneChores + 7));

  renderMood();
  renderTaskLists(todayTasks);
  renderCalendar();
  renderJournal();
  renderChores(dueChores);
  renderHabits();
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
  const base = new Date();
  const date = new Date(base.getFullYear(), base.getMonth() + state.monthOffset, 1);
  const year = date.getFullYear();
  const month = date.getMonth();
  monthLabel.textContent = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);

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
    state.tasks
      .filter((task) => task.date === iso)
      .slice(0, 3)
      .forEach((task) => {
        const chip = document.createElement("span");
        chip.className = "calendar-chip";
        chip.textContent = task.title;
        cell.append(chip);
      });
    grid.append(cell);
  }
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
  const habits = [
    { icon: "💧", title: "Drink water", streak: "6 day streak", count: 5, color: "green" },
    { icon: "▤", title: "Read", streak: "5 day streak", count: 4, color: "green" },
    { icon: "H", title: "Workout", streak: "3 day streak", count: 4, color: "orange" },
    { icon: "♧", title: "Meditate", streak: "4 day streak", count: 3, color: "purple" }
  ];
  const container = document.getElementById("habitList");
  container.innerHTML = "";

  habits.forEach((habit) => {
    const row = document.createElement("div");
    row.className = "habit-row";
    row.innerHTML = `
      <span class="habit-symbol">${habit.icon}</span>
      <div>
        <strong>${escapeHTML(habit.title)}</strong>
        <div class="habit-dots">
          ${Array.from({ length: 5 }, (_, index) => `<span class="${index < habit.count ? `filled ${habit.color}` : ""}"></span>`).join("")}
        </div>
      </div>
      <small>${escapeHTML(habit.streak)}</small>
    `;
    container.append(row);
  });
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
