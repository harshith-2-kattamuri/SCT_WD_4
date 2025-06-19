// Get DOM elements
const todoForm = document.getElementById('todo-form')
const todoInput = document.getElementById('todo-input')
const todoDatetime = document.getElementById('todo-datetime')
const todoList = document.getElementById('todo-list')
const filterButtons = document.querySelectorAll('.filter-btn')
const clearAllBtn = document.querySelector('.clear-all-btn')

// Set minimum datetime to now
const setMinDateTime = (datetimeInput) => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  datetimeInput.min = now.toISOString().slice(0, 16)
}

// Set initial min datetime
setMinDateTime(todoDatetime)

// Update min datetime every minute
setInterval(() => setMinDateTime(todoDatetime), 60000)

// Initialize todos array from localStorage or empty array
let todos = JSON.parse(localStorage.getItem('todos')) || []

// Save todos to localStorage
const saveTodos = () => {
  localStorage.setItem('todos', JSON.stringify(todos))
}

// Create a todo item element
const createTodoElement = (todo) => {
  const todoItem = document.createElement('div')
  todoItem.classList.add('todo-item')
  if (todo.completed) todoItem.classList.add('completed')
  todoItem.innerHTML = `
    <input 
      type="checkbox" 
      class="todo-checkbox" 
      ${todo.completed ? 'checked' : ''}
    >
    <div class="todo-content">
      <div class="todo-text">${todo.text}</div>
      ${todo.datetime ? `<div class="todo-date">${new Date(todo.datetime).toLocaleString()}</div>` : ''}
    </div>
    <div class="todo-actions">
      <button class="edit-btn">
        <i class="fas fa-edit"></i>
      </button>
      <button class="delete-btn">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `
  
  // Add event listeners
  const checkbox = todoItem.querySelector('.todo-checkbox')
  const editBtn = todoItem.querySelector('.edit-btn')
  const deleteBtn = todoItem.querySelector('.delete-btn')

  checkbox.addEventListener('change', () => toggleTodo(todo.id))
  editBtn.addEventListener('click', () => editTodo(todo.id))
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id))

  return todoItem
}

// Render todos based on current filter
const renderTodos = (filter = 'all') => {
  todoList.innerHTML = ''
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })
  
  filteredTodos.forEach(todo => {
    todoList.appendChild(createTodoElement(todo))
  })

  // Adjust list height based on number of tasks
  const taskCount = filteredTodos.length
  if (taskCount <= 2) {
    todoList.style.minHeight = '120px' // Height for 2 tasks
  } else if (taskCount <= 4) {
    todoList.style.minHeight = '240px' // Height for 4 tasks
  } else {
    todoList.style.minHeight = '300px' // Max height, will scroll
  }
}

// Validate datetime is in future
const isValidFutureDate = (datetime) => {
  if (!datetime) return true // Allow empty datetime
  const selectedDate = new Date(datetime)
  const now = new Date()
  return selectedDate > now
}

// Add new todo
todoForm.addEventListener('submit', (e) => {
  e.preventDefault()
  
  const text = todoInput.value.trim()
  const datetime = todoDatetime.value
  
  // Check if datetime is valid (if provided)
  if (datetime && !isValidFutureDate(datetime)) {
    alert('Please select a future date and time')
    return
  }

  if (text) {
    const newTodo = {
      id: Date.now(),
      text,
      datetime,
      completed: false
    }
    
    todos.unshift(newTodo)
    saveTodos()
    renderTodos()
    
    todoInput.value = ''
    todoDatetime.value = ''
  }
})

// Toggle todo completion
const toggleTodo = (id) => {
  todos = todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  )
  saveTodos()
  renderTodos()
}

// Edit todo
const editTodo = (id) => {
  const todo = todos.find(t => t.id === id)
  if (!todo) return

  // Create a temporary form for editing
  const tempForm = document.createElement('div')
  tempForm.innerHTML = `
    <div class="edit-popup">
      <h3>Edit Task</h3>
      <input 
        type="text" 
        id="edit-text" 
        value="${todo.text}" 
        required
      >
      <input 
        type="datetime-local" 
        id="edit-datetime" 
        value="${todo.datetime || ''}"
        min=""
      >
      <div class="edit-buttons">
        <button type="button" id="save-edit">Save</button>
        <button type="button" id="cancel-edit">Cancel</button>
      </div>
    </div>
  `
    document.body.appendChild(tempForm);  // Add styles for the popup
  const style = document.createElement('style')
  style.textContent = `
    .edit-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      z-index: 1000;
    }
    .edit-popup h3 {
      margin-bottom: 15px;
      color: #2d3748;
    }
    .edit-popup input {
      display: block;
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .edit-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .edit-buttons button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #save-edit {
      background: #667eea;
      color: white;
    }
    #cancel-edit {
      background: #e2e8f0;
    }
  `
    document.head.appendChild(style)
    // Handle save and cancel
  const saveBtn = tempForm.querySelector('#save-edit')
  const cancelBtn = tempForm.querySelector('#cancel-edit')
  const editText = tempForm.querySelector('#edit-text')
  const editDatetime = tempForm.querySelector('#edit-datetime')
  
  // Set min datetime for edit form
  setMinDateTime(editDatetime)
  // Update min datetime every minute for edit form
  const updateInterval = setInterval(() => setMinDateTime(editDatetime), 60000)
  saveBtn.addEventListener('click', () => {
    const newText = editText.value.trim()
    const newDatetime = editDatetime.value
    
    // Validate datetime if it's being changed
    if (newDatetime && !isValidFutureDate(newDatetime)) {
      alert('Please select a future date and time')
      return
    }

    if (newText) {
      todos = todos.map(t =>
        t.id === id ? { ...t, text: newText, datetime: newDatetime } : t
      )
      saveTodos()
      renderTodos()
      document.body.removeChild(tempForm)
      document.head.removeChild(style)
    }
  })
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(tempForm)
    document.head.removeChild(style)
    clearInterval(updateInterval)
  })

  saveBtn.addEventListener('click', () => {
    clearInterval(updateInterval)
  })

  // Focus the text input
  editText.focus()
}

// Delete todo
const deleteTodo = (id) => {
  if (!confirm('Are you sure you want to delete this task?')) return
  
  todos = todos.filter(todo => todo.id !== id)
  saveTodos()
  renderTodos()
}

// Filter todos
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'))
    button.classList.add('active')
    renderTodos(button.dataset.filter)
  })
})

// Clear filtered todos
clearAllBtn.addEventListener('click', () => {
  // Get current filter
  const currentFilter = document.querySelector('.filter-btn.active').dataset.filter
  
  // Get tasks that will be cleared based on current filter
  const tasksToKeep = todos.filter(todo => {
    if (currentFilter === 'active') return todo.completed
    if (currentFilter === 'completed') return !todo.completed
    return false // If 'all' filter, clear everything
  })

  // Check if there are tasks to clear in current filter
  const tasksToRemove = todos.length - tasksToKeep.length
  if (tasksToRemove === 0) {
    alert('No tasks to clear in current filter!')
    return
  }

  // Show appropriate confirmation message
  const confirmMessage = currentFilter === 'all' 
    ? 'Are you sure you want to clear all tasks?' 
    : `Are you sure you want to clear all ${currentFilter} tasks?`

  if (confirm(confirmMessage)) {
    todos = tasksToKeep
    saveTodos()
    renderTodos(currentFilter)
  }
})

// Initial render
renderTodos()