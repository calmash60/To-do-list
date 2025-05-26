// To-Do List App with Local Storage

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

let todos = [];

// Load todos from localStorage
function loadTodos() {
  const saved = localStorage.getItem('todos');
  todos = saved ? JSON.parse(saved) : [];
}

// Save todos to localStorage
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// Render the to-do list
function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    
    span.addEventListener('click', () => toggleCompleted(idx));
    
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTodo(idx);
    });
    
    li.appendChild(span);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
}

// Add a new to-do
function addTodo(text) {
  todos.push({ text, completed: false });
  saveTodos();
  renderTodos();
}

// Toggle completed status
function toggleCompleted(idx) {
  todos[idx].completed = !todos[idx].completed;
  saveTodos();
  renderTodos();
}

// Delete a to-do
function deleteTodo(idx) {
  todos.splice(idx, 1);
  saveTodos();
  renderTodos();
}

// Handle form submission
todoForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const value = todoInput.value.trim();
  if (value) {
    addTodo(value);
    todoInput.value = '';
    todoInput.focus();
  }
});

// Initialize app
function init() {
  loadTodos();
  renderTodos();
}

init();
