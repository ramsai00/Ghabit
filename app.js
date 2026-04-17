const HABIT_STORAGE_KEY = 'ghabit.habits';
const TODO_STORAGE_KEY = 'ghabit.todos';
const NOTIFIED_STORAGE_KEY = 'ghabit.notified';

const habitForm = document.getElementById('habit-form');
const todoForm = document.getElementById('todo-form');
const habitList = document.getElementById('habit-list');
const todoList = document.getElementById('todo-list');
const reminderBanner = document.getElementById('reminder-banner');
const notificationStatus = document.getElementById('notification-status');
const notificationTestButton = document.getElementById('notification-test-button');
const localAlert = document.getElementById('local-alert');
const habitTitleInput = document.getElementById('habit-title');
const habitTimeInput = document.getElementById('habit-time');
const habitRecurrenceSelect = document.getElementById('habit-recurrence');
const habitWeekdays = document.getElementById('habit-weekdays');
const habitIntervalControls = document.getElementById('habit-interval-controls');
const habitIntervalDaysInput = document.getElementById('habit-interval-days');
const habitStartDateInput = document.getElementById('habit-start-date');
const habitEndDateInput = document.getElementById('habit-end-date');
const todoTitleInput = document.getElementById('todo-title');
const todoDateInput = document.getElementById('todo-date');
const todoRecurrenceSelect = document.getElementById('todo-recurrence');
const todoIntervalControls = document.getElementById('todo-interval-controls');
const todoIntervalDaysInput = document.getElementById('todo-interval-days');
const todoOneTimeControls = document.getElementById('todo-one-time-controls');
const todoRecurringControls = document.getElementById('todo-recurring-controls');
const todoStartDateInput = document.getElementById('todo-start-date');
const todoEndDateInput = document.getElementById('todo-end-date');
const todoWeekdays = document.getElementById('todo-weekdays');
const activityList = document.getElementById('activity-list');
const calendarGrid = document.getElementById('calendar-grid');
const calendarLegend = document.getElementById('calendar-legend');
const reminderIndicator = document.getElementById('reminder-indicator');
const todayList = document.getElementById('today-list');
const ACTIVITY_STORAGE_KEY = 'ghabit.activity';
const dashboardSummary = document.getElementById('dashboard-summary');
const EVENT_COLOR_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#ef4444', '#0ea5e9', '#7c3aed'];
const PROGRESS_DAYS = 7;

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const notificationsSupported = 'Notification' in window;
let habits = [];
let todos = [];
let notifiedActiveHabits = {};
let activityLog = [];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

async function loadData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    const data = await response.json();
    habits = data.habits || [];
    todos = data.todos || [];
    notifiedActiveHabits = JSON.parse(localStorage.getItem(NOTIFIED_STORAGE_KEY)) || {};
    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    try {
      habits = JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
      todos = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || [];
      notifiedActiveHabits = JSON.parse(localStorage.getItem(NOTIFIED_STORAGE_KEY)) || {};
    } catch (storageError) {
      habits = [];
      todos = [];
      notifiedActiveHabits = {};
    }
    console.warn('Unable to load backend data, falling back to localStorage.', error);
  }

  habits = habits.map((habit) => ({
    ...habit,
    recurrence: habit.recurrence || 'daily',
    days: habit.days || [],
    intervalDays: habit.intervalDays || 0,
    startDate: habit.startDate || getToday(),
    endDate: habit.endDate || '',
    completed: habit.lastCompletedDate === getToday(),
    lastCompletedDate: habit.lastCompletedDate || '',
    lastFailedDate: habit.lastFailedDate || '',
    createdDate: habit.createdDate || getToday(),
    history: habit.history || [],
  }));

  todos = todos.map((todo) => ({
    ...todo,
    recurrence: todo.recurrence || 'one-time',
    days: todo.days || [],
    intervalDays: todo.intervalDays || 0,
    startDate: todo.startDate || getToday(),
    endDate: todo.endDate || '',
    completed: todo.completed || false,
    lastCompletedDate: todo.lastCompletedDate || '',
    history: todo.history || [],
  }));

  activityLog = JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '[]');
}

function saveData() {
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(notifiedActiveHabits));
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activityLog));
  syncDataToBackend();
}

