import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sortLangs, formatBytes, percent, bar, langColor,
  formatText, formatJSON, formatMarkdown, parseArgs, HELP,
} from "../index.js";

describe("sortLangs", () => {
  it("sorts by bytes descending", () => {
    const sorted = sortLangs({ JavaScript: 1000, Python: 3000, Go: 2000 });
    assert.deepEqual(sorted, [["Python", 3000], ["Go", 2000], ["JavaScript", 1000]]);
  });
  it("returns empty for empty object", () => {
    assert.deepEqual(sortLangs({}), []);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => assert.equal(formatBytes(500), "500 B"));
  it("formats KB", () => assert.equal(formatBytes(2048), "2.0 KB"));
  it("formats MB", () => assert.equal(formatBytes(1048576), "1.0 MB"));
  it("formats GB", () => assert.equal(formatBytes(1073741824), "1.0 GB"));
});

describe("percent", () => {
  it("calculates percentage", () => assert.equal(percent(250, 1000), "25.0"));
  it("handles zero total", () => assert.equal(percent(5, 0), "0.0"));
  it("handles 100%", () => assert.equal(percent(1000, 1000), "100.0"));
});

describe("bar", () => {
  it("returns full bar for 100%", () => {
    const b = bar(100, 5);
    assert.equal(b, "█████");
  });
  it("returns empty bar for 0%", () => {
    const b = bar(0, 5);
    assert.equal(b, "░░░░░");
  });
  it("default width is 20", () => {
    const b = bar(0);
    assert.equal(b.length, 20);
  });
});

describe("langColor", () => {
  it("returns color for known language", () => {
    assert.ok(langColor("JavaScript").includes("["));
  });
  it("returns white for unknown", () => {
    assert.ok(langColor("Brainfuck").includes("["));
  });
});

describe("formatText", () => {
  it("includes repo count and language info", () => {
    const data = { total: { JavaScript: 1000, Python: 500 }, perRepo: [], repoCount: 10 };
    const out = formatText(data);
    assert.ok(out.includes("10 repos"));
    assert.ok(out.includes("JavaScript"));
    assert.ok(out.includes("Python"));
    assert.ok(out.includes("2 languages"));
  });
  it("respects --top option", () => {
    const data = { total: { JavaScript: 1000, Python: 500, Go: 200 }, perRepo: [], repoCount: 5 };
    const out = formatText(data, { top: 1 });
    assert.ok(out.includes("JavaScript"));
    assert.ok(!out.includes("Python"));
  });
});

describe("formatJSON", () => {
  it("produces valid JSON with expected fields", () => {
    const data = { total: { JavaScript: 3000 }, perRepo: [{ repo: "test", langs: { JavaScript: 3000 } }], repoCount: 1 };
    const raw = formatJSON(data);
    const obj = JSON.parse(raw);
    assert.equal(obj.repoCount, 1);
    assert.equal(obj.languages[0].language, "JavaScript");
    assert.equal(obj.languages[0].percentage, 100);
    assert.ok(obj.perRepo);
  });
  it("handles empty data", () => {
    const data = { total: {}, perRepo: [], repoCount: 0 };
    const obj = JSON.parse(formatJSON(data));
    assert.equal(obj.languages.length, 0);
  });
});

describe("formatMarkdown", () => {
  it("includes markdown table header", () => {
    const data = { total: { JavaScript: 1000 }, perRepo: [], repoCount: 5 };
    const out = formatMarkdown(data);
    assert.ok(out.includes("| Language |"));
    assert.ok(out.includes("JavaScript"));
  });
  it("includes per-repo breakdown when present", () => {
    const data = { total: { JavaScript: 1000 }, perRepo: [{ repo: "my-app", langs: { JavaScript: 1000 } }], repoCount: 1 };
    const out = formatMarkdown(data);
    assert.ok(out.includes("Per-repo"));
    assert.ok(out.includes("my-app"));
  });
});

describe("parseArgs", () => {
  it("defaults to text", () => {
    assert.equal(parseArgs(["node", "cli.js"]).format, "text");
  });
  it("parses --json", () => {
    assert.equal(parseArgs(["node", "cli.js", "--json"]).format, "json");
  });
  it("parses --markdown", () => {
    assert.equal(parseArgs(["node", "cli.js", "--markdown"]).format, "markdown");
  });
  it("parses --user", () => {
    assert.equal(parseArgs(["node", "cli.js", "--user", "octocat"]).user, "octocat");
  });
  it("parses --top", () => {
    assert.equal(parseArgs(["node", "cli.js", "--top", "5"]).top, 5);
  });
  it("parses --per-repo", () => {
    assert.equal(parseArgs(["node", "cli.js", "--per-repo"]).perRepo, true);
  });
  it("parses --help", () => {
    assert.equal(parseArgs(["node", "cli.js", "--help"]).help, true);
  });
  it("parses -h", () => {
    assert.equal(parseArgs(["node", "cli.js", "-h"]).help, true);
  });
});

describe("HELP", () => {
  it("contains usage info", () => {
    assert.ok(HELP.includes("gh-langs"));
    assert.ok(HELP.includes("--user"));
    assert.ok(HELP.includes("--json"));
  });
});
