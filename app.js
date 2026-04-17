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
const todoTitleInput = document.getElementById('todo-title');
const todoDateInput = document.getElementById('todo-date');

const notificationsSupported = 'Notification' in window;
let habits = [];
let todos = [];
let notifiedActiveHabits = {};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function loadData() {
  try {
    habits = JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
    todos = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || [];
    notifiedActiveHabits = JSON.parse(localStorage.getItem(NOTIFIED_STORAGE_KEY)) || {};
  } catch (error) {
    habits = [];
    todos = [];
    notifiedActiveHabits = {};
  }

  habits = habits.map((habit) => ({
    ...habit,
    completed: habit.lastCompletedDate === getToday(),
    lastCompletedDate: habit.lastCompletedDate || '',
    lastFailedDate: habit.lastFailedDate || '',
    createdDate: habit.createdDate || getToday(),
  }));
}

function saveData() {
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(notifiedActiveHabits));
}

function parseHabitTime(habit) {
  const [hours, minutes] = habit.time.split(':').map(Number);
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return time;
}

function getHabitStatus(habit) {
  const now = new Date();
  const today = getToday();
  if (habit.lastCompletedDate === today) return 'done';

  const habitTime = parseHabitTime(habit);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (now < habitTime) {
    return 'upcoming';
  }

  if (now >= habitTime && now <= endOfDay) {
    return 'active';
  }

  return 'missed';
}

function getStatusLabel(status) {
  switch (status) {
    case 'done':
      return 'Done';
    case 'active':
      return 'Active';
    case 'upcoming':
      return 'Upcoming';
    case 'missed':
      return 'Missed';
    case 'pending':
      return 'Pending';
    default:
      return 'Unknown';
  }
}

function getStatusClass(status) {
  return `status-chip status-${status}`;
}

function createListItem(item, type) {
  const listItem = document.createElement('li');
  listItem.className = 'item-card';

  const title = document.createElement('div');
  title.className = 'item-title';
  title.textContent = item.title;

  const status = type === 'habit' ? getHabitStatus(item) : item.completed ? 'done' : 'pending';
  if (status === 'done') {
    title.classList.add('complete');
  }

  const meta = document.createElement('div');
  meta.className = 'item-row';

  const details = document.createElement('span');
  if (type === 'habit') {
    details.textContent = `Time: ${item.time}`;
  } else {
    details.textContent = item.dueDate ? `Due: ${item.dueDate}` : 'No due date';
  }

  const statusChip = document.createElement('span');
  statusChip.className = getStatusClass(status);
  statusChip.textContent = getStatusLabel(status);

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const completeButton = document.createElement('button');
  completeButton.textContent = item.completed ? 'Undo' : 'Done';
  completeButton.addEventListener('click', () => toggleComplete(type, item.id));

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.className = 'delete';
  deleteButton.addEventListener('click', () => removeItem(type, item.id));

  actions.append(completeButton, deleteButton);
  meta.append(details, statusChip, actions);
  listItem.append(title, meta);

  return listItem;
}

function renderLists() {
  habitList.innerHTML = '';
  todoList.innerHTML = '';

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
}

function addHabit(title, time) {
  const newHabit = {
    id: `h-${Date.now()}`,
    title: title.trim(),
    time,
    completed: false,
    lastCompletedDate: '',
    lastFailedDate: '',
    createdDate: getToday(),
  };
  habits.push(newHabit);
  saveData();
  renderLists();
  updateReminderBanner();
}

function addTodo(title, dueDate) {
  const newTodo = {
    id: `t-${Date.now()}`,
    title: title.trim(),
    dueDate: dueDate || '',
    completed: false,
  };
  todos.push(newTodo);
  saveData();
  renderLists();
}

function toggleComplete(type, id) {
  const list = type === 'habit' ? habits : todos;
  const item = list.find((entry) => entry.id === id);
  if (!item) return;

  if (type === 'habit') {
    const today = getToday();
    item.completed = !item.completed;
    item.lastCompletedDate = item.completed ? today : '';
    if (!item.completed) {
      item.lastFailedDate = '';
    }
  } else {
    item.completed = !item.completed;
  }

  saveData();
  renderLists();
  updateReminderBanner();
}

function removeItem(type, id) {
  if (type === 'habit') {
    habits = habits.filter((item) => item.id !== id);
  } else {
    todos = todos.filter((item) => item.id !== id);
  }
  saveData();
  renderLists();
  updateReminderBanner();
}

function updateNotificationStatus() {
  if (!notificationsSupported) {
    notificationStatus.textContent = 'Browser notifications are not supported in this browser.';
    return;
  }

  if (Notification.permission === 'granted') {
    notificationStatus.textContent = 'Notifications enabled. You will receive habit reminders when a habit becomes active.';
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
  const activeHabits = habits.filter((habit) => getHabitStatus(habit) === 'active');

  activeHabits.forEach((habit) => {
    const notifyKey = `${habit.id}-${today}`;
    if (!notifiedActiveHabits[notifyKey]) {
      sendBrowserNotification('Habit Reminder', `Time to do: ${habit.title}`);
      showLocalAlert(`Habit active: ${habit.title}. Mark it done when complete.`);
      notifiedActiveHabits[notifyKey] = true;
    }
  });

  saveData();
  updateReminderBanner();
}

function updateReminderBanner() {
  const activeHabits = habits.filter((habit) => getHabitStatus(habit) === 'active');
  const missedYesterday = habits.filter((habit) => habit.lastFailedDate === getYesterday());

  if (activeHabits.length === 0 && missedYesterday.length === 0) {
    reminderBanner.textContent = '';
    reminderBanner.style.display = 'none';
    return;
  }

  const parts = [];
  if (activeHabits.length > 0) {
    const activeText = activeHabits.map((habit) => habit.title).join(', ');
    parts.push(`Reminder: ${activeText} ${activeHabits.length === 1 ? 'is' : 'are'} active now.`);
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
});

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = todoTitleInput.value;
  const dueDate = todoDateInput.value;
  if (!title) return;
  addTodo(title, dueDate);
  todoTitleInput.value = '';
  todoDateInput.value = '';
});

window.addEventListener('DOMContentLoaded', () => {
  loadData();
  askNotificationPermission();
  renderLists();
  updateFailedHabits();
  updateReminderBanner();
  checkForActiveHabits();

  notificationTestButton.addEventListener('click', sendTestNotification);

  setInterval(() => {
    renderLists();
    updateReminderBanner();
    checkForActiveHabits();
  }, 60000);
});
