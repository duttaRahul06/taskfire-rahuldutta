
/*
  Simple To-Do using Firebase Firestore (compat SDK)
  INSTRUCTIONS:
  1. Create a Firebase project at https://console.firebase.google.com/
  2. Enable Firestore (Start in test mode while developing).
  3. In Project Settings -> Your apps -> Add web app -> obtain firebaseConfig.
  4. Replace the firebaseConfig object below with your values.
  5. Open index.html in VS Code Live Server or any static server.
*/

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  // storageBucket, messagingSenderId, appId (optional)
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const tasksCol = db.collection('tasks');

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const tasksList = document.getElementById('tasksList');
const emptyDiv = document.getElementById('empty');

// Add task
async function addTask(text) {
  if (!text || !text.trim()) return;
  await tasksCol.add({
    text: text.trim(),
    completed: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  taskInput.value = '';
}

// Edit task
async function editTask(id, newText) {
  if (!newText || !newText.trim()) return;
  await tasksCol.doc(id).update({ text: newText.trim() });
}

// Delete task
async function deleteTask(id) {
  await tasksCol.doc(id).delete();
}

// Toggle complete
async function toggleComplete(id, current) {
  await tasksCol.doc(id).update({ completed: !current });
}

// Create list item
function createTaskItem(doc) {
  const data = doc.data();
  const li = document.createElement('li');
  li.dataset.id = doc.id;
  if (data.completed) li.classList.add('completed');

  const left = document.createElement('div'); left.className = 'task-left';
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
  checkbox.checked = !!data.completed;
  checkbox.addEventListener('change', async () => {
    await toggleComplete(doc.id, !!data.completed);
  });

  const textDiv = document.createElement('div'); textDiv.className = 'task-text';
  textDiv.textContent = data.text || '';

  left.appendChild(checkbox);
  left.appendChild(textDiv);

  const actions = document.createElement('div'); actions.className = 'actions';
  const editBtn = document.createElement('button'); editBtn.className = 'icon-btn'; editBtn.textContent = 'Edit';
  const delBtn = document.createElement('button'); delBtn.className = 'icon-btn'; delBtn.textContent = 'Delete';

  editBtn.addEventListener('click', async () => {
    const newText = prompt('Edit task', data.text);
    if (newText !== null && newText.trim() !== data.text) {
      await editTask(doc.id, newText);
    }
  });

  delBtn.addEventListener('click', async () => {
    const ok = confirm('Delete this task?');
    if (ok) await deleteTask(doc.id);
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(actions);
  return li;
}

// Realtime listener
let unsubscribe = null;
function attachRealtimeListener() {
  unsubscribe = tasksCol.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    tasksList.innerHTML = '';
    if (snapshot.empty) {
      emptyDiv.style.display = 'block';
    } else {
      emptyDiv.style.display = 'none';
      snapshot.forEach(doc => {
        const li = createTaskItem(doc);
        tasksList.appendChild(li);
      });
    }
  }, err => {
    console.error('Realtime listener error:', err);
  });
}

// Events
addBtn.addEventListener('click', () => addTask(taskInput.value));
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask(taskInput.value);
});

// Start
attachRealtimeListener();
window.addEventListener('beforeunload', () => { if (unsubscribe) unsubscribe(); });
