// Conversation session management service — with disk persistence for nodemon restarts
import fs from 'fs';
import path from 'path';

const SESSIONS_FILE = path.join(process.cwd(), 'cache', 'sessions.json');

class ConversationSession {
  constructor(sessionId, userId = null) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.state = 'initial'; // initial, questioning, assessment, guidance, complete
    this.messages = [];
    this.context = {
      symptoms: [],
      assessment: {},
      questionsAsked: [],
      userResponses: []
    };
    this.metadata = {};
  }

  addMessage(role, content, extras = {}) {
    this.messages.push({
      id: Date.now() + Math.random(),
      role, // 'user' or 'ai'
      content,
      timestamp: new Date(),
      ...extras
    });
    this.lastActivity = new Date();
    // Persist after every message
    saveSessions();
  }

  updateState(newState) {
    this.state = newState;
    this.lastActivity = new Date();
    saveSessions();
  }

  addSymptom(symptom) {
    if (!this.context.symptoms.includes(symptom)) {
      this.context.symptoms.push(symptom);
    }
  }

  addUserResponse(question, answer) {
    this.context.userResponses.push({
      question,
      answer,
      timestamp: new Date()
    });
  }

  addQuestionAsked(question) {
    if (!this.context.questionsAsked.includes(question)) {
      this.context.questionsAsked.push(question);
    }
  }

  getRecentMessages(limit = 10) {
    return this.messages.slice(-limit);
  }

  isExpired(maxAgeMinutes = 30) {
    const now = new Date();
    const age = (now - new Date(this.lastActivity)) / (1000 * 60);
    return age > maxAgeMinutes;
  }

  toSummary() {
    return {
      sessionId: this.sessionId,
      state: this.state,
      messageCount: this.messages.length,
      lastActivity: this.lastActivity,
      symptoms: this.context.symptoms,
      questionsAsked: this.context.questionsAsked.length
    };
  }
}

// In-memory session store
const sessions = new Map();

// ─── Disk persistence ───

function saveSessions() {
  try {
    const data = {};
    for (const [id, session] of sessions.entries()) {
      data[id] = {
        sessionId: session.sessionId,
        userId: session.userId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        state: session.state,
        messages: session.messages,
        context: session.context,
        metadata: session.metadata
      };
    }
    // Ensure cache directory exists
    const cacheDir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ Failed to save sessions:', err.message);
  }
}

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const data = JSON.parse(raw);
      let loaded = 0;
      for (const [id, sData] of Object.entries(data)) {
        const session = new ConversationSession(sData.sessionId, sData.userId);
        session.createdAt = new Date(sData.createdAt);
        session.lastActivity = new Date(sData.lastActivity);
        session.state = sData.state;
        session.messages = sData.messages || [];
        session.context = sData.context || { symptoms: [], assessment: {}, questionsAsked: [], userResponses: [] };
        session.metadata = sData.metadata || {};
        
        // Skip expired sessions
        if (!session.isExpired()) {
          sessions.set(id, session);
          loaded++;
        }
      }
      if (loaded > 0) {
        console.log(`📂 Restored ${loaded} active session(s) from disk`);
      }
    }
  } catch (err) {
    console.error('⚠️ Failed to load sessions:', err.message);
  }
}

// Load sessions on startup (survives nodemon restarts!)
loadSessions();

export function createSession(userId = null) {
  const sessionId = generateSessionId();
  const session = new ConversationSession(sessionId, userId);
  sessions.set(sessionId, session);
  saveSessions();
  console.log(`🆕 Created session: ${sessionId}`);
  return session;
}

export function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session && !session.isExpired()) {
    console.log(`📎 Found session: ${sessionId} (${session.messages.length} messages)`);
    return session;
  }
  if (session) {
    // Clean up expired session
    console.log(`⏰ Session expired: ${sessionId}`);
    sessions.delete(sessionId);
    saveSessions();
  } else {
    console.log(`❌ Session not found: ${sessionId}`);
  }
  return null;
}

export function updateSession(sessionId, updater) {
  const session = getSession(sessionId);
  if (session) {
    updater(session);
    saveSessions();
    return session;
  }
  return null;
}

export function endSession(sessionId) {
  sessions.delete(sessionId);
  saveSessions();
}

export function cleanupExpiredSessions() {
  let cleaned = 0;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.isExpired()) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    saveSessions();
    console.log(`🧹 Cleaned ${cleaned} expired session(s)`);
  }
}

export function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);