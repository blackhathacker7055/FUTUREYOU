// Select all screens
const screens = document.querySelectorAll('.screen');
const loginForm = document.querySelector('.signup-container form');
const signupForm = document.querySelector('.login-container form');
const signupLinks = document.querySelectorAll('.signup-text a');
const logoutBtn = document.querySelector('.sidebar ul li:last-child');
const addGoalCard = document.querySelector('.card:last-child');
const goalsTable = document.querySelector('.goals tbody');
const userHeader = document.querySelector('header h1');

// Local storage for users
let users = JSON.parse(localStorage.getItem('users')) || [];

// Logged-in user
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// --- SCREEN SWITCH LOGIC ---88888888
signupLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    screens.forEach(s => s.classList.remove('active'));
    if (link.textContent.includes('Sign up')) {
      screens[1].classList.add('active');
    } else {
      screens[0].classList.add('active');
    }
  });
});

// --- SIGNUP FUNCTIONALITY ---
signupForm.addEventListener('submit', e => {
  e.preventDefault();
  const fullName = signupForm.fullname.value.trim();
  const email = signupForm.email.value.trim();
  const username = signupForm.username.value.trim();
  const password = signupForm.password.value.trim();
  const confirm = signupForm['confirm-password'].value.trim();

  if (password !== confirm) {
    alert("Passwords don't match!");
    return;
  }

  if (users.some(u => u.username === username)) {
    alert("Username already exists!");
    return;
  }

  const newUser = { fullName, email, username, password, goals: [] };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  alert('Account created successfully!');
  signupForm.reset();
  screens.forEach(s => s.classList.remove('active'));
  screens[0].classList.add('active');
});

// --- LOGIN FUNCTIONALITY ---
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value.trim();

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    alert('Invalid username or password!');
    return;
  }

  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  showDashboard();
});

// --- DASHBOARD DISPLAY FUNCTION ---
function showDashboard() {
  screens.forEach(s => s.classList.remove('active'));
  screens[2].classList.add('active');
  userHeader.textContent = `Welcome, ${currentUser.fullName.split(' ')[0]} 👋`;
  renderGoals();
}

// --- GOAL RENDERING FUNCTION ---
function renderGoals() {
  goalsTable.innerHTML = '';
  if (!currentUser || !currentUser.goals.length) {
    goalsTable.innerHTML = '<tr><td colspan="3">No goals yet. Add one!</td></tr>';
    return;
  }

  currentUser.goals.forEach(goal => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${goal.title}</td>
      <td>${goal.deadline}</td>
      <td><span class="status ${goal.status.toLowerCase()}">${goal.status}</span></td>
    `;
    goalsTable.appendChild(row);
  });
}

// --- ADD NEW GOAL FUNCTIONALITY ---
addGoalCard.addEventListener('click', () => {
  if (!currentUser) return alert('Login first!');

  const title = prompt('Enter goal title:');
  if (!title) return;

  const deadline = prompt('Enter deadline (e.g. 20 Nov 2025 or Ongoing):') || 'Ongoing';
  const status = prompt('Status (Active / Completed / In Progress):', 'Active');

  const newGoal = {
    title,
    deadline,
    status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  };

  currentUser.goals.push(newGoal);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  renderGoals();
});

// --- LOGOUT FUNCTIONALITY ---
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  currentUser = null;
  screens.forEach(s => s.classList.remove('active'));
  screens[0].classList.add('active');
});

// --- AUTO LOGIN IF USER STILL LOGGED IN ---
if (currentUser) {
  showDashboard();
}
