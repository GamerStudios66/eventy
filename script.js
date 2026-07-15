// 1. DATABASE: Put your events here (Format: 'YYYY-MM-DD')
const defaultEventsDatabase = {
  "2026-08-12": { tag: "Lukáš narodeniy", title: "Oslava Lukášovych 12 narodenín!", desc: "Budeme hrať bowling, budeme mať aj skákací hrad!! A tý čo budú chcieť hrať futbal tak môžu, a aj nejake hry!" },
  "2026-07-17": { tag: "Prespávačka", title: "Ideme k maxovi prespať! (Sádovský)", desc: "Lukáš a Tomáš idú prespať k Maxovi!" },
  "2026-07-16": { tag: "Strojček", title: "Strojček", desc: "Tomáš bude mať od tohto dňa strojček! (do prdele)" }
};

const storageKeys = {
  users: 'eventy-users-v1',
  currentUser: 'eventy-current-user-v1',
  events: 'eventy-events-v1'
};

let eventsDatabase = { ...defaultEventsDatabase };
let users = [];
let currentUser = null;

// --- DYNAMIC BUBBLE ENGINE ---
function initBubbles() {
  const container = document.getElementById('bubble-container');
  const numberOfBubbles = 50;

  for (let i = 0; i < numberOfBubbles; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const size = Math.floor(Math.random() * 35) + 15;
    const leftPosition = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 8;

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${leftPosition}%`;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.animationDelay = `${delay}s`;

    container.appendChild(bubble);
  }
}

function loadPersistedData() {
  try {
    const savedEvents = JSON.parse(localStorage.getItem(storageKeys.events) || 'null');
    if (savedEvents) {
      eventsDatabase = { ...defaultEventsDatabase, ...savedEvents };
    }
  } catch (error) {
    console.warn('Could not load events from storage', error);
  }

  try {
    users = JSON.parse(localStorage.getItem(storageKeys.users) || '[]');
  } catch (error) {
    console.warn('Could not load users from storage', error);
    users = [];
  }

  try {
    currentUser = JSON.parse(localStorage.getItem(storageKeys.currentUser) || 'null');
  } catch (error) {
    console.warn('Could not load current user', error);
    currentUser = null;
  }
}

function saveUsers() {
  localStorage.setItem(storageKeys.users, JSON.stringify(users));
}

function saveEvents() {
  localStorage.setItem(storageKeys.events, JSON.stringify(eventsDatabase));
}

function saveCurrentUser() {
  if (currentUser) {
    localStorage.setItem(storageKeys.currentUser, JSON.stringify(currentUser));
  } else {
    localStorage.removeItem(storageKeys.currentUser);
  }
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Global state navigation tracking properties
const now = new Date();
let displayYear = now.getFullYear();
let displayMonth = now.getMonth(); // 0 = Jan, 11 = Dec
let authMode = 'login';

const monthNamesSlovak = [
  "JANUÁR", "FEBRUÁR", "MAREC", "APRÍL", "MÁJ", "JÚN",
  "JÚL", "AUGUST", "SEPTEMBER", "OKTÓBER", "NOVEMBER", "DECEMBER"
];

const dayLabels = ["PO", "UT", "ST", "ŠT", "PI", "SO", "NE"];

// Helper function to count events in any specific month safely
function countEventsForMonth(year, month) {
  let count = 0;
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const dateLookupKey = `${year}-${paddedMonth}-${paddedDay}`;

    if (eventsDatabase[dateLookupKey]) {
      count++;
    }
  }
  return count;
}

function updateBadgeCount(badgeId, count) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;
  badge.innerText = count;
  badge.classList.toggle('hidden', count === 0);
}

function setAuthMode(mode) {
  authMode = mode;
  const title = document.getElementById('auth-title');
  const nameField = document.getElementById('auth-name');
  const passwordField = document.getElementById('login-password');
  const submitButton = document.getElementById('auth-submit-btn');
  const signupLink = document.getElementById('signup-link');
  const forgotLink = document.getElementById('forgot-password-link');
  const message = document.getElementById('auth-message');
  const form = document.getElementById('login-form');

  if (mode === 'signup') {
    title.innerText = 'VYTVORIŤ ÚČET';
    nameField.classList.remove('hidden');
    passwordField.classList.remove('hidden');
    submitButton.innerText = 'Vytvoriť účet';
    signupLink.innerText = 'Máte účet?';
    forgotLink.innerText = 'Zabudnuté heslo?';
    message.innerText = 'Vytvorte si nový účet.';
  } else if (mode === 'forgot') {
    title.innerText = 'OBNOVA HESLA';
    nameField.classList.add('hidden');
    passwordField.classList.add('hidden');
    submitButton.innerText = 'Obnoviť heslo';
    signupLink.innerText = 'Nemáte účet?';
    forgotLink.innerText = 'Späť na prihlásenie';
    message.innerText = 'Zadajte email a pošleme vám inštrukcie.';
  } else {
    title.innerText = 'PRIHLÁSENIE';
    nameField.classList.add('hidden');
    passwordField.classList.remove('hidden');
    submitButton.innerText = 'Prihlásiť sa';
    signupLink.innerText = 'Nemáte účet?';
    forgotLink.innerText = 'Zabudnuté heslo?';
    message.innerText = 'Prihláste sa a pokračujte.';
  }

  form.reset();
}

function openAddEventModal() {
  document.getElementById('event-modal').classList.remove('hidden');
  document.getElementById('event-date').focus();
}

function closeAddEventModal() {
  document.getElementById('event-modal').classList.add('hidden');
  document.getElementById('add-event-form').reset();
  document.getElementById('event-form-message').innerText = '';
}

// 2. CORE ENGINE: Generate the calendar
function generateCalendar() {
  document.getElementById('calendar-month-title').innerText = `${monthNamesSlovak[displayMonth]} ${displayYear}`;

  const gridContainer = document.getElementById('calendar-grid-target');
  gridContainer.innerHTML = '';

  dayLabels.forEach(label => {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'day-header';
    labelDiv.innerText = label;
    gridContainer.appendChild(labelDiv);
  });

  const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
  let startOffsetIndex = firstDayOfMonth.getDay() - 1;
  if (startOffsetIndex === -1) startOffsetIndex = 6;

  const totalDaysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  for (let i = 0; i < startOffsetIndex; i++) {
    const emptyTile = document.createElement('div');
    emptyTile.className = 'day-box empty';
    gridContainer.appendChild(emptyTile);
  }

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayBox = document.createElement('div');
    dayBox.className = 'day-box';
    dayBox.innerText = day;

    if (day === now.getDate() && displayMonth === now.getMonth() && displayYear === now.getFullYear()) {
      dayBox.classList.add('current-day');
    }

    const paddedMonth = String(displayMonth + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const dateLookupKey = `${displayYear}-${paddedMonth}-${paddedDay}`;

    if (eventsDatabase[dateLookupKey]) {
      const eventData = eventsDatabase[dateLookupKey];
      dayBox.classList.add('has-event');

      const tagSpan = document.createElement('span');
      tagSpan.className = 'event-tag';
      tagSpan.innerText = eventData.tag;
      dayBox.appendChild(tagSpan);

      dayBox.addEventListener('click', () => {
        document.getElementById('dynamic-title').innerText = eventData.title;
        document.getElementById('dynamic-desc').innerText = eventData.desc;
        switchPage('detail-screen');
      });
    }

    gridContainer.appendChild(dayBox);
  }

  let prevMonth = displayMonth - 1;
  let prevYear = displayYear;
  if (prevMonth < 0) { prevMonth = 11; prevYear--; }

  let nextMonth = displayMonth + 1;
  let nextYear = displayYear;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }

  updateBadgeCount('prev-month-badge', countEventsForMonth(prevYear, prevMonth));
  updateBadgeCount('next-month-badge', countEventsForMonth(nextYear, nextMonth));
}

// 3. PAGE VIEW NAVIGATOR LOGIC
function switchPage(targetPageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(targetPageId).classList.add('active');
}

// Global delegated button click listener handles dynamic elements safely
document.addEventListener('click', function(e) {
  const pageTrigger = e.target.closest('[data-page]');
  if (pageTrigger) {
    const targetPageId = pageTrigger.getAttribute('data-page');
    switchPage(targetPageId);
  }
});

// Arrow controllers configurations rules hooks listeners
document.getElementById('prev-month-btn').addEventListener('click', () => {
  displayMonth--;
  if (displayMonth < 0) {
    displayMonth = 11;
    displayYear--;
  }
  generateCalendar();
});

document.getElementById('next-month-btn').addEventListener('click', () => {
  displayMonth++;
  if (displayMonth > 11) {
    displayMonth = 0;
    displayYear++;
  }
  generateCalendar();
});

document.getElementById('add-event-btn').addEventListener('click', openAddEventModal);
document.getElementById('cancel-event-btn').addEventListener('click', closeAddEventModal);
document.getElementById('event-modal').addEventListener('click', function(e) {
  if (e.target.id === 'event-modal') {
    closeAddEventModal();
  }
});

document.getElementById('add-event-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const date = document.getElementById('event-date').value;
  const tag = document.getElementById('event-tag').value.trim();
  const title = document.getElementById('event-title').value.trim();
  const desc = document.getElementById('event-desc').value.trim();
  const message = document.getElementById('event-form-message');

  if (!date || !tag || !title) {
    message.innerText = 'Vyplňte dátum, tag a názov udalosti.';
    return;
  }

  eventsDatabase[date] = { tag, title, desc: desc || 'Bez popisu.' };
  saveEvents();
  closeAddEventModal();
  generateCalendar();
});

document.getElementById('signup-link').addEventListener('click', () => {
  setAuthMode('signup');
});

document.getElementById('forgot-password-link').addEventListener('click', () => {
  setAuthMode(authMode === 'forgot' ? 'login' : 'forgot');
});

document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value.trim();
  const name = document.getElementById('auth-name').value.trim();
  const message = document.getElementById('auth-message');

  if (authMode === 'forgot') {
    if (!email) {
      message.innerText = 'Zadajte email pre obnovu hesla.';
      return;
    }
    message.innerText = 'Ak účet existuje, inštrukcie boli pripravené.';
    return;
  }

  if (!email || !password) {
    message.innerText = 'Vyplňte všetky povinné polia.';
    return;
  }

  if (authMode === 'signup') {
    if (!name) {
      message.innerText = 'Vyplňte aj meno pre vytvorenie účtu.';
      return;
    }

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      message.innerText = 'Tento email už existuje.';
      return;
    }

    const passwordHash = await hashPassword(password);
    users.push({ email, name, passwordHash });
    saveUsers();
    currentUser = { email, name };
    saveCurrentUser();
    message.innerText = 'Účet bol vytvorený.';
    switchPage('events-screen');
    return;
  }

  const existingUser = users.find(user => user.email === email);
  if (!existingUser) {
    message.innerText = 'Účet s týmto emailom neexistuje.';
    return;
  }

  const passwordHash = await hashPassword(password);
  if (existingUser.passwordHash !== passwordHash) {
    message.innerText = 'Nesprávne heslo.';
    return;
  }

  currentUser = { email, name: existingUser.name };
  saveCurrentUser();
  switchPage('events-screen');
  message.innerText = 'Vitajte späť!';
});

// Boot operations on initialization
loadPersistedData();
setAuthMode('login');
initBubbles();
generateCalendar();

if (currentUser) {
  document.getElementById('auth-message').innerText = `Vitajte späť, ${currentUser.name || currentUser.email}!`;
  switchPage('events-screen');
}
