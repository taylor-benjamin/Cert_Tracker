// CertTracker Global State Manager with LocalStorage Persistence
import {
  DEFAULT_CERTIFICATIONS,
  DEFAULT_BADGES,
  INITIAL_USER,
  getInitialGoals,
  getInitialSessions,
  getInitialFriends,
  SPRINT_1_STORIES,
  INITIAL_BURNDOWN_DAYS,
  INITIAL_RETROSPECTIVE
} from './data/seedData.js';

const STORAGE_KEY = 'certtracker_app_state_v1';

const DEFAULT_STUDY_GROUPS = [
  {
    id: 'grp_aws',
    certId: 'aws-saa',
    name: 'AWS Cloud Architects Hub',
    membersCount: 142,
    activeNow: 18,
    description: 'Solutions architect candidates preparing for SAA-C03. Weekly practice review and lab discussions.'
  },
  {
    id: 'grp_pmp',
    certId: 'pmp',
    name: 'PMP Agile & Predictive Squad',
    membersCount: 98,
    activeNow: 11,
    description: 'Targeting 2026 PMP certifications. EVM formulas, servant leadership drills, and mock reviews.'
  },
  {
    id: 'grp_sec',
    certId: 'comptia-sec',
    name: 'Security+ Cyber Defense Circle',
    membersCount: 84,
    activeNow: 9,
    description: 'SY0-701 acronym flashcards, performance-based questions (PBQs), and attack vector defense.'
  }
];

