/**
 * Stable session id for drift tracking.
 *
 * MCP hosts usually run one stdio server process per conversation. When the
 * caller omits sessionId, we reuse a process-scoped id so sessionTrend still
 * works even if the skill/host forgets to pass one.
 *
 * Override with ETHICS_SESSION_ID when you need a known id (evals, multi-process).
 */

const processScopedSessionId =
  (process.env.ETHICS_SESSION_ID && process.env.ETHICS_SESSION_ID.trim()) ||
  `mcp-${process.pid}-${Date.now().toString(36)}`;

export function getProcessSessionId(): string {
  return processScopedSessionId;
}

/** Prefer an explicit sessionId; otherwise the process default. */
export function resolveSessionId(explicit?: string | null): string {
  if (typeof explicit === 'string' && explicit.trim().length > 0) {
    return explicit.trim();
  }
  return processScopedSessionId;
}