function addActivity(message) {
  activityLog.unshift({ message, time: new Date().toISOString() });
  activityLog = activityLog.slice(0, 6);
}

function renderActivityLog() {
  if (!activityList) return;
  activityList.innerHTML = '';
  if (activityLog.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'activity-item';
    empty.textContent = 'No recent activity yet.';
    activityList.appendChild(empty);
    return;
  }
  activityLog.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'activity-item';
    const line = document.createElement('span');
    line.textContent = entry.message;
    const time = document.createElement('time');
    time.className = 'activity-time';
    time.textContent = new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.append(line, time);
    activityList.appendChild(item);
  });
}

async function syncDataToBackend() {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits, todos }),
    });
    if (!response.ok) {
      console.warn('Backend sync failed with status', response.status);
    }
  } catch (error) {
    console.warn('Backend sync failed:', error);
  }
}

function parseHabitTime(habit) {
  const [hours, minutes] = habit.time.split(':').map(Number);
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return time;
}

function getSelectedWeekdays(container) {
  return Array.from(container.querySelectorAll('input[type=checkbox]:checked')).map((input) => input.value);
}

function updateHabitRecurrenceControls() {
  const recurrence = habitRecurrenceSelect.value;
  habitWeekdays.classList.toggle('hidden', recurrence !== 'weekly');
  habitIntervalControls.classList.toggle('hidden', recurrence !== 'interval');
}

function updateTodoRecurrenceControls() {
  const recurrence = todoRecurrenceSelect.value;
  const oneTime = recurrence === 'one-time';
  todoOneTimeControls.classList.toggle('hidden', !oneTime);
  todoRecurringControls.classList.toggle('hidden', oneTime);
  todoWeekdays.classList.toggle('hidden', recurrence !== 'weekly');
  todoIntervalControls.classList.toggle('hidden', recurrence !== 'interval');
}

