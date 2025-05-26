// Modern To-Do List App with Advanced Features
window.addEventListener("DOMContentLoaded", function() {

// ---- Data Structures ----
let tasks = [];
let points = 0;
let customizations = {
  theme: 'light',
  font: 'Inter',
  accent: '#ff9f43'
};
const THEMES = [
  { key: 'light', name: 'Light', unlock: 0 },
  { key: 'dark', name: 'Dark', unlock: 0 },
  { key: 'sunset', name: 'Sunset', unlock: 20 },
  { key: 'forest', name: 'Forest', unlock: 30 },
  { key: 'ocean', name: 'Ocean', unlock: 40 }
];
const FONTS = [
  { family: 'Inter', name: 'Default', unlock: 0 },
  { family: 'Roboto', name: 'Roboto', unlock: 15 },
  { family: 'Fira Sans', name: 'Fira Sans', unlock: 25 },
  { family: 'Caveat', name: 'Caveat (Handwritten)', unlock: 40 }
];
const ACCENTS = [
  { color: '#ff9f43', name: 'Orange', unlock: 0 },
  { color: '#65d26e', name: 'Green', unlock: 10 },
  { color: '#4e8cff', name: 'Blue', unlock: 15 },
  { color: '#ff5959', name: 'Red', unlock: 20 },
  { color: '#f7b267', name: 'Gold', unlock: 30 }
];

// ---- Storage Keys ----
const STORAGE_KEY = 'modern_todo_tasks';
const POINTS_KEY = 'modern_todo_points';
const CUSTOM_KEY = 'modern_todo_custom';

// ---- DOM Elements ----
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoDue = document.getElementById('todo-due');
const todoRepeat = document.getElementById('todo-repeat');
const todoList = document.getElementById('todo-list');
const searchInput = document.getElementById('search-input');
const tabs = document.querySelectorAll('.tab');
const pointsEl = document.getElementById('points');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const customizeBtn = document.getElementById('customize-btn');
const customizeModal = document.getElementById('customize-modal');
const customizeClose = document.getElementById('customize-close');
const themeOptions = document.getElementById('theme-options');
const fontOptions = document.getElementById('font-options');
const accentOptions = document.getElementById('accent-options');
const noTasks = document.getElementById('no-tasks');
const progressText = document.getElementById('progress-text');

// ---- State ----
let activeTab = 'all';
let searchQuery = '';
let notificationPermission = false;

// ---- Utility Functions ----
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function loadTasks() {
  const data = localStorage.getItem(STORAGE_KEY);
  tasks = data ? JSON.parse(data) : [];
}
function savePoints() {
  localStorage.setItem(POINTS_KEY, String(points));
}
function loadPoints() {
  points = parseInt(localStorage.getItem(POINTS_KEY) || '0', 10);
}
function saveCustom() {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customizations));
}
function loadCustom() {
  const data = localStorage.getItem(CUSTOM_KEY);
  if (data) customizations = JSON.parse(data);
}
function uid() {
  return '_' + Math.random().toString(36).slice(2, 10);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function isOverdue(task) {
  if (!task.due) return false;
  return !task.completed && new Date(task.due) < new Date(todayStr());
}
function isDueToday(task) {
  if (!task.due) return false;
  const due = new Date(task.due);
  const today = new Date(todayStr());
  return !task.completed &&
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate();
}
function recurrenceText(r) {
  if (r === 'daily') return '🔁 Daily';
  if (r === 'weekly') return '🔁 Weekly';
  if (r === 'monthly') return '🔁 Monthly';
  return '';
}
function notify(title, body) {
  if (notificationPermission) {
    new Notification(title, { body });
  }
}
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(p => {
      notificationPermission = (p === 'granted');
    });
  }
}

