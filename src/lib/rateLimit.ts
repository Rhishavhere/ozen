interface UsageLog {
  timestamp: number;
  tokens: number;
}

const STORAGE_KEY = 'ozen-usage-logs';

function getLogs(): UsageLog[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLogs(logs: UsageLog[]) {
  // Keep only logs from the last 24 hours to prevent localStorage overflow
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = logs.filter(log => log.timestamp >= oneDayAgo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function logUsage(tokens: number) {
  const logs = getLogs();
  logs.push({ timestamp: Date.now(), tokens });
  saveLogs(logs);
  
  // Dispatch custom event so UI can update live
  window.dispatchEvent(new Event('ozen-usage-updated'));
}

export function getUsageStats() {
  const logs = getLogs();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const logsLastMinute = logs.filter(l => l.timestamp >= oneMinuteAgo);
  const logsLastDay = logs.filter(l => l.timestamp >= oneDayAgo);

  const rpm = logsLastMinute.length;
  const rpd = logsLastDay.length;
  
  const tpm = logsLastMinute.reduce((sum, log) => sum + log.tokens, 0);
  const tpd = logsLastDay.reduce((sum, log) => sum + log.tokens, 0);

  return { rpm, rpd, tpm, tpd };
}

export function getTokenGraphData(minutes = 10): number[] {
  const logs = getLogs();
  const now = Date.now();
  const result = Array(minutes).fill(0);
  
  // Group logs into minute buckets
  logs.forEach(log => {
    const diffMs = now - log.timestamp;
    const minuteBucket = Math.floor(diffMs / 60000);
    // If the log is within our target window (e.g., last 10 minutes)
    if (minuteBucket < minutes) {
      // result[0] is oldest, result[minutes-1] is current minute
      result[minutes - 1 - minuteBucket] += log.tokens;
    }
  });

  return result;
}
