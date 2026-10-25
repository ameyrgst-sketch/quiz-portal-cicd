/* ================================================
   QuizPortal - Frontend Application Logic
   ================================================ */

const API = '';  // Same-origin; backend serves on port 8090

// ============ STATE ============
let currentUser = null;  // { userId, username, fullName, role }
let editingQuizId = null;
let currentQuizData = null;   // { quiz, questions }
let quizTimer = null;
let quizStartTime = null;
let currentQuestionIndex = 0;
let studentAnswers = {};  // { questionId: 'A'/'B'/'C'/'D' }
let addQuestionsQuizId = null;
let addedQuestionsCache = [];

// ============ UTILITY ============
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.add('hidden'), 3500);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const span = btn.querySelector('span');
  const loader = btn.querySelector('.btn-loader');
  if (loading) {
    btn.disabled = true;
    if (span) span.classList.add('hidden');
    if (loader) loader.classList.remove('hidden');
  } else {
    btn.disabled = false;
    if (span) span.classList.remove('hidden');
    if (loader) loader.classList.add('hidden');
  }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

async function apiFetch(url, options = {}) {
  const res = await fetch(API + url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : (data.message || 'Request failed'));
  return data;
}

// ============ AUTH ============
function switchTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab !== 'login');
  hideError('login-error');
  hideError('reg-error');
}

async function handleLogin(e) {
  e.preventDefault();
  hideError('login-error');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  setLoading('login-btn', true);
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (!data.success) {
      showError('login-error', data.message || 'Login failed');
    } else {
      setCurrentUser(data);
      enterApp();
    }
  } catch (err) {
    showError('login-error', err.message);
  }
  setLoading('login-btn', false);
}

async function handleRegister(e) {
  e.preventDefault();
  hideError('reg-error');
  const fullName = document.getElementById('reg-fullname').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.querySelector('input[name="role"]:checked')?.value || 'STUDENT';
  setLoading('reg-btn', true);
  try {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, password, role })
    });
    if (!data.success) {
      showError('reg-error', data.message || 'Registration failed');
    } else {
      setCurrentUser(data);
      enterApp();
    }
  } catch (err) {
    showError('reg-error', err.message);
  }
  setLoading('reg-btn', false);
}

function setCurrentUser(data) {
  currentUser = {
    userId: data.userId,
    username: data.username,
    fullName: data.fullName,
    role: data.role
  };
  localStorage.setItem('quizUser', JSON.stringify(currentUser));
}

function enterApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');

  // Set UI user info
  const initials = currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('nav-avatar').textContent = initials;
  document.getElementById('topbar-avatar').textContent = initials;
  document.getElementById('nav-username').textContent = currentUser.fullName;
  document.getElementById('nav-role').textContent = currentUser.role;

  // Show role-based nav
  const isTeacher = currentUser.role === 'TEACHER';
  document.querySelectorAll('.student-nav').forEach(el => el.classList.toggle('hidden', isTeacher));
  document.querySelectorAll('.teacher-nav').forEach(el => el.classList.toggle('hidden', !isTeacher));

  // Load first page
  if (isTeacher) {
    showPage('my-quizzes');
  } else {
    showPage('browse-quizzes');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('quizUser');
  stopTimer();
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  // Reset login form
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  switchTab('login');
}

// ============ NAV / PAGES ============
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.remove('hidden');

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const map = {
    'browse-quizzes': 0,
    'my-results': 1,
    'my-quizzes': 0,
    'create-quiz': 1,
  };

  // Page titles
  const titles = {
    'browse-quizzes': 'Browse Quizzes',
    'my-results': 'My Results',
    'my-quizzes': 'My Quizzes',
    'create-quiz': editingQuizId ? 'Edit Quiz' : 'Create Quiz',
    'add-questions': 'Add Questions',
    'take-quiz': 'Taking Quiz',
    'quiz-result': 'Your Result',
    'leaderboard': 'Leaderboard',
    'manage-questions': 'Manage Questions',
  };
  document.getElementById('page-title').textContent = titles[pageId] || pageId;

  // Auto-load data
  if (pageId === 'browse-quizzes') loadAvailableQuizzes();
  if (pageId === 'my-results') loadMyResults();
  if (pageId === 'my-quizzes') loadTeacherQuizzes();
  if (pageId === 'create-quiz' && !editingQuizId) resetCreateQuizForm();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ============ STUDENT: BROWSE QUIZZES ============
