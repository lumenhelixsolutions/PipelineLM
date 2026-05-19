# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.0.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Security Design

PipelineLM Pro is designed with security and privacy as core principles:

- **All processing is client-side** - No data leaves your browser
- **No external API calls** - Zero network requests to third-party servers
- **No data collection** - We don't track, log, or transmit any usage data
- **Minimal permissions** - Only requests what's absolutely needed
- **Open source** - Full transparency, every line is auditable

## Permissions Used

| Permission | Purpose |
|-----------|---------|
| `storage` | Persist settings, folders, prompts locally |
| `downloads` | Save exported files (PDF, Markdown, etc.) |
| `activeTab` | Interact with the current NotebookLM tab |
| `sidePanel` | Open the PipelineLM side panel |
| `alarms` | Background polling for pipeline status |
| `contextMenus` | Right-click "Send to NotebookLM" menu |
| `scripting` | Inject content scripts into NotebookLM |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, email us at: **security@pipelinelm.pro** (placeholder)

We will:
- Acknowledge receipt within 48 hours
- Provide a timeline for a fix within 7 days
- Credit you in the release notes (if you wish)
- Not disclose details until a fix is released

## Past Security Advisories

None at this time.