function isWithinDateRange(item, dateString) {
  const date = new Date(dateString);
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;

  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function isScheduledOnDate(item, dateString = getToday()) {
  if (item.recurrence === 'one-time') {
    if (item.dueDate) {
      return item.dueDate === dateString;
    }
    return item.startDate === dateString;
  }

  if (!isWithinDateRange(item, dateString)) {
    return false;
  }

  if (item.recurrence === 'daily') {
    return true;
  }

  if (item.recurrence === 'weekends') {
    const day = new Date(dateString).getDay();
    return day === 0 || day === 6;
  }

  if (item.recurrence === 'weekly') {
    const dayName = WEEKDAY_NAMES[new Date(dateString).getDay()];
    return item.days && item.days.includes(dayName);
  }

  if (item.recurrence === 'interval') {
    const interval = Number(item.intervalDays) || 0;
    if (interval < 2) return false;
    const start = item.startDate ? new Date(item.startDate) : new Date();
    const date = new Date(dateString);
    const diff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff % interval === 0;
  }

  return false;
}

function getHabitStatus(habit) {
  const today = getToday();
  if (!isScheduledOnDate(habit, today)) return 'upcoming';
  if (habit.lastCompletedDate === today) return 'done';
  return 'today';
}

function getTodoStatus(todo) {
  const today = getToday();

  if (todo.recurrence === 'one-time') {
    if (todo.completed) return 'done';
    if (!todo.dueDate) return 'upcoming';
    if (today < todo.dueDate) return 'upcoming';
    if (today === todo.dueDate) return 'today';
    return 'missed';
  }

  if (!isScheduledOnDate(todo, today)) return 'upcoming';
  if (todo.lastCompletedDate === today) return 'done';
  return 'today';
}

function getRecurrenceLabel(item) {
  if (item.recurrence === 'daily') {
    return 'Every day';
  }
  if (item.recurrence === 'weekends') {
    return 'Weekends only';
  }
  if (item.recurrence === 'weekly') {
    return item.days && item.days.length > 0 ? `Weekly: ${item.days.join(', ')}` : 'Weekly';
  }
  if (item.recurrence === 'interval') {
    return item.intervalDays ? `Every ${item.intervalDays} days` : 'Every X days';
  }
  return 'One-time';
}

function getStatusLabel(status) {
  switch (status) {
    case 'done':
      return 'Done';
    case 'today':
    case 'active':
      return 'Today';
    case 'upcoming':
      return 'Upcoming';
    case 'missed':
      return 'Missed';
    case 'pending':
      return 'Pending';
    case 'inactive':
      return 'Upcoming';
    default:
      return 'Unknown';
  }
}

function getStatusClass(status) {
  return `status-chip status-${status}`;
}

function getHabitProgressData(habit) {
  const today = new Date();
  const days = [];

  for (let i = PROGRESS_DAYS - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().slice(0, 10);
    const scheduled = isScheduledOnDate(habit, dateString);
    const done = habit.history && habit.history.includes(dateString);
    const status = scheduled
      ? (done ? 'done' : dateString === getToday() ? 'today' : 'missed')
      : 'inactive';

    days.push({ dateString, status });
  }

  return days;
}

function renderProgressChart(item) {
  const historySet = new Set(item.history || []);
  const progress = getHabitProgressData(item);
  const wrapper = document.createElement('div');
  wrapper.className = 'progress-chart';

  const title = document.createElement('div');
  title.className = 'progress-chart-title';
  title.textContent = 'Recent completion';
  wrapper.appendChild(title);

  const labels = document.createElement('div');
  labels.className = 'progress-day-labels';
  progress.forEach((day) => {
    const label = document.createElement('span');
    label.className = 'progress-day-label';
    label.textContent = new Date(day.dateString).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    labels.appendChild(label);
  });

  const bars = document.createElement('div');
  bars.className = 'progress-bars';

  progress.forEach((day) => {
    const bar = document.createElement('div');
    bar.className = `progress-bar progress-${day.status}`;
    bar.title = `${day.dateString}: ${day.status === 'done' ? 'Done' : day.status === 'missed' ? 'Missed' : day.status === 'today' || day.status === 'active' ? 'Today' : 'Not scheduled'}`;
    bars.appendChild(bar);
  });

  const stats = document.createElement('div');
  stats.className = 'progress-summary';
  const doneCount = progress.filter((day) => day.status === 'done').length;
  const scheduledCount = progress.filter((day) => day.status !== 'inactive').length;
  stats.textContent = scheduledCount > 0
    ? `Completed ${doneCount}/${scheduledCount} scheduled days`
    : 'Not scheduled in the last week';

  wrapper.append(labels, bars, stats);
  return wrapper;
}

function createListItem(item, type) {
  const listItem = document.createElement('li');
  listItem.className = 'item-card';

  const status = type === 'habit' ? getHabitStatus(item) : getTodoStatus(item);
  if (status === 'done') {
    listItem.classList.add('completed');
  }

  const title = document.createElement('div');
  title.className = 'item-title';
  title.textContent = item.title;

  const headerRow = document.createElement('div');
  headerRow.className = 'item-row item-top-row';

  const summary = document.createElement('span');
  summary.className = 'item-time';
  summary.textContent = type === 'habit'
    ? item.time
    : item.recurrence === 'one-time'
      ? item.dueDate ? `Due: ${item.dueDate}` : 'No due date'
      : getRecurrenceLabel(item);

  const controlGroup = document.createElement('div');
  controlGroup.className = 'item-head-right';

  const statusChip = document.createElement('span');
  statusChip.className = getStatusClass(status);
  statusChip.textContent = getStatusLabel(status);

  const expandToggle = document.createElement('button');
  expandToggle.type = 'button';
  expandToggle.className = 'item-expand-toggle';
  expandToggle.textContent = 'Details';
  expandToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    listItem.classList.toggle('expanded');
  });

  controlGroup.append(statusChip, expandToggle);
  headerRow.append(title, summary, controlGroup);

  const detailsSection = document.createElement('div');
  detailsSection.className = 'item-details';

  const detailText = document.createElement('span');
  detailText.className = 'item-detail-text';
  detailText.textContent = type === 'habit'
    ? `${getRecurrenceLabel(item)} | Time: ${item.time}`
    : item.recurrence === 'one-time'
      ? item.dueDate ? `Due: ${item.dueDate}` : 'No due date'
      : getRecurrenceLabel(item);

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const completeButton = document.createElement('button');
  completeButton.textContent = item.completed ? 'Undo' : 'Done';
  completeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleComplete(type, item.id);
  });

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.className = 'delete';
  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    removeItem(type, item.id);
  });

  actions.append(completeButton, deleteButton);
  detailsSection.append(detailText, actions);

  if (type === 'habit') {
    detailsSection.appendChild(renderProgressChart(item));
  }

  listItem.append(headerRow, detailsSection);

  listItem.addEventListener('click', (event) => {
    if (event.target.closest('.item-expand-toggle') || event.target.closest('.item-actions') || event.target.closest('button')) return;
    toggleComplete(type, item.id);
  });

  return listItem;
}

