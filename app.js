/* =============================================
   PERSONAL DASHBOARD — Vanilla JS
   Features: Greeting, Timer, Todo, Quick Links
   Challenges: Dark Mode, Custom Name, Custom Pomodoro Time
   ============================================= */

// ── Helpers ──────────────────────────────────
const $ = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);

function saveLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function loadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function showNotification(msg, icon = '✅') {
  const el = $('notification');
  el.querySelector('.notif-text').textContent = msg;
  el.querySelector('.notif-icon').textContent = icon;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── 1. THEME (Challenge: Light / Dark Mode) ──
let currentTheme = loadLS('theme', 'light');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('themeToggle');
  btn.querySelector('.icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.querySelector('.label').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  currentTheme = theme;
  saveLS('theme', theme);
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// ── 2. GREETING & CLOCK ───────────────────────
let userName = loadLS('userName', '');

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

function updateClock() {
  const now = new Date();
  const h   = now.getHours();
  const m   = now.getMinutes().toString().padStart(2, '0');
  const s   = now.getSeconds().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = (h % 12 || 12).toString().padStart(2, '0');

  $('timeDisplay').textContent = `${h12}:${m}:${s} ${ampm}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  $('dateDisplay').textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const greeting = getGreeting(h);
  const name = userName ? `, <span class="greeting-name">${userName}</span>` : '';
  $('greetingText').innerHTML = `${greeting}${name}! 👋`;
}

function saveName() {
  const val = $('nameInput').value.trim();
  if (!val) return;
  userName = val;
  saveLS('userName', userName);
  $('nameInput').value = '';
  updateClock();
  showNotification(`Name saved as "${userName}"`, '👤');
}

function clearName() {
  userName = '';
  saveLS('userName', '');
  $('nameInput').value = '';
  updateClock();
}

// ── 3. FOCUS TIMER (Challenge: Change Pomodoro Time) ─
let timerDuration  = loadLS('timerDuration', 25);  // minutes
let timerRemaining = timerDuration * 60;             // seconds
let timerRunning   = false;
let timerInterval  = null;
let timerMode      = 'focus'; // 'focus'

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  $('timerTime').textContent = formatTime(timerRemaining);
  const total = timerDuration * 60;
  const pct   = timerRemaining / total * 100;
  $('timerProgressBar').style.width = pct + '%';
}

function setTimerStatus(status) {
  const el = $('timerStatus');
  el.className = 'timer-status ' + status;
  if      (status === 'running') el.textContent = '▶ Timer is running…';
  else if (status === 'paused')  el.textContent = '⏸ Paused';
  else                           el.textContent = 'Ready to focus';
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  setTimerStatus('running');
  timerInterval = setInterval(() => {
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerRemaining = 0;
      updateTimerDisplay();
      setTimerStatus('');
      showNotification('⏰ Time is up! Great focus session!', '🎉');
      // browser notification
      if (Notification.permission === 'granted') {
        new Notification('Focus Timer', { body: 'Session complete! Take a break.' });
      }
      return;
    }
    timerRemaining--;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  setTimerStatus('paused');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerRemaining = timerDuration * 60;
  updateTimerDisplay();
  setTimerStatus('');
}

function applyCustomTime() {
  const val = parseInt($('customMinutes').value, 10);
  if (isNaN(val) || val < 1 || val > 180) {
    showNotification('Please enter a time between 1 and 180 minutes.', '⚠️');
    return;
  }
  timerDuration  = val;
  timerRemaining = val * 60;
  timerRunning   = false;
  clearInterval(timerInterval);
  saveLS('timerDuration', timerDuration);
  updateTimerDisplay();
  setTimerStatus('');
  showNotification(`Timer set to ${val} minutes`, '⏱️');
}

// ── 4. TO-DO LIST (Challenge: Prevent Duplicates & Sort) ──
let todos     = loadLS('todos', []);
let sortOrder = loadLS('sortOrder', 'default'); // 'default' | 'asc' | 'done'

function getSortedTodos() {
  const copy = [...todos];
  if (sortOrder === 'asc') {
    copy.sort((a, b) => a.text.localeCompare(b.text));
  } else if (sortOrder === 'done') {
    copy.sort((a, b) => Number(a.done) - Number(b.done));
  }
  return copy;
}

function renderTodos() {
  const list = $('todoList');
  const sorted = getSortedTodos();

  if (sorted.length === 0) {
    list.innerHTML = '<li class="todo-empty">No tasks yet. Add one above!</li>';
    return;
  }

  list.innerHTML = sorted.map(todo => `
    <li class="todo-item ${todo.done ? 'done' : ''}" data-id="${todo.id}">
      <button class="todo-check btn-icon" onclick="toggleTodo('${todo.id}')" title="${todo.done ? 'Mark undone' : 'Mark done'}">
        ${todo.done ? '✓' : ''}
      </button>
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn-icon edit" onclick="startEditTodo('${todo.id}')" title="Edit">✏️</button>
        <button class="btn-icon del"  onclick="deleteTodo('${todo.id}')" title="Delete">🗑️</button>
      </div>
    </li>
  `).join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function addTodo() {
  const input = $('todoInput');
  const text  = input.value.trim();
  const warn  = $('duplicateWarning');

  if (!text) return;

  // Challenge: prevent duplicates (case-insensitive)
  const dup = todos.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (dup) {
    warn.classList.add('show');
    input.focus();
    return;
  }

  warn.classList.remove('show');
  todos.push({ id: Date.now().toString(), text, done: false });
  saveLS('todos', todos);
  input.value = '';
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveLS('todos', todos);
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveLS('todos', todos);
  renderTodos();
}

function startEditTodo(id) {
  const item = document.querySelector(`.todo-item[data-id="${id}"]`);
  if (!item) return;
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const textSpan = item.querySelector('.todo-text');
  const actions  = item.querySelector('.todo-actions');
  const original = todo.text;

  textSpan.outerHTML =
    `<input class="todo-edit-input" id="edit_${id}" value="${escapeHtml(original)}" maxlength="200" />`;
  actions.innerHTML =
    `<button class="btn-icon edit" onclick="saveEditTodo('${id}')" title="Save">💾</button>
     <button class="btn-icon del"  onclick="cancelEditTodo('${id}', '${escapeHtml(original)}')" title="Cancel">✕</button>`;

  const inp = $(`edit_${id}`);
  if (inp) { inp.focus(); inp.select(); }
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveEditTodo(id);
    if (e.key === 'Escape') cancelEditTodo(id, original);
  });
}

function saveEditTodo(id) {
  const inp  = $(`edit_${id}`);
  if (!inp) return;
  const newText = inp.value.trim();
  if (!newText) return;

  // prevent duplicate on edit
  const dup = todos.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
  if (dup) {
    inp.style.borderColor = 'var(--danger)';
    inp.title = 'Duplicate task!';
    showNotification('A task with that name already exists.', '⚠️');
    return;
  }

  todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
  saveLS('todos', todos);
  renderTodos();
}

function cancelEditTodo(id, original) {
  todos = todos.map(t => t.id === id ? { ...t, text: original } : t);
  renderTodos();
}

function setSortOrder(order) {
  sortOrder = order;
  saveLS('sortOrder', sortOrder);
  document.querySelectorAll('.btn-sort').forEach(b => b.classList.remove('active'));
  document.querySelector(`.btn-sort[data-sort="${order}"]`)?.classList.add('active');
  renderTodos();
}

// ── 5. QUICK LINKS ────────────────────────────
let links = loadLS('links', [
  { id: '1', name: 'Google',   url: 'https://google.com'    },
  { id: '2', name: 'YouTube',  url: 'https://youtube.com'   },
  { id: '3', name: 'GitHub',   url: 'https://github.com'    },
]);

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return ''; }
}

function renderLinks() {
  const grid = $('linksGrid');
  if (links.length === 0) {
    grid.innerHTML = '<p class="links-empty">No links yet. Add one above!</p>';
    return;
  }

  grid.innerHTML = links.map(link => `
    <div class="link-btn" onclick="openLink('${link.url}')">
      <img class="link-favicon" src="${getFaviconUrl(link.url)}" alt="" onerror="this.style.display='none'">
      <span>${escapeHtml(link.name)}</span>
      <button class="link-delete" onclick="deleteLink(event, '${link.id}')" title="Remove">✕</button>
    </div>
  `).join('');
}

function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function addLink() {
  const name = $('linkName').value.trim();
  let   url  = $('linkUrl').value.trim();

  if (!name || !url) {
    showNotification('Please enter both a name and a URL.', '⚠️');
    return;
  }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  links.push({ id: Date.now().toString(), name, url });
  saveLS('links', links);
  $('linkName').value = '';
  $('linkUrl').value  = '';
  renderLinks();
  showNotification(`Link "${name}" added!`, '🔗');
}

function deleteLink(event, id) {
  event.stopPropagation();
  links = links.filter(l => l.id !== id);
  saveLS('links', links);
  renderLinks();
}

// ── Event Listeners ────────────────────────────
function setupEvents() {
  // Theme
  $('themeToggle').addEventListener('click', toggleTheme);

  // Name
  $('saveName').addEventListener('click', saveName);
  $('clearName').addEventListener('click', clearName);
  $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });

  // Timer
  $('startTimer').addEventListener('click', startTimer);
  $('stopTimer').addEventListener('click', stopTimer);
  $('resetTimer').addEventListener('click', resetTimer);
  $('applyTime').addEventListener('click', applyCustomTime);

  // Todo
  $('addTodo').addEventListener('click', addTodo);
  $('todoInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
  $('todoInput').addEventListener('input', () => {
    $('duplicateWarning').classList.remove('show');
  });
  document.querySelectorAll('.btn-sort').forEach(btn => {
    btn.addEventListener('click', () => setSortOrder(btn.dataset.sort));
  });

  // Links
  $('addLink').addEventListener('click', addLink);
  $('linkUrl').addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

  // Browser notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ── Init ───────────────────────────────────────
function init() {
  applyTheme(currentTheme);
  updateClock();
  setInterval(updateClock, 1000);

  $('customMinutes').value = timerDuration;
  updateTimerDisplay();
  setTimerStatus('');

  renderTodos();
  document.querySelector(`.btn-sort[data-sort="${sortOrder}"]`)?.classList.add('active');

  renderLinks();
  setupEvents();
}

document.addEventListener('DOMContentLoaded', init);