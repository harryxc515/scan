const config = require("../config");

/**
 * determine verdict string from malicious count
 */
function verdict(malicious, suspicious, total) {
  if (malicious >= 5) return "malicious";
  if (malicious >= 1 || suspicious >= 3) return "suspicious";
  if (total > 0) return "clean";
  return "unknown";
}

/**
 * get verdict indicator (text label, no emoji)
 */
function verdictLabel(v) {
  switch (v) {
    case "malicious":  return "[MALICIOUS]";
    case "suspicious": return "[SUSPICIOUS]";
    case "clean":      return "[CLEAN]";
    default:           return "[UNKNOWN]";
  }
}

/**
 * format a stats object from virustotal stats
 */
function parseStats(attrs) {
  const stats = attrs.stats || attrs.last_analysis_stats || {};
  const malicious  = stats.malicious  || 0;
  const suspicious = stats.suspicious || 0;
  const harmless   = stats.harmless   || 0;
  const undetected = stats.undetected || 0;
  const total = malicious + suspicious + harmless + undetected;
  const v = verdict(malicious, suspicious, total);
  return { malicious, suspicious, harmless, undetected, total, verdict: v };
}

/**
 * build a scan result message string (no emojis, unicode only)
 */
function buildResultMessage(type, input, stats, guiLink) {
  const label = verdictLabel(stats.verdict);
  const lines = [
    `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
    `\u25b6 virustotal scan result`,
    `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
    `\u25aa type    : ${type.toUpperCase()}`,
    `\u25aa input   : ${truncate(input, 60)}`,
    `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
    `\u25aa verdict : ${label}`,
    `\u25aa malicious  : ${stats.malicious}`,
    `\u25aa suspicious : ${stats.suspicious}`,
    `\u25aa harmless   : ${stats.harmless}`,
    `\u25aa undetected : ${stats.undetected}`,
    `\u25aa total      : ${stats.total} engines`,
    `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
  ];

  if (guiLink) {
    lines.push(`\u25aa report : ${guiLink}`);
    lines.push(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  }

  return lines.join("\n");
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

/**
 * build a history list message
 */
function buildHistoryMessage(scans) {
  if (!scans || scans.length === 0) {
    return "no scan history found. send a url, file, ip, domain or hash to scan.";
  }

  const lines = [
    `\u2500\u2500 scan history (last ${scans.length}) \u2500\u2500`,
  ];

  scans.forEach((s, i) => {
    const v = s.result ? verdictLabel(s.result.verdict) : "[pending]";
    lines.push(`${i + 1}. [${s.type.toUpperCase()}] ${truncate(s.input, 40)} - ${v}`);
  });

  return lines.join("\n");
}

module.exports = { parseStats, buildResultMessage, buildHistoryMessage, verdict };
