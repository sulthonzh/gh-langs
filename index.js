#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");

function ghAvailable() {
  try { execSync("gh --version", { stdio: "pipe" }); return true; } catch { return false; }
}

function fetchRepos(user) {
  const raw = execSync(
    `gh api users/${user}/repos --paginate --jq '.[] | select(.fork == false) | .name'`,
    { stdio: ["pipe", "pipe", "pipe"] }
  ).toString().trim();
  if (!raw) return [];
  return raw.split("\n").map(n => n.trim()).filter(Boolean);
}

function fetchLangs(user, repo) {
  try {
    const raw = execSync(
      `gh api repos/${user}/${repo}/languages`,
      { stdio: ["pipe", "pipe", "pipe"] }
    ).toString().trim();
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function collectAll(user) {
  const repos = fetchRepos(user);
  const total = {};
  const perRepo = [];
  for (const repo of repos) {
    const langs = fetchLangs(user, repo);
    if (Object.keys(langs).length === 0) continue;
    perRepo.push({ repo, langs });
    for (const [lang, bytes] of Object.entries(langs)) {
      total[lang] = (total[lang] || 0) + bytes;
    }
  }
  return { total, perRepo, repoCount: repos.length };
}

function sortLangs(total) {
  return Object.entries(total).sort((a, b) => b[1] - a[1]);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function percent(part, whole) {
  if (whole === 0) return "0.0";
  return ((part / whole) * 100).toFixed(1);
}

const LANG_COLORS = {
  JavaScript: "\x1b[33m", TypeScript: "\x1b[36m", Python: "\x1b[32m",
  Go: "\x1b[34m", Rust: "\x1b[31m", Java: "\x1b[33m", "C++": "\x1b[35m",
  C: "\x1b[36m", Ruby: "\x1b[31m", PHP: "\x1b[35m", Swift: "\x1b[33m",
  Kotlin: "\x1b[35m", Shell: "\x1b[32m", HTML: "\x1b[31m", CSS: "\x1b[36m",
  Vue: "\x1b[32m", Dart: "\x1b[36m", Scala: "\x1b[31m",
};
const RESET = "\x1b[0m";

function langColor(lang) {
  return LANG_COLORS[lang] || "\x1b[37m";
}

function bar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function formatText(data, opts = {}) {
  const { total, repoCount } = data;
  const sorted = sortLangs(total);
  const totalBytes = sorted.reduce((s, [, b]) => s + b, 0);
  const top = opts.top ? Math.min(opts.top, sorted.length) : sorted.length;

  let out = `Languages across ${repoCount} repos\n`;
  out += "─".repeat(50) + "\n\n";

  for (let i = 0; i < top; i++) {
    const [lang, bytes] = sorted[i];
    const pct = parseFloat(percent(bytes, totalBytes));
    const color = langColor(lang);
    out += `${color}${lang.padEnd(14)}${RESET} ${bar(pct)} ${pct.toFixed(1).padStart(5)}%  ${formatBytes(bytes)}\n`;
  }

  out += `\n  ${sorted.length} languages, ${formatBytes(totalBytes)} total\n`;
  return out;
}

function formatJSON(data) {
  const { total, perRepo, repoCount } = data;
  const sorted = sortLangs(total);
  const totalBytes = sorted.reduce((s, [, b]) => s + b, 0);
  const languages = sorted.map(([lang, bytes]) => ({
    language: lang,
    bytes,
    percentage: parseFloat(percent(bytes, totalBytes)),
    formatted: formatBytes(bytes),
  }));
  return JSON.stringify({ repoCount, totalBytes: formatBytes(totalBytes), languages, perRepo }, null, 2);
}

function formatMarkdown(data) {
  const { total, perRepo, repoCount } = data;
  const sorted = sortLangs(total);
  const totalBytes = sorted.reduce((s, [, b]) => s + b, 0);

  let out = `## Languages across ${repoCount} repos\n\n`;
  out += "| Language | Size | % |\n|---|---|---|\n";
  for (const [lang, bytes] of sorted) {
    out += `| ${lang} | ${formatBytes(bytes)} | ${percent(bytes, totalBytes)}% |\n`;
  }

  if (perRepo.length > 0) {
    out += "\n### Per-repo breakdown\n\n";
    for (const { repo, langs } of perRepo.slice(0, 20)) {
      const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 3);
      out += `- **${repo}**: ${top.map(([l, b]) => `${l} (${percent(b, Object.values(langs).reduce((s, v) => s + v, 0))}%)`).join(", ")}\n`;
    }
  }
  return out;
}

const HELP = `
gh-langs — See language breakdown across all your GitHub repos

Usage:
  gh-langs [options]

Options:
  --user <handle>    Target GitHub user (default: authenticated user)
  --json             Output as JSON
  --markdown         Output as Markdown
  --top <n>          Show top N languages (default: all)
  --per-repo         Show per-repo breakdown in text mode
  --help             Show this help

Examples:
  gh-langs                        # your languages
  gh-langs --user torvalds        # someone else's
  gh-langs --json --top 5         # top 5 as JSON
  gh-langs --markdown             # for READMEs

Requires: gh CLI (https://cli.github.com)
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { format: "text", user: null, top: null, perRepo: false, help: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--json": opts.format = "json"; break;
      case "--markdown": opts.format = "markdown"; break;
      case "--user": opts.user = args[++i]; break;
      case "--top": opts.top = parseInt(args[++i], 10); break;
      case "--per-repo": opts.perRepo = true; break;
      case "--help": case "-h": opts.help = true; break;
    }
  }
  return opts;
}

module.exports = {
  ghAvailable, fetchRepos, fetchLangs, collectAll, sortLangs,
  formatBytes, percent, bar, langColor, formatText, formatJSON,
  formatMarkdown, parseArgs, HELP,
};
