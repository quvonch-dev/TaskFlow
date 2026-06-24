// ── State ──
let tasks = JSON.parse(localStorage.getItem('taskflow-tasks') || '[]');
let activeFilter = 'all';
let activeCat    = 'all';

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  setDateLabel();
  bindEvents();
  if (tasks.length === 0) seedDemoTasks();
  render();
});

function setDateLabel() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date-label').textContent = now.toLocaleDateString('uz-UZ', opts);
}

function seedDemoTasks() {
  tasks = [
    { id: uid(), text: "GitHub loyihasini yaratish", priority: "high",   cat: "work",     due: today(), done: false },
    { id: uid(), text: "README.md yozish",           priority: "medium", cat: "work",     due: today(), done: false },
    { id: uid(), text: "Ertalab yugurish",            priority: "low",    cat: "health",   due: "",      done: true  },
    { id: uid(), text: "JavaScript kitobini o'qish",  priority: "medium", cat: "learning", due: "",      done: false },
  ];
  save();
}

// ── Bind Events ──
function bindEvents() {
  // Add task
  document.getElementById('add-btn').addEventListener('click', addTask);
  document.getElementById('task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  // Categories
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  // Clear completed
  document.getElementById('clear-completed').addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    save(); render();
  });
}

// ── Add Task ──
function addTask() {
  const input = document.getElementById('task-input');
  const text  = input.value.trim();
  if (!text) { input.focus(); return; }

  const task = {
    id:       uid(),
    text,
    priority: document.getElementById('priority-select').value,
    cat:      document.getElementById('category-select').value,
    due:      document.getElementById('due-date').value,
    done:     false,
  };

  tasks.unshift(task);
  input.value = '';
  save(); render();
}

// ── Render ──
function render() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  const filtered = tasks.filter(t => {
    const matchFilter = activeFilter === 'all'
      ? true : activeFilter === 'active' ? !t.done : t.done;
    const matchCat = activeCat === 'all' ? true : t.cat === activeCat;
    return matchFilter && matchCat;
  });

  // Counts
  document.getElementById('count-all').textContent       = tasks.length;
  document.getElementById('count-active').textContent    = tasks.filter(t => !t.done).length;
  document.getElementById('count-completed').textContent = tasks.filter(t => t.done).length;

  // Progress
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${done} / ${total} bajarildi`;

  // Render tasks
  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = filtered.map(t => taskHTML(t)).join('');

  // Bind task events
  list.querySelectorAll('.task-check').forEach(el => {
    el.addEventListener('click', () => toggleDone(el.dataset.id));
  });
  list.querySelectorAll('.action-btn.delete').forEach(el => {
    el.addEventListener('click', () => deleteTask(el.dataset.id));
  });
  list.querySelectorAll('.task-text').forEach(el => {
    el.addEventListener('blur', () => {
      const t = tasks.find(t => t.id === el.dataset.id);
      if (t) { t.text = el.textContent.trim() || t.text; save(); }
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  });
}

function taskHTML(t) {
  const catLabels = { work: '💼 Ish', personal: '🏠 Shaxsiy', health: '💪 Salomatlik', learning: '📚 O\'rganish' };
  const dueLabel  = t.due ? dueBadge(t.due) : '';
  const catBadge  = `<span class="badge">${catLabels[t.cat] || t.cat}</span>`;

  return `
  <div class="task-item ${t.done ? 'completed' : ''}" data-id="${t.id}">
    <div class="priority-dot ${t.priority}"></div>
    <div class="task-check ${t.done ? 'checked' : ''}" data-id="${t.id}"></div>
    <div class="task-info">
      <div class="task-text" contenteditable="true" data-id="${t.id}" spellcheck="false">${escape(t.text)}</div>
      <div class="task-badges">
        ${catBadge}
        ${dueLabel}
      </div>
    </div>
    <div class="task-actions">
      <button class="action-btn delete" data-id="${t.id}" title="O'chirish">✕</button>
    </div>
  </div>`;
}

function dueBadge(due) {
  const d   = new Date(due);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cls = d < now ? 'overdue' : 'due';
  const label = d < now ? '⚠ Muddati o\'tgan' : '📅 ' + formatDate(d);
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Actions ──
function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); render(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save(); render();
}

// ── Helpers ──
function save() { localStorage.setItem('taskflow-tasks', JSON.stringify(tasks)); }
function uid()  { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function today(){ return new Date().toISOString().split('T')[0]; }
function escape(str) { return str.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function formatDate(d) {
  return d.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
}
