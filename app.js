const taskForm = document.querySelector("#task-form");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const formMessage = document.querySelector("#form-message");
const connectionMessage = document.querySelector("#connection-message");
const filterButtons = document.querySelectorAll(".filter-button");

let tasks = [];
let activeFilter = "all";

const today = new Date();
document.querySelector("#today").textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(today);

function statusOf(task) {
  if (task.completed) return "Completed";
  if (task.due_date && task.due_date < localIsoDate()) return "Overdue";
  return "Open";
}

function localIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDueDate(value) {
  if (!value) return "No deadline";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(
    new Date(year, month - 1, day),
  );
}

function makeTaskElement(task) {
  const item = document.createElement("li");
  const status = statusOf(task);
  item.className = `task-item${task.completed ? " is-completed" : ""}${status === "Overdue" ? " is-overdue" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.className = "task-check";
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.completed);
  checkbox.setAttribute("aria-label", `${task.completed ? "Reopen" : "Complete"} ${task.title}`);
  checkbox.addEventListener("change", () => updateTask(task.id, checkbox.checked));

  const details = document.createElement("div");
  details.className = "task-details";
  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;
  const metadata = document.createElement("div");
  metadata.className = "task-metadata";

  const due = document.createElement("span");
  due.className = `task-due${status === "Overdue" ? " overdue-text" : ""}`;
  due.textContent = status === "Overdue" ? `Overdue · ${formatDueDate(task.due_date)}` : formatDueDate(task.due_date);
  metadata.append(due);

  const priority = document.createElement("span");
  priority.className = `priority priority-${task.priority.toLowerCase()}`;
  priority.textContent = task.priority;
  metadata.append(priority);
  details.append(title, metadata);

  const removeButton = document.createElement("button");
  removeButton.className = "remove-button";
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.setAttribute("aria-label", `Remove ${task.title}`);
  removeButton.addEventListener("click", () => deleteTask(task.id));

  item.append(checkbox, details, removeButton);
  return item;
}

function render() {
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "open") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });

  taskList.replaceChildren(...filteredTasks.map(makeTaskElement));
  emptyState.hidden = filteredTasks.length > 0;
  if (filteredTasks.length === 0) {
    const emptyTitle = emptyState.querySelector(".empty-title");
    const emptyCopy = emptyState.querySelector(".empty-copy");
    if (tasks.length === 0) {
      emptyTitle.textContent = "Nothing on the list";
      emptyCopy.textContent = "Add a task to start shaping your study plan.";
    } else if (activeFilter === "open") {
      emptyTitle.textContent = "All caught up";
      emptyCopy.textContent = "There are no open tasks in this view.";
    } else {
      emptyTitle.textContent = "No completed tasks yet";
      emptyCopy.textContent = "Completed tasks will show up here.";
    }
  }

  const openCount = tasks.filter((task) => !task.completed).length;
  const overdueCount = tasks.filter((task) => statusOf(task) === "Overdue").length;
  const doneCount = tasks.length - openCount;
  const completion = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  document.querySelector("#open-count").textContent = openCount;
  document.querySelector("#overdue-count").textContent = overdueCount;
  document.querySelector("#done-count").textContent = doneCount;
  document.querySelector("#all-filter-count").textContent = tasks.length;
  document.querySelector("#task-total").textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  document.querySelector("#progress-label").textContent = tasks.length ? `${completion}% complete` : "No tasks yet";
  document.querySelector("#progress-count").textContent = `${doneCount} / ${tasks.length}`;
  document.querySelector("#progress-fill").style.width = `${completion}%`;
  document.querySelector(".progress-track").setAttribute("aria-valuenow", completion);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Something went wrong. Please try again.");
  }
  return response.status === 204 ? null : response.json();
}

async function loadTasks() {
  try {
    tasks = await request("/api/tasks");
    connectionMessage.hidden = true;
    render();
  } catch (error) {
    connectionMessage.textContent = `Could not connect to the planner: ${error.message}`;
    connectionMessage.hidden = false;
    emptyState.hidden = true;
  }
}

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  const fields = new FormData(taskForm);
  try {
    const task = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: fields.get("title"),
        due_date: fields.get("due_date"),
        priority: fields.get("priority"),
      }),
    });
    tasks.push(task);
    taskForm.reset();
    document.querySelector("#task-priority").value = "Medium";
    activeFilter = "all";
    setActiveFilterButton();
    render();
    document.querySelector("#task-title").focus();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

async function updateTask(taskId, completed) {
  try {
    const task = await request(`/api/tasks/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
    tasks = tasks.map((item) => item.id === task.id ? task : item);
    render();
  } catch (error) {
    connectionMessage.textContent = error.message;
    connectionMessage.hidden = false;
    render();
  }
}

async function deleteTask(taskId) {
  try {
    await request(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
    tasks = tasks.filter((task) => task.id !== taskId);
    render();
  } catch (error) {
    connectionMessage.textContent = error.message;
    connectionMessage.hidden = false;
  }
}

function setActiveFilterButton() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    setActiveFilterButton();
    render();
  });
});

loadTasks();