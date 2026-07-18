const daysList = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

let workouts = JSON.parse(localStorage.getItem("workouts")) || [];

const daysContainer = document.getElementById("days");
const workoutNameInput = document.getElementById("workoutName");
const daySelect = document.getElementById("daySelect");
const addWorkoutBtn = document.getElementById("addWorkoutBtn");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

/* Undo support: remembers the last deleted workout (and where it was)
   long enough for the user to bring it back via the toast button. */
const UNDO_TIMEOUT_MS = 6000;
let pendingUndo = null; // { workout, index, timeoutId }
let toastEl = null;

function initDayOptions() {
  daySelect.innerHTML = "";

  daysList.forEach((day) => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option);
  });
}

function createId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}

function saveWorkouts() {
  localStorage.setItem("workouts", JSON.stringify(workouts));
}

function addWorkout() {
  const name = workoutNameInput.value.trim();
  const day = daySelect.value;

  if (!name) {
    workoutNameInput.focus();
    return;
  }

  workouts.push({
    id: createId(),
    name: name,
    day: day,
    done: false
  });

  saveWorkouts();
  workoutNameInput.value = "";
  workoutNameInput.focus();
  render();
}

function toggleWorkout(id) {
  workouts = workouts.map((workout) => {
    if (workout.id === id) {
      return {
        ...workout,
        done: !workout.done
      };
    }
    return workout;
  });

  saveWorkouts();
  render();
}

function deleteWorkout(id) {
  const index = workouts.findIndex((workout) => workout.id === id);
  if (index === -1) return;

  const [removed] = workouts.splice(index, 1);
  saveWorkouts();
  render();

  showUndoToast(removed, index);
}

function restoreLastDeleted() {
  if (!pendingUndo) return;

  const { workout, index } = pendingUndo;
  const insertAt = Math.min(index, workouts.length);
  workouts.splice(insertAt, 0, workout);

  saveWorkouts();
  render();
  hideUndoToast();
}

function ensureToastEl() {
  if (toastEl) return toastEl;

  toastEl = document.createElement("div");
  toastEl.id = "undoToast";
  toastEl.className = "undo-toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");

  const message = document.createElement("span");
  message.className = "undo-toast-message";

  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.className = "undo-toast-btn";
  undoBtn.textContent = "Undo";
  undoBtn.addEventListener("click", restoreLastDeleted);

  toastEl.appendChild(message);
  toastEl.appendChild(undoBtn);
  document.body.appendChild(toastEl);

  return toastEl;
}

function showUndoToast(workout, index) {
  if (pendingUndo) {
    clearTimeout(pendingUndo.timeoutId);
  }

  const el = ensureToastEl();
  el.querySelector(".undo-toast-message").textContent = `Deleted "${workout.name}"`;
  el.classList.add("visible");

  const timeoutId = setTimeout(() => {
    pendingUndo = null;
    hideUndoToast();
  }, UNDO_TIMEOUT_MS);

  pendingUndo = { workout, index, timeoutId };
}

function hideUndoToast() {
  if (toastEl) {
    toastEl.classList.remove("visible");
  }
}

function updateStats() {
  const total = workouts.length;
  const completed = workouts.filter((workout) => workout.done).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalCount").textContent = total;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("progressCount").textContent = progress + "%";
}

function render() {
  daysContainer.innerHTML = "";

  daysList.forEach((day) => {
    const dayWorkouts = workouts.filter((workout) => workout.day === day);

    const dayColumn = document.createElement("div");
    dayColumn.className = "day";

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("h3");
    title.textContent = day;

    const badge = document.createElement("span");
    badge.className = "day-badge";
    badge.textContent = dayWorkouts.length;

    header.appendChild(title);
    header.appendChild(badge);
    dayColumn.appendChild(header);

    const list = document.createElement("div");
    list.className = "workout-list";

    if (dayWorkouts.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-text";
      empty.textContent = "No workout planned yet.";
      list.appendChild(empty);
    } else {
      dayWorkouts.forEach((workout) => {
        const item = document.createElement("div");
        item.className = workout.done ? "workout completed" : "workout";

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "toggle-btn";
        toggleBtn.type = "button";
        toggleBtn.setAttribute("aria-label", "Toggle workout completion");
        toggleBtn.addEventListener("click", () => toggleWorkout(workout.id));

        const nameBtn = document.createElement("button");
        nameBtn.className = "workout-name-btn";
        nameBtn.type = "button";
        nameBtn.textContent = workout.name;
        nameBtn.addEventListener("click", () => toggleWorkout(workout.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "✕";
        deleteBtn.setAttribute("aria-label", `Delete ${workout.name}`);
        deleteBtn.addEventListener("click", () => deleteWorkout(workout.id));

        item.appendChild(toggleBtn);
        item.appendChild(nameBtn);
        item.appendChild(deleteBtn);
        list.appendChild(item);
      });
    }

    dayColumn.appendChild(list);
    daysContainer.appendChild(dayColumn);
  });

  updateStats();
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeIcon.textContent = "☀️";
    themeText.textContent = "Light Mode";
  } else {
    document.body.classList.remove("dark");
    themeIcon.textContent = "🌙";
    themeText.textContent = "Dark Mode";
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    applyTheme(savedTheme);
    return;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";

  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
}

addWorkoutBtn.addEventListener("click", addWorkout);
themeToggle.addEventListener("click", toggleTheme);

workoutNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addWorkout();
  }
});

initDayOptions();
loadTheme();
render();