// ---- Render Functions ----
function renderPoints() {
  pointsEl.textContent = `⭐ ${points}`;
}
function renderTasks() {
  let filtered = tasks;
  // Tabs
  if (activeTab === 'active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (activeTab === 'completed') {
    filtered = filtered.filter(t => t.completed);
  } else if (activeTab === 'due') {
    filtered = filtered.filter(isDueToday);
  } else if (activeTab === 'overdue') {
    filtered = filtered.filter(isOverdue);
  }
  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(t => t.text.toLowerCase().includes(q));
  }
  // Sort: incomplete first, then closest due, then newest
  filtered = filtered.slice().sort((a, b) => {
    if (a.completed !== b.completed) return a.completed - b.completed;
    if (a.due && b.due) return new Date(a.due) - new Date(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return new Date(b.created) - new Date(a.created);
  });

  todoList.innerHTML = '';
  noTasks.style.display = filtered.length ? 'none' : 'block';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.completed ? ' completed' : '');
    li.setAttribute('draggable', 'true');
    li.dataset.id = task.id;

    // Checkbox
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'todo-check';
    check.checked = task.completed;
    check.addEventListener('change', () => toggleComplete(task.id));
    li.appendChild(check);

    // Editable text
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.tabIndex = 0;
    span.textContent = task.text;
    span.title = "Double-click to edit";
    span.addEventListener('dblclick', () => editTask(span, task));
    li.appendChild(span);

    // Due date
    if (task.due) {
      const due = document.createElement('span');
      due.className = 'todo-date';
      due.textContent = `📅 ${task.due}`;
      if (isOverdue(task)) {
        due.style.color = '#ff5959';
        due.title = 'Overdue!';
      } else if (isDueToday(task)) {
        due.style.color = '#ffbe21';
        due.title = 'Due today!';
      }
      li.appendChild(due);
    }
    // Recurrence
    if (task.repeat) {
      const rep = document.createElement('span');
      rep.className = 'todo-repeat';
      rep.textContent = recurrenceText(task.repeat);
      li.appendChild(rep);
    }
    // Actions
    const actions = document.createElement('span');
    actions.className = 'todo-actions';
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit';
    editBtn.onclick = () => editTask(span, task);
    actions.appendChild(editBtn);
    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn';
    delBtn.innerHTML = '✕';
    delBtn.title = 'Delete';
    delBtn.onclick = () => deleteTask(task.id);
    actions.appendChild(delBtn);
    li.appendChild(actions);

    todoList.appendChild(li);
  });

  renderProgress();
  // Re-enable drag and drop
  setupDragAndDrop();
}

function renderProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  if (total === 0) {
    progressText.textContent = '';
    return;
  }
  let percent = Math.round(100 * done / total);
  let color = 'var(--progress-ok)';
  if (percent < 30) color = 'var(--progress-bad)';
  else if (percent < 75) color = 'var(--progress-warn)';
  progressText.innerHTML = `<span style="color:${color}">${done}/${total} completed (${percent}%)</span>`;
}

// ---- Task Actions ----
function addTask(text, due, repeat) {
  const task = {
    id: uid(),
    text,
    completed: false,
    due: due || '',
    repeat: repeat || '',
    created: new Date().toISOString()
  };
  tasks.push(task);
  saveTasks();
  renderTasks();
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  // Earn points!
  if (task.completed) {
    earnPoints(3 + (task.repeat ? 2 : 0));
    // If recurring, auto-schedule next
    if (task.repeat) {
      scheduleRecurring(task);
    }
    // Notification
    notify("🎉 Task Completed!", task.text);
  }
  saveTasks();
  renderTasks();
}

function editTask(span, task) {
  // Inline edit
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.maxLength = 120;
  input.className = 'todo-text';
  input.style.width = '96%';
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      done();
    } else if (e.key === 'Escape') {
      span.style.display = '';
      input.remove();
    }
  });
  input.addEventListener('blur', done);
  span.parentNode.replaceChild(input, span);
  input.focus();
  input.select();

  function done() {
    let val = input.value.trim();
    if (!val) val = task.text;
    task.text = val;
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  const idx = tasks.findIndex(t => t.id === id);
  if (idx > -1) {
    tasks.splice(idx, 1);
    saveTasks();
    renderTasks();
  }
}

