# gh-langs

See the language breakdown across all your GitHub repos, right in the terminal.

Why? Because `gh` doesn't give you this. GitHub's language stats are per-repo only — this aggregates everything so you can see what you actually write in.

## Install

```bash
npm install -g gh-langs
```

Requires [gh CLI](https://cli.github.com) (uses your existing auth, no tokens needed).

## Usage

```bash
# your languages
gh-langs

# someone else's
gh-langs --user torvalds

# top 5 languages as JSON
gh-langs --json --top 5

# markdown table (great for READMEs)
gh-langs --markdown
```

## What it does

- Fetches all non-fork repos for a user
- Gets the language stats for each repo via GitHub API
- Aggregates into a global breakdown with byte sizes and percentages
- Shows a visual bar chart in text mode

## Output

**Text** (default):
```
Languages across 42 repos
──────────────────────────────────────────────────

JavaScript     ████████████████░░░░  78.3%  12.4 MB
TypeScript     ████░░░░░░░░░░░░░░░░  12.1%  1.9 MB
Python         ██░░░░░░░░░░░░░░░░░░   5.4%  856.3 KB
Shell          ░░░░░░░░░░░░░░░░░░░░   2.1%  336.0 KB
HTML           ░░░░░░░░░░░░░░░░░░░░   1.8%  288.0 KB

  5 languages, 15.9 MB total
```

**JSON**: full data with per-repo breakdown, percentages, formatted sizes.

**Markdown**: table + optional per-repo breakdown.

## Options

| Flag | Description |
|------|-------------|
| `--user <handle>` | Target GitHub user (default: you) |
| `--json` | Output as JSON |
| `--markdown` | Output as Markdown |
| `--top <n>` | Show top N languages |
| `--per-repo` | Show per-repo breakdown in text |
| `--help` | Show help |

## License

MIT
