# Contributing to PipelineLM Pro

Thank you for your interest in contributing! This document will help you get started.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/yourusername/pipelinelm-pro/issues) to see if the problem has already been reported.

When creating a bug report, please include as many details as possible using our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Features

Feature requests are welcome! Please use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and describe:
- The use case
- The proposed solution
- Any alternatives you've considered

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes by loading the extension in developer mode
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Chrome 114+ or Brave Browser
- Node.js 18+ (for linting)
- Git

### Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/pipelinelm-pro.git
cd pipelinelm-pro

# Install dev dependencies (optional, for linting)
npm install

# Load the extension
# 1. Open Chrome/Brave → brave://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the `src/` folder
```

### Project Structure

```
src/
  manifest.json              # Extension manifest
  background/sw.js           # Service worker
  content/content.js         # Main content script (injection logic)
  content/content.css        # Injected styles
  sidepanel/                 # Side panel (Dashboard, Vault, Pipeline, etc.)
  shared/                    # Constants, utils, AI analyzer, studio config
  icons/                     # Extension icons
  _locales/                  # Localization files
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Use camelCase for variables and functions
- Use PascalCase for constructors/classes
- Comment complex logic, not obvious code
- Keep functions under 50 lines when possible

### Testing

Currently, testing is manual:

1. Load the extension in developer mode
2. Navigate to [notebooklm.google.com](https://notebooklm.google.com)
3. Test each feature you modified
4. Test in both light and dark modes
5. Verify keyboard shortcuts work

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new studio item type
fix: resolve dark mode toggle bug
docs: update installation instructions
refactor: simplify source scraper
style: fix indentation in content.css
test: add test for duplicate finder
chore: update dependencies
```

## Release Process

1. Update version in `src/manifest.json`
2. Update `CHANGELOG.md`
3. Create a release branch
4. Tag the release (`git tag v3.0.0`)
5. Push tags (`git push origin v3.0.0`)
6. GitHub Actions will create the release automatically

## Questions?

Join our [Discussions](https://github.com/yourusername/pipelinelm-pro/discussions) page or open an issue.