// Fresh copy of the demo state. Cloned so in-place edits (like unlocking a badge)
// never leak into the shared seed constants.
function defaultState() {
  return structuredClone({
    user: INITIAL_USER,
    isLoggedIn: true,
    theme: 'light',
    certifications: DEFAULT_CERTIFICATIONS,
    goals: getInitialGoals(),
    sessions: getInitialSessions(),
    badges: DEFAULT_BADGES,
    quizHistory: [
      {
        id: 'qh_1',
        certId: 'aws-saa',
        certName: 'AWS Certified Solutions Architect',
        score: 80,
        correct: 4,
        total: 5,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ],
    sprintStories: SPRINT_1_STORIES,
    burndownDays: INITIAL_BURNDOWN_DAYS,
    retrospective: INITIAL_RETROSPECTIVE,
    friends: getInitialFriends(),
    generatedQuestions: {},
    notificationsEnabled: false,
    lastNotifiedAt: null,
    dismissedReminders: [],
    studyGroups: DEFAULT_STUDY_GROUPS
  });
}

// --- Cloud sync (Cloudflare Worker + D1) ---
// These arrays have their own D1 tables and sync record by record.
const RECORD_KEYS = ['goals', 'sessions', 'quizHistory'];
// Everything not listed here is saved together as the user's "settings" document.
const NOT_SETTINGS = new Set(['user', 'isLoggedIn', ...RECORD_KEYS]);
const SYNC_DELAY_MS = 400;
const RETRY_DELAY_MS = 5000;

async function apiFetch(path, body) {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? { Accept: 'application/json' } : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const isJson = (res.headers.get('Content-Type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;
  return { res, isJson, data };
}

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
    // 'local' = browser storage (demo or static hosting), 'cloud' = signed in, saved to D1
    this.mode = 'local';
    this.apiAvailable = false;
    this.synced = null;
    this.syncTimer = null;
    this.syncing = false;
    this.syncQueued = false;
    this.syncErrorShown = false;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flushSync({ keepalive: true });
    });
  }

  // Detects the API. On static hosting (GitHub Pages) there is none and the app stays local.
  async init() {
    try {
      const { res, isJson, data } = await apiFetch('/api/state');
      if (!isJson) return;
      this.apiAvailable = true;
      if (res.ok) {
        this.hydrate(data);
      } else {
        // API is there but nobody is signed in: show the demo data with a Log In button
        this.state.isLoggedIn = false;
      }
    } catch (e) {
      // Offline or no API: stay local
    }
  }

  get isCloud() {
    return this.mode === 'cloud';
  }

  hydrate(data) {
    const settings = {};
    for (const [k, v] of Object.entries(data.settings || {})) {
      if (!NOT_SETTINGS.has(k)) settings[k] = v;
    }
    this.state = {
      ...defaultState(),
      ...settings,
      user: data.user,
      isLoggedIn: true,
      goals: data.goals || [],
      sessions: data.sessions || [],
      quizHistory: data.quizHistory || []
    };
    this.mode = 'cloud';
    this.synced = this.snapshot();
    // New account: settings haven't been written yet, so the first sync sends them
    if (!data.settings) {
      this.synced.settings = null;
      this.scheduleSync(0);
    }
    this.notify();
  }

  async loadRemote() {
    const { res, data } = await apiFetch('/api/state');
    if (!res.ok) throw new Error(data?.error || 'Could not load your data');
    this.hydrate(data);
  }

  loadState() {
    const state = defaultState();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Fill anything missing from older saves with defaults
        for (const key of Object.keys(state)) {
          if (parsed[key] !== undefined && parsed[key] !== null) state[key] = parsed[key];
        }
      }
    } catch (e) {
      console.warn('Could not read localStorage state, initializing fresh state:', e);
    }
    return state;
  }

  saveState() {
    if (this.isCloud) {
      this.scheduleSync();
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Failed to save state to localStorage:', e);
      }
    }
    this.notify();
  }

  // --- Cloud sync internals ---
  snapshot() {
    const records = {};
    for (const key of RECORD_KEYS) {
      records[key] = new Map((this.state[key] || []).map(item => [item.id, JSON.stringify(item)]));
    }
    const settings = {};
    for (const [k, v] of Object.entries(this.state)) {
      if (!NOT_SETTINGS.has(k)) settings[k] = v;
    }
    return { records, settings: JSON.stringify(settings), profile: JSON.stringify(this.state.user) };
  }

  // Only what changed since the last successful sync
  diff(prev, next) {
    const body = {};
    for (const key of RECORD_KEYS) {
      const upsert = [];
      const del = [];
      for (const [id, json] of next.records[key]) {
        if (prev.records[key].get(id) !== json) upsert.push(JSON.parse(json));
      }
      for (const id of prev.records[key].keys()) {
        if (!next.records[key].has(id)) del.push(id);
      }
      if (upsert.length || del.length) body[key] = { upsert, delete: del };
    }
    if (prev.settings !== next.settings) body.settings = JSON.parse(next.settings);
    if (prev.profile !== next.profile) body.profile = JSON.parse(next.profile);
    return Object.keys(body).length ? body : null;
  }

  scheduleSync(delay = SYNC_DELAY_MS) {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.flushSync(), delay);
  }

  async flushSync({ keepalive = false } = {}) {
    if (!this.isCloud) return;
    clearTimeout(this.syncTimer);
    if (this.syncing) {
      this.syncQueued = true;
      return;
    }
    const next = this.snapshot();
    const body = this.diff(this.synced, next);
    if (!body) return;

    const payload = JSON.stringify(body);
    this.syncing = true;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: keepalive && payload.length < 60000 // browsers cap keepalive bodies at 64KB
      });
      if (res.status === 401) {
        this.endCloudSession('Your session expired. Log in again to keep syncing.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.error || `Sync failed (${res.status})`);
        err.retry = res.status >= 500;
        throw err;
      }
      if (this.isCloud) this.synced = next;
      this.syncErrorShown = false;
    } catch (e) {
      console.error('Cloud sync failed:', e);
      if (!this.syncErrorShown) {
        window.certTrackerApp?.showToast(`Couldn't save to the cloud: ${e.message}`, 'warning');
        this.syncErrorShown = true;
      }
      // Network and server errors retry on their own; rejected data waits for the next change
      if (e.retry !== false) this.scheduleSync(RETRY_DELAY_MS);
    } finally {
      this.syncing = false;
      if (this.syncQueued) {
        this.syncQueued = false;
        this.scheduleSync(0);
      }
    }
  }

  endCloudSession(message) {
    clearTimeout(this.syncTimer);
    this.mode = 'local';
    this.synced = null;
    this.state = this.loadState();
    this.state.isLoggedIn = false;
    this.notify();
    if (message) window.certTrackerApp?.showToast(message, 'warning');
    window.certTrackerApp?.renderAll();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in state subscriber:', err);
      }
    }
  }

  // --- Theme Management ---
  setTheme(theme) {
    this.state.theme = theme;
    this.saveState();
  }

  toggleTheme() {
    const next = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  // --- Auth & User ---
  setUser(user) {
    this.state.user = user;
    this.state.isLoggedIn = true;
    this.saveState();
  }

  async logout() {
    if (this.isCloud) {
      await this.flushSync();
      await apiFetch('/api/auth/logout', {}).catch(() => {});
      this.endCloudSession();
      return;
    }
    this.state.isLoggedIn = false;
    this.saveState();
  }

  // Returns { ok, error }. Uses the API when it exists, otherwise simulates login locally.
  async login(email, password) {
    if (!this.apiAvailable) {
      this.state.isLoggedIn = true;
      this.state.user = { ...this.state.user, email, name: this.state.user?.name || email.split('@')[0] };
      this.saveState();
      return { ok: true };
    }
    try {
      const { res, data } = await apiFetch('/api/auth/login', { email, password });
      if (!res.ok) return { ok: false, error: data?.error || 'Login failed' };
      await this.loadRemote();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Could not reach the server' };
    }
  }

  async signup(name, email, password) {
    if (!this.apiAvailable) {
      this.setUser({
        id: 'usr_' + Date.now(),
        name,
        email,
        avatarPhoto: null,
        role: 'member',
        joinedDate: new Date().toISOString().split('T')[0],
        credlyUsername: null,
        mfa: { enabled: false, method: null },
        onboardingComplete: false,
        careerGoal: null
      });
      return { ok: true };
    }
    try {
      const { res, data } = await apiFetch('/api/auth/signup', { name, email, password });
      if (!res.ok) return { ok: false, error: data?.error || 'Sign up failed' };
      await this.loadRemote();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Could not reach the server' };
    }
  }

  setUserAvatarPhoto(dataUrl) {
    this.state.user = { ...this.state.user, avatarPhoto: dataUrl };
    this.saveState();
  }

  removeUserAvatarPhoto() {
    this.state.user = { ...this.state.user, avatarPhoto: null };
    this.saveState();
  }

  linkCredly(username) {
    this.state.user = { ...this.state.user, credlyUsername: username };
    this.saveState();
  }

  unlinkCredly() {
    this.state.user = { ...this.state.user, credlyUsername: null };
    this.saveState();
  }

  setMfaSettings(mfa) {
    this.state.user = { ...this.state.user, mfa };
    this.saveState();
  }

  completeOnboarding(answers) {
    this.state.user = {
      ...this.state.user,
      onboardingComplete: true,
      careerGoal: answers
    };
    this.saveState();
  }

  // --- Community: Follow Friends ---
  toggleFollowFriend(friendId) {
    const friend = this.state.friends.find(f => f.id === friendId);
    if (friend) {
      friend.following = !friend.following;
      this.saveState();
    }
  }

  // --- Quiz: AI-Generated Question Bank ---
  addGeneratedQuestions(certId, questions) {
    if (!this.state.generatedQuestions[certId]) {
      this.state.generatedQuestions[certId] = [];
    }
    this.state.generatedQuestions[certId].push(...questions);
    this.saveState();
    return this.state.generatedQuestions[certId];
  }

  // --- Push Notification Reminders ---
  setNotificationsEnabled(enabled) {
    this.state.notificationsEnabled = enabled;
    this.saveState();
  }

  setLastNotifiedAt(dateStr) {
    this.state.lastNotifiedAt = dateStr;
    this.saveState();
  }

  dismissReminder(reminderId) {
    if (!this.state.dismissedReminders.includes(reminderId)) {
      this.state.dismissedReminders = [...this.state.dismissedReminders, reminderId];
      this.saveState();
    }
  }

  // --- Goals Management ---
  addGoal(goalData) {
    const newGoal = {
      id: 'goal_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      resources: [],
      ...goalData
    };
    this.state.goals.unshift(newGoal);
    this.checkBadges();
    this.saveState();
    return newGoal;
  }

  updateGoal(id, updates) {
    const idx = this.state.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.goals[idx] = { ...this.state.goals[idx], ...updates };
      this.checkBadges();
      this.saveState();
      return this.state.goals[idx];
    }
    return null;
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    // Optionally delete associated sessions or keep them
    this.saveState();
  }

  markGoalStatus(id, status) {
    const goal = this.state.goals.find(g => g.id === id);
    if (goal) {
      goal.status = status;
      if (status === 'passed') {
        this.unlockBadge('first_pass');
        goal.passedDate = new Date().toISOString().split('T')[0];
        const cert = this.state.certifications.find(c => c.id === goal.certId);
        if (cert && cert.validityYears) {
          const expiry = new Date();
          expiry.setFullYear(expiry.getFullYear() + cert.validityYears);
          goal.certExpiryDate = expiry.toISOString().split('T')[0];
        } else {
          goal.certExpiryDate = null;
        }
      }
      this.saveState();
    }
  }

  addGoalResource(goalId, resource) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      if (!goal.resources) goal.resources = [];
      const newRes = {
        id: 'res_' + Date.now(),
        ...resource
      };
      goal.resources.push(newRes);
      this.saveState();
      return newRes;
    }
    return null;
  }

  deleteGoalResource(goalId, resourceId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal && goal.resources) {
      goal.resources = goal.resources.filter(r => r.id !== resourceId);
      this.saveState();
    }
  }

  // --- Study Sessions Management ---
  addSession(sessionData) {
    const newSession = {
      id: 'sess_' + Date.now(),
      ...sessionData
    };
    this.state.sessions.unshift(newSession);
    this.checkBadges();
    this.saveState();
    return newSession;
  }

  updateSession(id, updates) {
    const idx = this.state.sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.state.sessions[idx] = { ...this.state.sessions[idx], ...updates };
      this.checkBadges();
      this.saveState();
      return this.state.sessions[idx];
    }
    return null;
  }

  deleteSession(id) {
    this.state.sessions = this.state.sessions.filter(s => s.id !== id);
    this.checkBadges();
    this.saveState();
  }

  // --- Quiz History ---
  addQuizAttempt(attempt) {
    const newAttempt = {
      id: 'qa_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...attempt
    };
    this.state.quizHistory.unshift(newAttempt);
    if (newAttempt.score >= 90) {
      this.unlockBadge('quiz_ace');
    }
    this.checkBadges();
    this.saveState();
    return newAttempt;
  }

  // --- Badges Engine ---
  unlockBadge(badgeId) {
    const badge = this.state.badges.find(b => b.id === badgeId);
    if (badge && !badge.unlockedAt) {
      badge.unlockedAt = new Date().toISOString().split('T')[0];
      return badge;
    }
    return null;
  }

  checkBadges() {
    const sessions = this.state.sessions;
    const totalMinutes = sessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    const totalHours = totalMinutes / 60;

    // First session badge
    if (sessions.length > 0) {
      this.unlockBadge('first_session');
    }

    // Hours badges
    if (totalHours >= 10) this.unlockBadge('hours_10');
    if (totalHours >= 50) this.unlockBadge('hours_50');
    if (totalHours >= 100) this.unlockBadge('hours_100');

    // Calculate streak
    const streak = this.calculateStreak();
    if (streak >= 3) this.unlockBadge('streak_3');
    if (streak >= 7) this.unlockBadge('streak_7');
  }

  calculateStreak() {
    const sessionDates = new Set(this.state.sessions.map(s => s.date));
    if (sessionDates.size === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fmtDate = (d) => d.toISOString().split('T')[0];
    const todayStr = fmtDate(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = fmtDate(yesterday);

    // Current streak is active if user studied today OR yesterday
    let checkDate = new Date(today);
    if (!sessionDates.has(todayStr)) {
      if (sessionDates.has(yesterdayStr)) {
        checkDate = new Date(yesterday);
      } else {
        return 0; // Streak broken
      }
    }

    let streak = 0;
    while (sessionDates.has(fmtDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  // --- Sprint Hub & Agile Backlog Management ---
  updateSprintStoryStatus(storyId, status) {
    const story = this.state.sprintStories.find(s => s.id === storyId);
    if (story) {
      story.status = status;
      this.saveState();
    }
  }

  updateBurndownDay(dayIndex, actualPoints) {
    if (this.state.burndownDays[dayIndex]) {
      this.state.burndownDays[dayIndex].actual = Number(actualPoints);
      this.saveState();
    }
  }

  addRetrospectiveItem(category, text) {
    if (this.state.retrospective[category]) {
      this.state.retrospective[category].push(text);
      this.saveState();
    }
  }

  // --- Admin: Manage Supported Certifications ---
  addSupportedCert(cert) {
    const newCert = {
      id: 'cert_' + Date.now(),
      domains: [],
      suggestedResources: [],
      ...cert
    };
    this.state.certifications.push(newCert);
    this.saveState();
    return newCert;
  }

  updateSupportedCert(id, updates) {
    const idx = this.state.certifications.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.state.certifications[idx] = { ...this.state.certifications[idx], ...updates };
      this.saveState();
      return this.state.certifications[idx];
    }
    return null;
  }

  deleteSupportedCert(id) {
    this.state.certifications = this.state.certifications.filter(c => c.id !== id);
    this.saveState();
  }

  // --- Reset & Import/Export ---
  resetToDefaults() {
    const fresh = defaultState();
    if (this.isCloud) {
      // Keep the signed-in account; only the study data goes back to the demo set
      fresh.user = this.state.user;
    }
    this.state = fresh;
    this.saveState();
  }

  exportDataJson() {
    return JSON.stringify(this.state, null, 2);
  }

  importDataJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.goals) && Array.isArray(data.sessions)) {
        if (this.isCloud) {
          // The signed-in account isn't replaced by an imported file
          delete data.user;
          delete data.isLoggedIn;
        }
        this.state = { ...this.state, ...data };
        this.saveState();
        return { success: true };
      }
      return { success: false, error: 'Invalid data format. Missing goals or sessions.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const store = new StateStore();