async function loadAvailableQuizzes() {
  const grid = document.getElementById('quiz-list-grid');
  grid.innerHTML = '<div class="empty-state">⏳ Loading quizzes...</div>';
  try {
    const quizzes = await apiFetch('/api/quizzes');
    if (!quizzes.length) {
      grid.innerHTML = '<div class="empty-state">📭 No quizzes available right now.</div>';
      return;
    }
    grid.innerHTML = quizzes.map(q => renderStudentQuizCard(q)).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">❌ ${err.message}</div>`;
  }
}

function renderStudentQuizCard(q) {
  return `
  <div class="quiz-card" onclick="startQuiz(${q.id})">
    <div>
      <div class="quiz-status-badge status-active">Active</div>
    </div>
    <div class="quiz-card-title">${escHtml(q.title)}</div>
    <div class="quiz-card-desc">${escHtml(q.description || 'No description provided.')}</div>
    <div class="quiz-card-meta">
      <span class="meta-item">⏱ ${q.timeLimitMinutes} min</span>
      <span class="meta-item">❓ ${q.questionCount} questions</span>
      <span class="meta-item">👤 ${escHtml(q.createdByName)}</span>
    </div>
    <div class="quiz-card-footer">
      <button class="btn btn-primary btn-sm" onclick="startQuiz(${q.id}); event.stopPropagation();">Attempt Quiz →</button>
    </div>
  </div>`;
}

// ============ STUDENT: START/TAKE QUIZ ============
async function startQuiz(quizId) {
  try {
    const [quiz, questions] = await Promise.all([
      apiFetch(`/api/quizzes/${quizId}`),
      apiFetch(`/api/questions/quiz/${quizId}`)
    ]);

    if (!questions.length) {
      showToast('This quiz has no questions yet!', 'error');
      return;
    }

    currentQuizData = { quiz, questions };
    studentAnswers = {};
    currentQuestionIndex = 0;
    quizStartTime = Date.now();

    document.getElementById('tq-title').textContent = quiz.title;

    renderAllQuestions();
    showPage('take-quiz');
    startTimer(quiz.timeLimitMinutes * 60);
    updateQuizProgress();
  } catch (err) {
    showToast('Failed to load quiz: ' + err.message, 'error');
  }
}