function scheduleRecurring(task) {
  let nextDate = '';
  if (!task.due) return;
  const dt = new Date(task.due);
  if (task.repeat === 'daily') {
    dt.setDate(dt.getDate() + 1);
    nextDate = dt.toISOString().slice(0, 10);
  } else if (task.repeat === 'weekly') {
    dt.setDate(dt.getDate() + 7);
    nextDate = dt.toISOString().slice(0, 10);
  } else if (task.repeat === 'monthly') {
    dt.setMonth(dt.getMonth() + 1);
    nextDate = dt.toISOString().slice(0, 10);
  }
  // Add the next occurrence as a new task
  if (nextDate) {
    addTask(task.text, nextDate, task.repeat);
  }
}

// ---- Points & Customization ----
function earnPoints(n) {
  points += n;
  savePoints();
  renderPoints();
}

function spendPoints(n) {
  if (points >= n) {
    points -= n;
    savePoints();
    renderPoints();
    return true;
  }
  alert("Not enough points!");
  return false;
}

function renderCustomizationOptions() {
  // Theme options
  themeOptions.innerHTML = '';
  THEMES.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'theme-option' + (customizations.theme === t.key ? ' selected' : '');
    btn.disabled = points < t.unlock;
    btn.textContent = `${t.name}${t.unlock ? ` (${t.unlock}⭐)` : ""}`;
    btn.onclick = (e) => {
      e.preventDefault();
      if (points >= t.unlock) {
        customizations.theme = t.key;
        saveCustom();
        applyCustomizations();
        renderCustomizationOptions();
      } else {
        alert(`Earn ${t.unlock} points to unlock this theme!`);
      }
    };
    themeOptions.appendChild(btn);
  });
  // Font options
  fontOptions.innerHTML = '';
  FONTS.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'font-option' + (customizations.font === f.family ? ' selected' : '');
    btn.disabled = points < f.unlock;
    btn.textContent = `${f.name}${f.unlock ? ` (${f.unlock}⭐)` : ""}`;
    btn.onclick = (e) => {
      e.preventDefault();
      if (points >= f.unlock) {
        customizations.font = f.family;
        saveCustom();
        applyCustomizations();
        renderCustomizationOptions();
      } else {
        alert(`Earn ${f.unlock} points to unlock this font!`);
      }
    };
    fontOptions.appendChild(btn);
  });
  // Accent options
  accentOptions.innerHTML = '';
  ACCENTS.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'accent-option' + (customizations.accent === a.color ? ' selected' : '');
    btn.disabled = points < a.unlock;
    btn.title = a.name + (a.unlock ? ` (${a.unlock}⭐)` : '');
    btn.innerHTML = `<span class="color-block" style="background:${a.color};"></span>`;
    btn.onclick = (e) => {
      e.preventDefault();
      if (points >= a.unlock) {
        customizations.accent = a.color;
        saveCustom();
        applyCustomizations();
        renderCustomizationOptions();
      } else {
        alert(`Earn ${a.unlock} points to unlock this accent color!`);
      }
    };
    accentOptions.appendChild(btn);
  });
}

