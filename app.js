const HABIT_STORAGE_KEY = 'ghabit.habits';
const TODO_STORAGE_KEY = 'ghabit.todos';

const habitForm = document.getElementById('habit-form');
const todoForm = document.getElementById('todo-form');
const habitList = document.getElementById('habit-list');
const todoList = document.getElementById('todo-list');
const habitTitleInput = document.getElementById('habit-title');
const habitTimeInput = document.getElementById('habit-time');
const todoTitleInput = document.getElementById('todo-title');
const todoDateInput = document.getElementById('todo-date');

let habits = [];
let todos = [];

function loadData() {
  try {
    habits = JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
    todos = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || [];
  } catch (error) {
    habits = [];
    todos = [];
  }
}

function saveData() {
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

function createListItem(item, type) {
  const listItem = document.createElement('li');
  listItem.className = 'item-card';

  const title = document.createElement('div');
  title.textContent = item.title;
  if (item.completed) title.classList.add('complete');

  const meta = document.createElement('div');
  meta.className = 'item-row';

  const details = document.createElement('span');
  details.textContent = type === 'habit'
    ? `Time: ${item.time}`
    : item.dueDate
      ? `Due: ${item.dueDate}`
      : 'No due date';

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
  meta.append(details, actions);
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
  };
  habits.push(newHabit);
  saveData();
  renderLists();
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
  item.completed = !item.completed;
  saveData();
  renderLists();
}

function removeItem(type, id) {
  if (type === 'habit') {
    habits = habits.filter((item) => item.id !== id);
  } else {
    todos = todos.filter((item) => item.id !== id);
  }
  saveData();
  renderLists();
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
  renderLists();
});