function renderAllQuestions() {
  const container = document.getElementById('quiz-questions-container');
  const { questions } = currentQuizData;

  container.innerHTML = questions.map((q, i) => `
    <div class="question-block ${i === 0 ? 'current' : ''}" id="qblock-${i}">
      <div class="question-num">Question ${i + 1} of ${questions.length}</div>
      <div class="question-text">${escHtml(q.questionText)}</div>
      <div class="options-list">
        ${['A','B','C','D'].map(opt => `
          <label class="option-label" id="opt-label-${i}-${opt}" onclick="selectOption(${i}, '${opt}', ${q.id})">
            <input type="radio" name="q${i}" value="${opt}" />
            <span class="opt-badge opt-${opt.toLowerCase()}">${opt}</span>
            <span>${escHtml(q['option' + opt])}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  scrollToQuestion(0);
}

function selectOption(qIndex, option, questionId) {
  studentAnswers[questionId] = option;

  // Update visual
  const block = document.getElementById(`qblock-${qIndex}`);
  block.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
  document.getElementById(`opt-label-${qIndex}-${option}`)?.classList.add('selected');
  block.classList.add('answered');
  block.classList.remove('current');

  updateQuizProgress();
}

function quizNav(dir) {
  const { questions } = currentQuizData;
  const newIdx = currentQuestionIndex + dir;
  if (newIdx < 0 || newIdx >= questions.length) return;
  currentQuestionIndex = newIdx;
  scrollToQuestion(newIdx);
  updateQuizProgress();
}

function scrollToQuestion(idx) {
  const el = document.getElementById(`qblock-${idx}`);
  if (!el) return;
  document.querySelectorAll('.question-block').forEach(b => b.classList.remove('current'));
  el.classList.add('current');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateQuizProgress() {
  const { questions } = currentQuizData;
  const answered = Object.keys(studentAnswers).length;
  const pct = (answered / questions.length) * 100;
  document.getElementById('quiz-progress-bar').style.width = pct + '%';
  document.getElementById('quiz-q-counter').textContent = `Q ${currentQuestionIndex + 1} / ${questions.length}`;
  document.getElementById('quiz-answered-count').textContent = `${answered} answered`;

  // Show/hide nav buttons
  document.getElementById('quiz-prev-btn').style.visibility = currentQuestionIndex > 0 ? 'visible' : 'hidden';
  document.getElementById('quiz-next-btn').style.visibility = currentQuestionIndex < questions.length - 1 ? 'visible' : 'hidden';
}

function startTimer(totalSeconds) {
  stopTimer();
  let remaining = totalSeconds;
  const timerEl = document.getElementById('quiz-timer');

  function tick() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (remaining <= 60) {
      timerEl.classList.add('danger');
    }
    if (remaining <= 0) {
      stopTimer();
      showToast('⏰ Time is up! Auto-submitting...', 'error');
      submitQuiz();
      return;
    }
    remaining--;
  }

  tick();
  quizTimer = setInterval(tick, 1000);
}

function stopTimer() {
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
  const timerEl = document.getElementById('quiz-timer');
  if (timerEl) timerEl.classList.remove('danger');
}

function confirmSubmitQuiz() {
  const { questions } = currentQuizData;
  const answered = Object.keys(studentAnswers).length;
  const unanswered = questions.length - answered;

  const msg = unanswered > 0
    ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
    : `All ${questions.length} questions answered. Submit the quiz?`;

  openModal('Submit Quiz?', msg, [
    { label: 'Cancel', className: 'btn-outline', action: 'closeModal()' },
    { label: 'Submit Now 🏁', className: 'btn-danger', action: 'submitQuiz()' },
  ]);
}

async function submitQuiz() {
  closeModal();
  stopTimer();

  const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
  const { quiz } = currentQuizData;

  try {
    // Convert Map to object with Long keys
    const answersObj = {};
    Object.entries(studentAnswers).forEach(([k, v]) => { answersObj[parseInt(k)] = v; });

    const result = await apiFetch('/api/submissions', {
      method: 'POST',
      body: JSON.stringify({
        studentId: currentUser.userId,
        quizId: quiz.id,
        answers: answersObj,
        timeTakenSeconds: timeTaken
      })
    });

    showResultPage(result);
  } catch (err) {
    if (err.message.includes('already submitted')) {
      showToast('You have already submitted this quiz!', 'error');
      showPage('browse-quizzes');
    } else {
      showToast('Submission failed: ' + err.message, 'error');
    }
  }
}

function showResultPage(result) {
  document.getElementById('r-correct').textContent = result.correctCount;
  document.getElementById('r-wrong').textContent = result.wrongCount;
  document.getElementById('r-skipped').textContent = result.skippedCount;
  document.getElementById('r-total').textContent = result.totalQuestions;
  document.getElementById('r-quiz-name').textContent = result.quizTitle;
  document.getElementById('r-score').textContent = `${result.score} pts`;
  document.getElementById('r-pct').textContent = `${result.percentage}%`;

  const mins = Math.floor(result.timeTakenSeconds / 60);
  const secs = result.timeTakenSeconds % 60;
  document.getElementById('r-time').textContent = `${mins}m ${secs}s`;

  // Heading
  document.getElementById('result-heading').textContent = `Score: ${result.score}`;

  // Icon and sub based on percentage
  const pct = result.percentage;
  let icon = '🎉', sub = 'Excellent performance!';
  if (pct < 40) { icon = '😢'; sub = 'Keep practicing!'; }
  else if (pct < 60) { icon = '🤔'; sub = 'Good effort, you can do better!'; }
  else if (pct < 80) { icon = '👍'; sub = 'Well done!'; }

  document.getElementById('result-icon').textContent = icon;
  document.getElementById('result-sub').textContent = sub;

  showPage('quiz-result');
}

// ============ STUDENT: MY RESULTS ============
async function loadMyResults() {
  const container = document.getElementById('results-list');
  container.innerHTML = '<div class="empty-state">⏳ Loading results...</div>';
  try {
    const results = await apiFetch(`/api/submissions/student/${currentUser.userId}`);
    if (!results.length) {
      container.innerHTML = '<div class="empty-state">📭 No results yet. Attempt a quiz!</div>';
      return;
    }
    container.innerHTML = results.map(r => `
      <div class="result-row">
        <div class="result-row-title">${escHtml(r.quizTitle)}</div>
        <div class="result-row-detail">
          <span>✅ ${r.correctCount} correct</span>
          <span>❌ ${r.wrongCount} wrong</span>
          <span>⏭ ${r.skippedCount} skipped</span>
        </div>
        <div class="result-row-score">${r.score} pts</div>
        <div style="font-size:0.8rem;color:var(--text3)">${r.percentage}%</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">❌ ${err.message}</div>`;
  }
}

// ============ TEACHER: MY QUIZZES ============
async function loadTeacherQuizzes() {
  const grid = document.getElementById('teacher-quiz-list');
  grid.innerHTML = '<div class="empty-state">⏳ Loading...</div>';
  try {
    const quizzes = await apiFetch(`/api/quizzes/teacher/${currentUser.userId}`);
    if (!quizzes.length) {
      grid.innerHTML = `<div class="empty-state">
        📭 No quizzes yet.
        <br/><br/>
        <button class="btn btn-primary" onclick="showPage('create-quiz')">➕ Create Your First Quiz</button>
      </div>`;
      return;
    }
    grid.innerHTML = quizzes.map(q => renderTeacherQuizCard(q)).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">❌ ${err.message}</div>`;
  }
}

function renderTeacherQuizCard(q) {
  const statusClass = q.active ? 'status-active' : 'status-inactive';
  const statusLabel = q.active ? 'Active' : 'Inactive';
  return `
  <div class="quiz-card">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span class="quiz-status-badge ${statusClass}">${statusLabel}</span>
    </div>
    <div class="quiz-card-title">${escHtml(q.title)}</div>
    <div class="quiz-card-desc">${escHtml(q.description || 'No description.')}</div>
    <div class="quiz-card-meta">
      <span class="meta-item">⏱ ${q.timeLimitMinutes} min</span>
      <span class="meta-item">❓ ${q.questionCount} questions</span>
    </div>
    <div class="teacher-card-actions">
      <button class="btn btn-outline btn-sm" onclick="openEditQuiz(${JSON.stringify(q).replace(/"/g, '&quot;')})">✏️ Edit</button>
      <button class="btn btn-outline btn-sm" onclick="openManageQuestions(${q.id}, '${escHtml(q.title)}')">🗂 Questions</button>
      <button class="btn btn-outline btn-sm" onclick="openAddQuestions(${q.id}, '${escHtml(q.title)}')">➕ Add Q</button>
      <button class="btn btn-outline btn-sm" onclick="viewLeaderboard(${q.id}, '${escHtml(q.title)}')">🏆 Results</button>
      <button class="btn btn-outline btn-sm" onclick="toggleQuizActive(${q.id})">
        ${q.active ? '🔒 Deactivate' : '🔓 Activate'}
      </button>
      <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);"
        onclick="confirmDeleteQuiz(${q.id}, '${escHtml(q.title)}')">🗑 Delete</button>
    </div>
  </div>`;
}

// ============ TEACHER: CREATE / EDIT QUIZ ============
function resetCreateQuizForm() {
  editingQuizId = null;
  document.getElementById('create-quiz-title').textContent = 'Create Quiz';
  document.getElementById('create-quiz-btn-text').textContent = 'Save & Add Questions';
  document.getElementById('quiz-title-input').value = '';
  document.getElementById('quiz-desc-input').value = '';
  document.getElementById('quiz-time-input').value = '';
  hideError('create-quiz-error');
}

function openEditQuiz(quiz) {
  editingQuizId = quiz.id;
  document.getElementById('create-quiz-title').textContent = 'Edit Quiz';
  document.getElementById('create-quiz-btn-text').textContent = 'Save Changes';
  document.getElementById('quiz-title-input').value = quiz.title;
  document.getElementById('quiz-desc-input').value = quiz.description || '';
  document.getElementById('quiz-time-input').value = quiz.timeLimitMinutes;
  hideError('create-quiz-error');
  showPage('create-quiz');
}

async function handleCreateQuiz(e) {
  e.preventDefault();
  hideError('create-quiz-error');
  const title = document.getElementById('quiz-title-input').value.trim();
  const description = document.getElementById('quiz-desc-input').value.trim();
  const timeLimitMinutes = parseInt(document.getElementById('quiz-time-input').value);

  if (!title) { showError('create-quiz-error', 'Title is required'); return; }
  if (!timeLimitMinutes || timeLimitMinutes < 1) { showError('create-quiz-error', 'Valid time limit required'); return; }

  document.getElementById('create-quiz-btn').disabled = true;

  try {
    const body = { title, description, timeLimitMinutes, teacherId: currentUser.userId };
    let quiz;
    if (editingQuizId) {
      quiz = await apiFetch(`/api/quizzes/${editingQuizId}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Quiz updated!', 'success');
      showPage('my-quizzes');
    } else {
      quiz = await apiFetch('/api/quizzes', { method: 'POST', body: JSON.stringify(body) });
      showToast('Quiz created! Now add questions.', 'success');
      openAddQuestions(quiz.id, quiz.title);
    }
    editingQuizId = null;
  } catch (err) {
    showError('create-quiz-error', err.message);
  }
  document.getElementById('create-quiz-btn').disabled = false;
}

async function toggleQuizActive(quizId) {
  try {
    await apiFetch(`/api/quizzes/${quizId}/toggle`, { method: 'PATCH' });
    showToast('Quiz status updated!', 'success');
    loadTeacherQuizzes();
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
}

function confirmDeleteQuiz(quizId, title) {
  openModal('Delete Quiz?',
    `Are you sure you want to delete "<b>${escHtml(title)}</b>"? This will also delete all questions and student submissions.`,
    [
      { label: 'Cancel', className: 'btn-outline', action: 'closeModal()' },
      { label: 'Delete', className: 'btn-danger', action: `deleteQuiz(${quizId})` },
    ]
  );
}

async function deleteQuiz(quizId) {
  closeModal();
  try {
    await apiFetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
    showToast('Quiz deleted.', 'success');
    loadTeacherQuizzes();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
}

// ============ TEACHER: ADD QUESTIONS ============
function openAddQuestions(quizId, quizTitle) {
  addQuestionsQuizId = quizId;
  addedQuestionsCache = [];
  document.getElementById('add-q-quiz-name').textContent = `Quiz: ${quizTitle}`;
  document.getElementById('add-question-form').reset();
  document.getElementById('added-questions-list').innerHTML = '';
  document.getElementById('q-count-badge').textContent = '0';
  hideError('add-q-error');
  showPage('add-questions');
  // Load existing questions count
  loadExistingQuestionsForAdd(quizId);
}

async function loadExistingQuestionsForAdd(quizId) {
  try {
    const questions = await apiFetch(`/api/questions/quiz/${quizId}/teacher`);
    addedQuestionsCache = questions;
    renderAddedQuestions();
  } catch {}
}

function renderAddedQuestions() {
  const list = document.getElementById('added-questions-list');
  document.getElementById('q-count-badge').textContent = addedQuestionsCache.length;
  if (!addedQuestionsCache.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:0.85rem;padding:16px;text-align:center;">No questions added yet.</div>';
    return;
  }
  list.innerHTML = addedQuestionsCache.map((q, i) => `
    <div class="added-q-card">
      <div class="added-q-text">Q${i+1}. ${escHtml(q.questionText)}</div>
      <div class="added-q-answer">✅ Correct: ${q.correctOption}</div>
    </div>
  `).join('');
}

async function handleAddQuestion(e) {
  e.preventDefault();
  hideError('add-q-error');
  const qText = document.getElementById('q-text').value.trim();
  const optA = document.getElementById('q-optA').value.trim();
  const optB = document.getElementById('q-optB').value.trim();
  const optC = document.getElementById('q-optC').value.trim();
  const optD = document.getElementById('q-optD').value.trim();
  const correct = document.querySelector('input[name="correct"]:checked')?.value;

  if (!correct) { showError('add-q-error', 'Please select the correct answer.'); return; }

  try {
    const q = await apiFetch('/api/questions', {
      method: 'POST',
      body: JSON.stringify({
        quizId: addQuestionsQuizId,
        questionText: qText,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctOption: correct,
        orderIndex: addedQuestionsCache.length + 1
      })
    });
    addedQuestionsCache.push(q);
    renderAddedQuestions();
    document.getElementById('add-question-form').reset();
    showToast('Question added!', 'success');
  } catch (err) {
    showError('add-q-error', err.message);
  }
}

// ============ TEACHER: MANAGE QUESTIONS ============
async function openManageQuestions(quizId, quizTitle) {
  document.getElementById('mq-quiz-name').textContent = `Quiz: ${quizTitle}`;
  showPage('manage-questions');
  const list = document.getElementById('manage-questions-list');
  list.innerHTML = '<div class="empty-state">⏳ Loading questions...</div>';
  try {
    const questions = await apiFetch(`/api/questions/quiz/${quizId}/teacher`);
    if (!questions.length) {
      list.innerHTML = '<div class="empty-state">No questions yet.</div>';
      return;
    }
    list.innerHTML = questions.map((q, i) => `
      <div class="manage-q-card">
        <div class="manage-q-num">${i+1}</div>
        <div class="manage-q-body">
          <div class="manage-q-text">${escHtml(q.questionText)}</div>
          <div style="font-size:0.8rem;color:var(--text3);margin-top:4px;">
            A: ${escHtml(q.optionA)} &nbsp;|&nbsp; B: ${escHtml(q.optionB)} &nbsp;|&nbsp;
            C: ${escHtml(q.optionC)} &nbsp;|&nbsp; D: ${escHtml(q.optionD)}
          </div>
          <div class="manage-q-correct">✅ Correct: Option ${q.correctOption}</div>
        </div>
        <div class="manage-q-actions">
          <button class="btn btn-sm btn-outline" onclick="confirmDeleteQuestion(${q.id}, ${quizId}, '${escHtml(quizTitle)}')">🗑</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state">❌ ${err.message}</div>`;
  }
}

function confirmDeleteQuestion(questionId, quizId, quizTitle) {
  openModal('Delete Question?', 'This will permanently remove this question from the quiz.',
    [
      { label: 'Cancel', className: 'btn-outline', action: 'closeModal()' },
      { label: 'Delete', className: 'btn-danger', action: `deleteQuestion(${questionId}, ${quizId}, '${quizTitle}')` },
    ]
  );
}

async function deleteQuestion(questionId, quizId, quizTitle) {
  closeModal();
  try {
    await apiFetch(`/api/questions/${questionId}`, { method: 'DELETE' });
    showToast('Question deleted.', 'success');
    openManageQuestions(quizId, quizTitle);
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
}

// ============ TEACHER: LEADERBOARD ============
async function viewLeaderboard(quizId, quizTitle) {
  document.getElementById('lb-quiz-name').textContent = `Quiz: ${quizTitle}`;
  showPage('leaderboard');
  const container = document.getElementById('leaderboard-container');
  container.innerHTML = '<div class="empty-state">⏳ Loading results...</div>';
  try {
    const results = await apiFetch(`/api/submissions/quiz/${quizId}`);
    if (!results.length) {
      container.innerHTML = '<div class="empty-state">📭 No students have attempted this quiz yet.</div>';
      return;
    }
    // Sort by score desc
    results.sort((a, b) => b.score - a.score);
    const medals = ['🥇', '🥈', '🥉'];
    container.innerHTML = results.map((r, i) => `
      <div class="lb-row">
        <div class="lb-rank">${medals[i] || (i + 1)}</div>
        <div>
          <div class="lb-name">${escHtml(r.studentName)}</div>
          <div class="lb-meta">✅ ${r.correctCount} correct · ❌ ${r.wrongCount} wrong · ⏭ ${r.skippedCount} skipped · ⏱ ${formatTime(r.timeTakenSeconds)}</div>
        </div>
        <div>
          <div class="lb-score">${r.score} pts</div>
          <div style="font-size:0.78rem;color:var(--text3);text-align:right">${r.percentage}%</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">❌ ${err.message}</div>`;
  }
}

// ============ MODAL ============
function openModal(title, body, actions) {
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">${title}</div>
    <div class="modal-body">${body}</div>
    <div class="modal-actions">
      ${actions.map(a => `<button class="btn ${a.className}" onclick="${a.action}">${a.label}</button>`).join('')}
    </div>
  `;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ============ HELPERS ============
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// Role option radio visual
document.querySelectorAll('.role-option input').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.role-option').forEach(el => el.classList.remove('active'));
    radio.closest('.role-option').classList.add('active');
  });
});

// ============ INIT ============
(function init() {
  // Restore session from localStorage
  const saved = localStorage.getItem('quizUser');
  if (saved) {
    try {
      const user = JSON.parse(saved);
      currentUser = user;
      enterApp();
      return;
    } catch {}
  }
  // Show auth screen
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
})();
