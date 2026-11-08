// Simple session-based authentication for MVP
// In production, replace with proper NextAuth.js or similar

interface UserSession {
  userId: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Store sessions in memory (in production, use secure session storage)
const sessions = new Map<string, UserSession>();

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createSession(userId: string, email: string, name: string): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    userId,
    email,
    name,
    createdAt: new Date(),
  });
  return sessionId;
}

export function getSession(sessionId: string): UserSession | null {
  return sessions.get(sessionId) || null;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 6 characters
  return password.length >= 6;
}