function applyCustomizations() {
  // Theme
  let theme = customizations.theme;
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  // Special themes: sunset, forest, ocean
  if (theme === 'sunset') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.setProperty('--background', '#ffecd2');
    document.documentElement.style.setProperty('--container-bg', '#fff1e1');
    document.documentElement.style.setProperty('--primary', '#ff6a3d');
    document.documentElement.style.setProperty('--accent', '#ff9f43');
    document.documentElement.style.setProperty('--text', '#3f2d2d');
  } else if (theme === 'forest') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('--background', '#203820');
    document.documentElement.style.setProperty('--container-bg', '#284e36');
    document.documentElement.style.setProperty('--primary', '#65d26e');
    document.documentElement.style.setProperty('--accent', '#f7b267');
    document.documentElement.style.setProperty('--text', '#e1ffe1');
  } else if (theme === 'ocean') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('--background', '#182c3e');
    document.documentElement.style.setProperty('--container-bg', '#20364e');
    document.documentElement.style.setProperty('--primary', '#4e8cff');
    document.documentElement.style.setProperty('--accent', '#f7b267');
    document.documentElement.style.setProperty('--text', '#e5f7ff');
  } else {
    // Reset to standard
    document.documentElement.style.removeProperty('--background');
    document.documentElement.style.removeProperty('--container-bg');
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--text');
  }
  // Font
  document.documentElement.style.setProperty('--font', `'${customizations.font}', Arial, sans-serif`);
  // Accent color
  document.documentElement.style.setProperty('--accent', customizations.accent);
}

// ---- Drag and Drop ----
function setupDragAndDrop() {
  if (window.Sortable && todoList && !todoList._sortableAttached) {
    Sortable.create(todoList, {
      animation: 150,
      handle: '.todo-item',
      onEnd: function(evt) {
        // Rearrange tasks array to match new order
        const newOrder = Array.from(todoList.children).map(li => li.dataset.id);
        tasks.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
        saveTasks();
        renderTasks();
      }
    });
    todoList._sortableAttached = true;
  }
}

// ---- Search, Tabs, and Filtering ----
searchInput.addEventListener('input', function() {
  searchQuery = this.value;
  renderTasks();
});
tabs.forEach(tab => {
  tab.addEventListener('click', function() {
    tabs.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    activeTab = this.dataset.tab;
    renderTasks();
  });
});

// ---- Form Submission ----
todoForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const text = todoInput.value.trim();
  const due = todoDue.value;
  const repeat = todoRepeat.value;
  if (!text) return;
  addTask(text, due, repeat);
  todoInput.value = '';
  todoDue.value = '';
  todoRepeat.value = '';
});

// ---- Modal for Customization ----
customizeBtn.addEventListener('click', function() {
  customizeModal.style.display = 'flex';
  renderCustomizationOptions();
});
customizeClose.addEventListener('click', function() {
  customizeModal.style.display = 'none';
});
window.addEventListener('click', function(e) {
  if (e.target === customizeModal) {
    customizeModal.style.display = 'none';
  }
});

// ---- Dark Mode Toggle ----
darkModeToggle.addEventListener('click', function() {
  if (customizations.theme === 'dark') {
    customizations.theme = 'light';
  } else {
    customizations.theme = 'dark';
  }
  saveCustom();
  applyCustomizations();
  renderCustomizationOptions();
});

// ---- Notifications ----
function handleDueNotifications() {
  if (!notificationPermission) return;
  // Notify for any tasks due today (on page load)
  tasks.forEach(task => {
    if (isDueToday(task) && !task.completed) {
      notify("📅 Task Due!", task.text);
    }
  });
}

// ---- Initialization ----
function init() {
  loadTasks();
  loadPoints();
  loadCustom();
  renderPoints();
  applyCustomizations();
  renderTasks();
  requestNotificationPermission();
  handleDueNotifications();

  // Load Google Fonts for custom fonts
  let fontLinks = '';
  FONTS.forEach(f => {
    if (f.family === 'Roboto') fontLinks += '@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");';
    if (f.family === 'Fira Sans') fontLinks += '@import url("https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;700&display=swap");';
    if (f.family === 'Caveat') fontLinks += '@import url("https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap");';
  });
  if (fontLinks) {
    const style = document.createElement('style');
    style.innerHTML = fontLinks;
    document.head.appendChild(style);
  }
}
init();

// ---- Recurring Notifications (poll every 30s) ----
setInterval(() => {
  handleDueNotifications();
}, 30000);

});
