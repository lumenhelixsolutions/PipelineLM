{
  "name": "pipelinelm-pro",
  "version": "3.0.0",
  "description": "The Ultimate NotebookLM Power-User Suite - Generate, organize, sync, and study with 9 studio item types",
  "main": "src/manifest.json",
  "scripts": {
    "lint": "eslint src/**/*.js --fix",
    "lint:check": "eslint src/**/*.js",
    "validate:manifest": "node scripts/validate-manifest.js",
    "validate:refs": "node scripts/validate-refs.js",
    "build": "node scripts/build.js",
    "build:zip": "npm run build && cd dist && zip -r ../pipelinelm-pro-v$npm_package_version.zip .",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "clean": "rm -rf dist/",
    "dev": "npm run build && echo 'Load dist/ as unpacked extension'"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/pipelinelm-pro.git"
  },
  "keywords": [
    "notebooklm",
    "google",
    "ai",
    "productivity",
    "browser-extension",
    "chrome-extension",
    "productivity-tools",
    "research",
    "study-tools",
    "flashcards",
    "quizzes",
    "mind-maps",
    "note-taking",
    "knowledge-management"
  ],
  "author": "PipelineLM Pro Contributors",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/yourusername/pipelinelm-pro/issues"
  },
  "homepage": "https://github.com/yourusername/pipelinelm-pro#readme",
  "devDependencies": {
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
