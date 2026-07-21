import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { getAgentDir } from "./session-reader";

// Pinned state is cross-project UI metadata, not session content, so it lives
// in a sibling config file (same pattern as pi's own models.json/auth.json)
// rather than inside the .jsonl session files pi rewrites/migrates.

declare global {
  var __piPinnedSessions: Set<string> | undefined;
}

const PINNED_FILE = () => join(getAgentDir(), "pinned-sessions.json");

function readPinnedFile(): Set<string> {
  try {
    if (!existsSync(PINNED_FILE())) return new Set();
    const raw = readFileSync(PINNED_FILE(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(
        parsed.filter((id): id is string => typeof id === "string"),
      );
    }
    return new Set();
  } catch {
    return new Set();
  }
}

/** Cached view of the pinned session id set. Invalidated on every write. */
export function getPinnedSessionIds(): Set<string> {
  if (!globalThis.__piPinnedSessions) {
    globalThis.__piPinnedSessions = readPinnedFile();
  }
  return globalThis.__piPinnedSessions;
}

export function setSessionPinned(sessionId: string, pinned: boolean): void {
  const set = new Set(getPinnedSessionIds());
  if (pinned) set.add(sessionId);
  else set.delete(sessionId);
  globalThis.__piPinnedSessions = set;
  writeFileSync(PINNED_FILE(), JSON.stringify([...set], null, 2) + "\n");
}

/** Remove a session id from the pinned set (e.g. when the session is deleted). */
export function unpinSession(sessionId: string): void {
  setSessionPinned(sessionId, false);
}
