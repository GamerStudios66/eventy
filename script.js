// 1. DATABASE: Put your events here (Format: 'YYYY-MM-DD')
const eventsDatabase = {
  "2026-08-12": { tag: "Lukáš narodeniy", title: "Oslava Lukášovych 12 narodenín!", desc: "Budeme hrať bowling, budeme mať aj skákací hrad!! A tý čo budú chcieť hrať futbal tak môžu, a aj nejake hry!" },
  "2026-07-17": { tag: "Prespávačka", title: "Ideme k maxovi prespať! (Sádovský)", desc: "Lukáš a Tomáš idú prespať k Maxovi!" },
  "2026-07-16": { tag: "Strojček", title: "Strojček", desc: "Tomáš bude mať od tohto dňa strojček! (do prdele)" }
};

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

// Global state navigation tracking properties
const now = new Date();
let displayYear = now.getFullYear();
let displayMonth = now.getMonth(); // 0 = Jan, 11 = Dec

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

// 2. CORE ENGINE: Generate the calendar
function generateCalendar() {
  // Set header text string variables 
  document.getElementById('calendar-month-title').innerText = `${monthNamesSlovak[displayMonth]} ${displayYear}`;

  const gridContainer = document.getElementById('calendar-grid-target');
  gridContainer.innerHTML = ''; // Clear prior elements loop structures

  // Step A: Append Weekday row
  dayLabels.forEach(label => {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'day-header';
    labelDiv.innerText = label;
    gridContainer.appendChild(labelDiv);
  });

  // Step B: Calculate Offset Positions
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
  let startOffsetIndex = firstDayOfMonth.getDay() - 1;
  if (startOffsetIndex === -1) startOffsetIndex = 6;

  const totalDaysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  // Step C: Padding loop executions
  for (let i = 0; i < startOffsetIndex; i++) {
    const emptyTile = document.createElement('div');
    emptyTile.className = 'day-box empty';
    gridContainer.appendChild(emptyTile);
  }

  // Step D: Construct Day cell item rows
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

  // Step E: Predictive Badge Calculations (Past & Future Months)
  let prevMonth = displayMonth - 1;
  let prevYear = displayYear;
  if (prevMonth < 0) { prevMonth = 11; prevYear--; }

  let nextMonth = displayMonth + 1;
  let nextYear = displayYear;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }

  // Update the UI targets with preview lookups
  document.getElementById('prev-month-badge').innerText = countEventsForMonth(prevYear, prevMonth);
  document.getElementById('next-month-badge').innerText = countEventsForMonth(nextYear, nextMonth);
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

// Boot operations on initialization
initBubbles();
generateCalendar();