function renderLists() {
  habitList.innerHTML = '';
  todoList.innerHTML = '';
  renderSummary();

  if (habits.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'item-card';
    empty.textContent = 'Add a habit to get started.';
    habitList.appendChild(empty);
  } else {
    habits.forEach((habit) => habitList.appendChild(createListItem(habit, 'habit')));
  }

  if (todos.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'item-card';
    empty.textContent = 'Add a todo task for one-time items.';
    todoList.appendChild(empty);
  } else {
    todos.forEach((todo) => todoList.appendChild(createListItem(todo, 'todo')));
  }

  renderTodayList();
  renderActivityLog();
  renderCalendar();
}

function getTodayItems() {
  const today = getToday();
  return [
    ...habits.map((item) => ({ ...item, type: 'habit' })),
    ...todos.map((item) => ({ ...item, type: 'todo' })),
  ].filter((item) => {
    const status = item.type === 'habit' ? getHabitStatus(item) : getTodoStatus(item);
    return status === 'today' || status === 'done';
  }).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'habit' ? -1 : 1;
    if (a.type === 'habit') return a.time.localeCompare(b.time);
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });
}

function renderTodayList() {
  if (!todayList) return;
  todayList.innerHTML = '';

  const todayItems = getTodayItems();
  if (todayItems.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'item-card';
    empty.textContent = 'No items scheduled for today.';
    todayList.appendChild(empty);
    return;
  }

  todayItems.forEach((item) => {
    const listItem = createListItem(item, item.type);
    todayList.appendChild(listItem);
  });
}

function renderSummary() {
  if (!dashboardSummary) return;
  dashboardSummary.innerHTML = '';

  const today = getToday();
  const todayPending = habits.filter((habit) => getHabitStatus(habit) === 'today').length
    + todos.filter((todo) => getTodoStatus(todo) === 'today').length;
  const completedToday = habits.filter((habit) => habit.lastCompletedDate === today).length
    + todos.filter((todo) => todo.lastCompletedDate === today).length;

  const cards = [
    { label: 'Today pending', value: todayPending, caption: 'Items scheduled for today' },
    { label: 'Done today', value: completedToday, caption: 'Completed items' },
  ];

  cards.forEach((card) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'dashboard-summary-card';
    const value = document.createElement('strong');
    value.textContent = card.value;
    const label = document.createElement('span');
    label.textContent = card.label;
    const caption = document.createElement('span');
    caption.textContent = card.caption;
    cardElement.append(value, label, caption);
    dashboardSummary.appendChild(cardElement);
  });
}

