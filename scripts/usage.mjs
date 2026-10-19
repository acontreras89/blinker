#!/usr/bin/env node
// Builds docs/WORKLOG.md from docs/worklog.csv plus the local Claude Code
// transcripts (~/.claude/projects/<cwd-slug>/<session>.jsonl and subagent
// transcripts under <session>/). Zero dependencies.
//
// Attribution: an assistant message is counted in a CSV row when it belongs to
// that row's Claude session and its timestamp falls inside the row's window.
// Messages outside every window are reported as "unattributed".
// Transcripts repeat one API message per content block, so usage is
// deduplicated by message id.
//
// Usage: node scripts/usage.mjs            (writes docs/WORKLOG.md)
//        node scripts/usage.mjs --stdout   (prints instead)

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = join(ROOT, "docs/worklog.csv");
const OUT = join(ROOT, "docs/WORKLOG.md");
const PROJECT_DIR =
  process.env.CLAUDE_TRANSCRIPTS_DIR ??
  join(homedir(), ".claude/projects", ROOT.replace(/[^a-zA-Z0-9]/g, "-"));

// USD per million tokens, fixed for the whole assignment.
// Source: claude-api skill model table, cached 2026-10-06. Cache writes are
// 1.25x input (5m TTL) and 2x input (1h TTL); cache reads vary per model.
const PRICES = {
  "claude-opus-5-5": { in: 4, out: 20, w5m: 5, w1h: 8, read: 0.2 },
  "claude-sonnet-5-5": { in: 2, out: 10, w5m: 2.5, w1h: 4, read: 0.2 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, w5m: 0.125, w1h: 0.2, read: 0.01 },
  "claude-fable-5-1": { in: 10, out: 50, w5m: 12.5, w1h: 20, read: 0.25 },
};

// ---------- worklog rows ----------

const [header, ...lines] = readFileSync(CSV, "utf8").trim().split("\n");
const cols = header.split(",");
const rows = lines
  .filter((l) => l.trim())
  .map((l) => {
    const cells = l.split(",");
    const r = Object.fromEntries(
      cols.map((c, i) => [c, (cells[i] ?? "").trim()]),
    );
    r.from = new Date(`${r.date}T${r.start}`);
    r.to = r.end ? new Date(`${r.date}T${r.end}`) : new Date(); // open row = still running
    r.usage = emptyUsage();
    return r;
  });

// ---------- transcripts ----------

function emptyUsage() {
  return {
    messages: 0,
    input: 0,
    output: 0,
    cacheWrite: 0,
    cacheRead: 0,
    cost: 0,
  };
}

function add(a, b) {
  for (const k of Object.keys(a)) a[k] += b[k];
}

function jsonlFiles(session) {
  const files = [join(PROJECT_DIR, `${session}.jsonl`)];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".jsonl")) files.push(p);
    }
  };
  walk(join(PROJECT_DIR, session));
  return files.filter(existsSync);
}

const unpriced = new Set();
function usageOf(model, u) {
  const p = PRICES[model];
  if (!p) unpriced.add(model);
  const w1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const w5m = (u.cache_creation_input_tokens ?? 0) - w1h;
  const x = {
    messages: 1,
    input: u.input_tokens ?? 0,
    output: u.output_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cost: 0,
  };
  if (p) {
    x.cost =
      (x.input * p.in +
        x.output * p.out +
        w5m * p.w5m +
        w1h * p.w1h +
        x.cacheRead * p.read) /
      1e6;
  }
  return x;
}

const sessions = [
  ...new Set(rows.map((r) => r.claude_session).filter(Boolean)),
];
const unattributed = {};

for (const session of sessions) {
  const seen = new Set();
  for (const file of jsonlFiles(session)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (!line.includes('"usage"')) continue;
      let e;
      try {
        e = JSON.parse(line);
      } catch {
        continue;
      }
      const m = e.message;
      if (e.type !== "assistant" || !m?.usage || !m.id || seen.has(m.id))
        continue;
      seen.add(m.id);
      const u = usageOf(m.model, m.usage);
      const t = new Date(e.timestamp);
      const row = rows.find(
        (r) => r.claude_session === session && t >= r.from && t <= r.to,
      );
      if (row) add(row.usage, u);
      else add((unattributed[session] ??= emptyUsage()), u);
    }
  }
}

// ---------- aggregation ----------

// Human time is the union of row windows, so parallel sessions don't double count.
function minutes(rs) {
  const iv = rs
    .map((r) => [r.from.getTime(), r.to.getTime()])
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [s, e] = [null, null];
  for (const [a, b] of iv) {
    if (e === null || a > e) {
      if (e !== null) total += e - s;
      [s, e] = [a, b];
    } else e = Math.max(e, b);
  }
  if (e !== null) total += e - s;
  return Math.round(total / 60000);
}

function groupBy(key) {
  const g = new Map();
  for (const r of rows) {
    const k = typeof key === "function" ? key(r) : r[key];
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(r);
  }
  return [...g].map(([k, rs]) => {
    const u = emptyUsage();
    rs.forEach((r) => add(u, r.usage));
    const claude = new Set(rs.map((r) => r.claude_session).filter(Boolean))
      .size;
    return { k, min: minutes(rs), claude, ...u };
  });
}

const fmtMin = (m) =>
  `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
const fmtTok = (n) =>
  n >= 1e6
    ? `${(n / 1e6).toFixed(2)}M`
    : n >= 1e3
      ? `${(n / 1e3).toFixed(1)}k`
      : `${n}`;
const fmtUsd = (n) => `$${n.toFixed(2)}`;

function table(title, keyName, groups) {
  const out = [
    `## ${title}`,
    "",
    `| ${keyName} | Time | Claude sessions | Messages | Input | Output | Cache write | Cache read | Est. cost |`,
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const g of groups) {
    out.push(
      `| ${g.k} | ${fmtMin(g.min)} | ${g.claude} | ${g.messages} | ${fmtTok(g.input)} | ${fmtTok(g.output)} | ${fmtTok(g.cacheWrite)} | ${fmtTok(g.cacheRead)} | ${fmtUsd(g.cost)} |`,
    );
  }
  return out.join("\n");
}

const md = [
  "# Worklog",
  "",
  "> Generated by `node scripts/usage.mjs` from [`worklog.csv`](worklog.csv) and the local Claude Code transcripts. Do not edit by hand.",
  "> Cost is an estimate at Claude API list prices (see `PRICES` in the script); the work actually ran on a subscription.",
  "",
  table(
    "Total",
    "Scope",
    groupBy(() => "All"),
  ),
  "",
  table("By epic", "Epic", groupBy("epic")),
  "",
  table("By task", "Task", groupBy("task")),
  "",
  table(
    "By work block",
    "Block",
    groupBy((r) => `${r.block} (${r.date})`),
  ),
  "",
  table(
    "By Claude session",
    "Session",
    groupBy((r) => (r.claude_session || "—").slice(0, 8)),
  ),
];

const unattr = Object.entries(unattributed);
if (unattr.length) {
  md.push(
    "",
    "## Unattributed",
    "",
    "Messages outside every row window (widen the row or add one):",
    "",
  );
  for (const [s, u] of unattr)
    md.push(
      `- \`${s.slice(0, 8)}\`: ${u.messages} messages, ${fmtUsd(u.cost)}`,
    );
}
if (unpriced.size)
  md.push("", `Unpriced models (counted at $0): ${[...unpriced].join(", ")}`);

const text = md.join("\n") + "\n";
if (process.argv.includes("--stdout")) process.stdout.write(text);
else writeFileSync(OUT, text);