function getEventColor(item) {
  const seed = Array.from(item.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return EVENT_COLOR_PALETTE[seed % EVENT_COLOR_PALETTE.length];
}

function renderCalendar() {
  if (!calendarGrid || !calendarLegend) return;

  calendarGrid.innerHTML = '';
  calendarLegend.innerHTML = '';

  const items = [...habits.map((item) => ({ ...item, type: 'habit' })), ...todos.map((item) => ({ ...item, type: 'todo' }))];
  const colorMap = new Map();
  items.forEach((item) => {
    if (!colorMap.has(item.id)) {
      colorMap.set(item.id, getEventColor(item));
    }
  });

  const today = new Date();
  const daysToShow = 14;

  for (let i = 0; i < daysToShow; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    const dateString = day.toISOString().slice(0, 10);
    const dayName = WEEKDAY_NAMES[day.getDay()];

    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';

    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    const label = document.createElement('strong');
    label.textContent = `${dayName}`;
    const dateMeta = document.createElement('span');
    dateMeta.className = 'calendar-day-date';
    dateMeta.textContent = dateString;
    header.append(label, dateMeta);

    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'calendar-events';

    const scheduledItems = items.filter((item) => isScheduledOnDate(item, dateString));
    if (scheduledItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'calendar-empty';
      empty.textContent = 'No events';
      eventsContainer.appendChild(empty);
    } else {
      scheduledItems.forEach((item) => {
        const eventLabel = document.createElement('div');
        eventLabel.className = 'calendar-event';
        eventLabel.style.backgroundColor = colorMap.get(item.id);
        eventLabel.title = `${item.type === 'habit' ? 'Habit' : 'Todo'}: ${item.title}`;

        const dot = document.createElement('span');
        dot.className = 'calendar-event-dot';
        dot.style.backgroundColor = 'rgba(255,255,255,0.85)';

        const text = document.createElement('span');
        const typeTag = item.type === 'habit' ? 'H' : 'T';
        text.textContent = `${typeTag}: ${item.title}`;

        eventLabel.append(dot, text);
        eventsContainer.appendChild(eventLabel);
      });
    }

    dayCell.append(header, eventsContainer);
    calendarGrid.appendChild(dayCell);
  }

  if (items.length > 0) {
    items.forEach((item) => {
      const legendItem = document.createElement('div');
      legendItem.className = 'calendar-legend-item';

      const colorChip = document.createElement('span');
      colorChip.className = 'calendar-color-chip';
      colorChip.style.backgroundColor = colorMap.get(item.id);

      const label = document.createElement('span');
      label.textContent = `${item.type === 'habit' ? 'Habit' : 'Todo'}: ${item.title}`;

      legendItem.append(colorChip, label);
      calendarLegend.appendChild(legendItem);
    });
  }
}

function addHabit(title, time) {
  const recurrence = habitRecurrenceSelect.value;
  const days = recurrence === 'weekly' ? getSelectedWeekdays(habitWeekdays) : [];
  const intervalDays = recurrence === 'interval' ? Number(habitIntervalDaysInput.value) : 0;
  const newHabit = {
    id: `h-${Date.now()}`,
    title: title.trim(),
    time,
    recurrence,
    days,
    intervalDays,
    startDate: habitStartDateInput.value || getToday(),
    endDate: habitEndDateInput.value || '',
    completed: false,
    lastCompletedDate: '',
    lastFailedDate: '',
    createdDate: getToday(),
  };
  habits.push(newHabit);
  addActivity(`Added habit: ${title}`);
  saveData();
  renderLists();
  updateReminderBanner();
  updateReminderIndicator();
}

function addTodo(title, dueDate) {
  const recurrence = todoRecurrenceSelect.value;
  const days = recurrence === 'weekly' ? getSelectedWeekdays(todoWeekdays) : [];
  const intervalDays = recurrence === 'interval' ? Number(todoIntervalDaysInput.value) : 0;
  const newTodo = {
    id: `t-${Date.now()}`,
    title: title.trim(),
    recurrence,
    days,
    intervalDays,
    dueDate: recurrence === 'one-time' ? dueDate || '' : '',
    startDate: recurrence !== 'one-time' ? todoStartDateInput.value || getToday() : getToday(),
    endDate: recurrence !== 'one-time' ? todoEndDateInput.value || '' : '',
    completed: false,
    lastCompletedDate: '',
  };
  todos.push(newTodo);
  addActivity(`Added todo: ${title}`);
  saveData();
  renderLists();
  updateReminderIndicator();
}

function toggleComplete(type, id) {
  const list = type === 'habit' ? habits : todos;
  const item = list.find((entry) => entry.id === id);
  if (!item) return;

  const today = getToday();
  item.history = item.history || [];
  const historySet = new Set(item.history);

  if (type === 'habit') {
    item.completed = !item.completed;
    item.lastCompletedDate = item.completed ? today : '';
    if (item.completed) {
      historySet.add(today);
    } else {
      historySet.delete(today);
      item.lastFailedDate = '';
    }
  } else {
    if (item.recurrence === 'one-time') {
      item.completed = !item.completed;
      if (item.completed) {
        historySet.add(today);
      } else {
        historySet.delete(today);
      }
    } else {
      const toggledOn = item.lastCompletedDate !== today;
      item.lastCompletedDate = toggledOn ? today : '';
      item.completed = toggledOn;
      if (toggledOn) {
        historySet.add(today);
      } else {
        historySet.delete(today);
      }
    }
  }

  item.history = Array.from(historySet).sort();
  addActivity(`${item.completed ? 'Completed' : 'Undid'} ${type}: ${item.title}`);
  saveData();
  renderLists();
  updateReminderBanner();
  updateReminderIndicator();
}

function removeItem(type, id) {
  let removedItem;
  if (type === 'habit') {
    removedItem = habits.find((item) => item.id === id);
    habits = habits.filter((item) => item.id !== id);
  } else {
    removedItem = todos.find((item) => item.id === id);
    todos = todos.filter((item) => item.id !== id);
  }
  addActivity(`Deleted ${type}: ${removedItem?.title || id}`);
  saveData();
  renderLists();
  updateReminderBanner();
  updateReminderIndicator();
}

function formatDisplayTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (Number.isNaN(hours)) return timeString;
  const date = new Date();
  date.setHours(hours, minutes || 0, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getReminderIndicatorText() {
  const todayHabits = habits.filter((habit) => getHabitStatus(habit) === 'today' && habit.time);
  if (todayHabits.length > 0) {
    const nextTime = todayHabits
      .map((habit) => habit.time)
      .sort()[0];
    return nextTime ? `🔔 ${formatDisplayTime(nextTime)}` : '🔔 Today';
  }

  const todayTodos = todos.filter((todo) => getTodoStatus(todo) === 'today');
  if (todayTodos.length > 0) {
    return `🔔 ${todayTodos.length} task${todayTodos.length === 1 ? '' : 's'} today`;
  }

  return '';
}

function updateReminderIndicator() {
  if (!reminderIndicator) return;
  const text = getReminderIndicatorText();
  if (!text) {
    reminderIndicator.textContent = '';
    reminderIndicator.style.display = 'none';
    return;
  }
  reminderIndicator.textContent = text;
  reminderIndicator.style.display = 'block';
}

function updateNotificationStatus() {
  if (!notificationsSupported) {
    notificationStatus.textContent = 'Browser notifications are not supported in this browser.';
    return;
  }

  if (Notification.permission === 'granted') {
    notificationStatus.textContent = 'Notifications enabled. You will receive habit reminders when a habit is scheduled for today.';
  } else if (Notification.permission === 'denied') {
    notificationStatus.textContent = 'Notifications denied. Enable browser notifications in your browser settings to receive reminders.';
  } else {
    notificationStatus.textContent = 'Notification permission is not granted yet. Allow notifications to receive habit reminders.';
  }
}

function askNotificationPermission(callback) {
  if (!notificationsSupported) {
    updateNotificationStatus();
    return;
  }

  if (Notification.permission === 'default') {
    notificationStatus.textContent = 'Requesting notification permission...';
    const request = Notification.requestPermission((permission) => {
      updateNotificationStatus();
      if (Notification.permission === 'granted' && typeof callback === 'function') {
        callback();
      }
    });
    if (request && request.then) {
      request.then(() => {
        updateNotificationStatus();
        if (Notification.permission === 'granted' && typeof callback === 'function') {
          callback();
        }
      });
    }
  } else {
    updateNotificationStatus();
    if (Notification.permission === 'granted' && typeof callback === 'function') {
      callback();
    }
  }
}

function sendBrowserNotification(title, body) {
  if (!notificationsSupported) {
    notificationStatus.textContent = 'Notifications are not supported by this browser.';
    return;
  }

  if (Notification.permission !== 'granted') {
    notificationStatus.textContent = `Notification permission is ${Notification.permission}.`;
    return;
  }

  try {
    console.log('Ghabit notification:', title, body);
    new Notification(title, { body, silent: false, requireInteraction: true });
    notificationStatus.textContent = 'Test notification sent. Check your OS/browser notification area.';
    showLocalAlert('Notification attempted. If your browser blocks popups, this reminder will still show here.');
  } catch (error) {
    notificationStatus.textContent = `Notification failed: ${error.message}`;
    showLocalAlert(`Notification failed: ${error.message}`);
  }
}

function showLocalAlert(message) {
  if (!localAlert) return;
  localAlert.textContent = message;
  localAlert.classList.add('show');
  window.clearTimeout(showLocalAlert.hideTimer);
  showLocalAlert.hideTimer = window.setTimeout(() => {
    localAlert.classList.remove('show');
  }, 8000);
}

function sendTestNotification() {
  if (!notificationsSupported) {
    notificationStatus.textContent = 'Notifications are not supported by this browser.';
    showLocalAlert('Notifications not supported. Reminders will appear inside the app.');
    return;
  }

  if (Notification.permission !== 'granted') {
    askNotificationPermission(() => {
      sendBrowserNotification('Ghabit notification test', 'This is a test reminder from Ghabit.');
    });
    return;
  }

  sendBrowserNotification('Ghabit notification test', 'This is a test reminder from Ghabit.');
}

function checkForActiveHabits() {
  if (notificationsSupported && Notification.permission === 'default') {
    askNotificationPermission();
  }
  const today = getToday();
  const todayHabits = habits.filter((habit) => getHabitStatus(habit) === 'today');

  todayHabits.forEach((habit) => {
    const notifyKey = `${habit.id}-${today}`;
    if (!notifiedActiveHabits[notifyKey]) {
      sendBrowserNotification('Habit Reminder', `Time to do: ${habit.title}`);
      showLocalAlert(`Habit scheduled for today: ${habit.title}. Mark it done when complete.`);
      notifiedActiveHabits[notifyKey] = true;
    }
  });

  saveData();
  updateReminderBanner();
}

function updateReminderBanner() {
  const todayHabits = habits.filter((habit) => getHabitStatus(habit) === 'today');
  const missedYesterday = habits.filter((habit) => habit.lastFailedDate === getYesterday());

  if (todayHabits.length === 0 && missedYesterday.length === 0) {
    reminderBanner.textContent = '';
    reminderBanner.style.display = 'none';
    return;
  }

  const parts = [];
  if (todayHabits.length > 0) {
    const activeText = todayHabits.map((habit) => habit.title).join(', ');
    parts.push(`Reminder: ${activeText} ${todayHabits.length === 1 ? 'is' : 'are'} scheduled for today.`);
  }

  if (missedYesterday.length > 0) {
    const missedText = missedYesterday.map((habit) => habit.title).join(', ');
    parts.push(`Missed yesterday: ${missedText}.`);
  }

  reminderBanner.textContent = parts.join(' ');
  reminderBanner.style.display = 'block';
}

function updateFailedHabits() {
  const yesterday = getYesterday();
  const now = new Date();
  habits.forEach((habit) => {
    if (habit.createdDate > yesterday) {
      return;
    }

    if (habit.lastCompletedDate !== yesterday && habit.lastCompletedDate !== getToday()) {
      const habitTime = parseHabitTime(habit);
      const targetYesterday = new Date();
      targetYesterday.setDate(targetYesterday.getDate() - 1);
      targetYesterday.setHours(habitTime.getHours(), habitTime.getMinutes(), 0, 0);

      if (now > targetYesterday && habit.lastFailedDate !== yesterday) {
        habit.lastFailedDate = yesterday;
      }
    }
  });
  saveData();
}

habitForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = habitTitleInput.value;
  const time = habitTimeInput.value;
  if (!title || !time) return;
  addHabit(title, time);
  habitTitleInput.value = '';
  habitTimeInput.value = '';
  habitStartDateInput.value = '';
  habitEndDateInput.value = '';
  habitRecurrenceSelect.value = 'daily';
  updateHabitRecurrenceControls();
});

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = todoTitleInput.value;
  const dueDate = todoDateInput.value;
  const recurrence = todoRecurrenceSelect.value;
  if (!title) return;
  if (recurrence === 'one-time' && !dueDate) return;
  addTodo(title, dueDate);
  todoTitleInput.value = '';
  todoDateInput.value = '';
  todoStartDateInput.value = '';
  todoEndDateInput.value = '';
  todoRecurrenceSelect.value = 'one-time';
  updateTodoRecurrenceControls();
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  askNotificationPermission();
  renderLists();
  updateFailedHabits();
  updateReminderBanner();
  updateReminderIndicator();
  checkForActiveHabits();

  notificationTestButton.addEventListener('click', sendTestNotification);
  habitRecurrenceSelect.addEventListener('change', updateHabitRecurrenceControls);
  todoRecurrenceSelect.addEventListener('change', updateTodoRecurrenceControls);

  updateHabitRecurrenceControls();
  updateTodoRecurrenceControls();

  setInterval(() => {
    renderLists();
    updateReminderBanner();
    checkForActiveHabits();
  }, 60000);
});
