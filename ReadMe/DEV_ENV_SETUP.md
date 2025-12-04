# 🚀 ConflixIQ Studio - Quick Start Commands

## Prerequisites
```bash
# Check Node.js version (need 20+)
node --version

# Check npm version (need 8+)
npm --version

# Check Git version (need 2.25+)
git --version

# Check Docker (optional but recommended)
docker --version
```

---

## 0. Clone & Setup Repository (First Time Only)

### Clone the Repository
```bash
# Clone the repository
git clone https://github.com/amishra213/ConflixIQStudio.git
cd ConflixIQStudio
```

### Configure Git (Recommended)
```bash
# Set your name and email for commits
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Optional: Set globally for all repositories
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Check out the Main Branch
```bash
# Ensure you're on the main branch
git checkout main

# Update to latest changes
git pull origin main

# Verify current branch
git branch
```

### Set up Tracking for Feature Branches (Optional)
```bash
# If working on a feature branch
git checkout feature/release-artifacts-and-docker-fix

# Or create a new feature branch
git checkout -b feature/your-feature-name
```

### Verify Git Setup
```bash
# Check remote configuration
git remote -v

# Check current branch
git status

# View recent commits
git log --oneline -5
```

---

## 1. Initial Setup (First Time Only)

```bash
# Install all dependencies
npm install

# Optional: Verify installation
npm list --depth=0
```

---

## 2. Environment File Setup

### Create Environment Files (Optional but Recommended)

Create a `.env.local` file in the root directory:
```bash
# Windows PowerShell
New-Item -Path ".\.env.local" -ItemType File

# Windows Command Prompt
type nul > .env.local

# Linux/Mac
touch .env.local
```

Add to `.env.local`:
```env
# Backend Configuration
VITE_CONDUCTOR_SERVER_URL=http://localhost:8080
LOG_LEVEL=INFO
PORT=4000
NODE_ENV=development

# Optional: Custom log file location
LOG_FILE_PATH=./logs
```

### Verify Environment
```bash
# Check that .env.local is created
dir .env.local           # Windows
ls -la .env.local        # Linux/Mac

# Verify npm can read environment
npm run server:dev       # Should use settings from .env.local
```

---

## 3. Running Locally

### Option A: Full Stack (Recommended for Development)
```bash
# Runs frontend (port 5173) + backend (port 4000) together
npm run dev:full
```
Access at: `http://localhost:5173`

### Option B: Frontend Only
```bash
npm run dev
```
Access at: `http://localhost:5173` (assumes backend running separately)

### Option C: Backend Only
```bash
npm run server:dev
```
Access at: `http://localhost:4000`

---

## 4. Build for Production

### Web UI Build
```bash
npm run build
```
Output: `dist/` folder with optimized React app

### Windows EXE (Portable)
```bash
npm run sea:build:windows
```
Output: Standalone .exe file (~60-80MB)

### Docker Image
```bash
npm run docker-build
```
Output: Docker image tagged as `conflixiq-studio:latest`

---

## 5. Environment Configuration

### Set Log Level (Optional)

**Windows Command Prompt:**
```cmd
set LOG_LEVEL=DEBUG
npm run server:dev
```

**Windows PowerShell:**
```powershell
$env:LOG_LEVEL = "DEBUG"
npm run server:dev
```

**Linux/Mac:**
```bash
export LOG_LEVEL=DEBUG
npm run server:dev
```

### Log Levels Available
- `DEBUG` - Detailed operational info
- `INFO` - Normal operations (default)
- `WARN` - Warning conditions
- `ERROR` - Error conditions

### Connect to Conductor Server

```bash
set VITE_CONDUCTOR_SERVER_URL=http://your-conductor-server:8080
npm run dev:full
```

---

## 6. Code Quality

```bash
# Format code with Prettier
npm run format

# Run ESLint
npm run lint

# TypeScript type checking
npm run type-check
```

---

## 7. Git Workflow for Development

### Create a Feature Branch

```bash
# Update main first
git checkout main
git pull origin main

# Create a new feature branch
git checkout -b feature/your-feature-name

# Example: feature names
git checkout -b feature/add-logging
git checkout -b feature/fix-docker-build
git checkout -b feature/update-ui-components
```

### Commit Your Changes

```bash
# Check what changed
git status

# Stage specific files
git add src/components/MyComponent.tsx

# Or stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: add new logging component"

# Verify commit
git log --oneline -3
```

### Commit Message Conventions

Use these prefixes for clarity:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Add/update tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: implement workflow graph visualization"
git commit -m "fix: resolve logging file rotation issue"
git commit -m "docs: update dev environment setup guide"
git commit -m "refactor: simplify task resolver logic"
```

### Push Your Changes

```bash
# Push to remote (first time on new branch)
git push -u origin feature/your-feature-name

# Subsequent pushes
git push origin feature/your-feature-name

# Or simply
git push
```

### Create a Pull Request

1. Push your branch to GitHub
2. Go to: `https://github.com/amishra213/ConflixIQStudio/pulls`
3. Click "New Pull Request"
4. Select your feature branch
5. Add description and submit

### Sync with Main Branch

If main has updated while you're working:

```bash
# Fetch latest changes
git fetch origin main

# Rebase your branch on main (preferred)
git rebase origin/main

# Or merge main into your branch
git merge origin/main
```

### Clean Up After Merge

```bash
# After PR is merged, delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name

# Clean up stale remote branches
git remote prune origin
```

### Useful Git Commands

```bash
# View current branch
git branch

# View all branches (including remote)
git branch -a

# View recent commits
git log --oneline -10

# View changes in current branch
git diff origin/main

# Undo uncommitted changes
git checkout -- src/file.tsx

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View branch history graph
git log --graph --oneline --all
```

---

## 📊 Common Development Tasks

| Task | Command |
|------|---------|
| **Run everything** | `npm run dev:full` |
| **Frontend dev** | `npm run dev` |
| **Backend dev** | `npm run server:dev` |
| **Format code** | `npm run format` |
| **Check types** | `npm run type-check` |
| **Lint errors** | `npm run lint` |
| **Build production** | `npm run build` |
| **Build Windows EXE** | `npm run sea:build:windows` |
| **Build Docker** | `npm run docker-build` |

---

## 🔍 Accessing the Application

After running `npm run dev:full`:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000
- **GraphQL**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/api/health

---

## 📁 Important Folders

```
src/
  ├── components/     # React components
  ├── pages/          # Page components
  ├── hooks/          # Custom React hooks
  ├── services/       # API services
  ├── stores/         # State management
  └── utils/          # Utility functions

logs/
  └── *.log           # Application logs (created at runtime)

dist/
  └── release/        # Build artifacts
```

---

## 🛠️ Troubleshooting

### Port Already in Use

**Port 5173 (Frontend):**
```bash
set PORT=5174
npm run dev
```

**Port 4000 (Backend):**
```bash
set PORT=5000
npm run server:dev
```

### Clear Dependencies Cache
```bash
rm -r node_modules
npm install
```

### Check Logs
```bash
# View today's logs
cat logs/conflixiq-studio-2025-12-04.log

# Follow logs in real-time
tail -f logs/conflixiq-studio-*.log
```

---

## 📝 Typical Development Workflow

```bash
# === INITIAL SETUP (First time only) ===
git clone https://github.com/amishra213/ConflixIQStudio.git
cd ConflixIQStudio
npm install

# === STARTING A NEW FEATURE ===
# 1. Update main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-awesome-feature

# === DEVELOPMENT CYCLE ===
# 3. Start development environment
npm run dev:full

# 4. Make code changes (auto-reload enabled)
# 5. Format code before committing
npm run format

# 6. Run quality checks
npm run lint && npm run type-check

# === COMMIT & PUSH ===
# 7. Stage and commit changes
git add .
git commit -m "feat: implement awesome feature"
git commit -m "fix: resolve edge case bug"

# 8. Push to remote
git push -u origin feature/my-awesome-feature

# === CREATE PULL REQUEST ===
# 9. Go to GitHub and create PR
# https://github.com/amishra213/ConflixIQStudio/pulls

# === AFTER MERGE ===
# 10. Clean up local branch
git checkout main
git pull origin main
git branch -d feature/my-awesome-feature
git push origin --delete feature/my-awesome-feature
```

---

## 🎯 Quick Reference Cheat Sheet

### Getting Started
```bash
# Clone and setup (first time only)
git clone https://github.com/amishra213/ConflixIQStudio.git
cd ConflixIQStudio
npm install

# ONE-LINER to get started
npm install && npm run dev:full
```

### Development
```bash
# Debug mode with detailed logging
set LOG_LEVEL=DEBUG && npm run dev:full

# Just the backend
npm run server:dev

# Just the frontend  
npm run dev

# Production build
npm run build

# Portable Windows EXE
npm run sea:build:windows

# Docker image
npm run docker-build

# Format & lint
npm run format && npm run lint

# Full quality check
npm run format && npm run lint && npm run type-check
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Check status
git status

# Stage and commit
git add .
git commit -m "feat: your changes"

# Push to remote
git push -u origin feature/my-feature

# Update from main
git fetch origin main
git rebase origin/main

# View branches
git branch -a

# View commits
git log --oneline -10

# Clean up after merge
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## 🚀 Ready to Go!

You're all set! Start with:

```bash
# Clone the repo
git clone https://github.com/amishra213/ConflixIQStudio.git
cd ConflixIQStudio

# Install dependencies
npm install

# Start development
npm run dev:full
```

Then open http://localhost:5173 in your browser. Happy coding! 🎉

---

## 🐛 Git Troubleshooting

### Accidentally Committed to Main?

```bash
# Create a feature branch from your commit
git branch feature/my-feature

# Reset main to before your commit
git reset --hard origin/main

# Switch to your feature branch and push
git checkout feature/my-feature
git push -u origin feature/my-feature
```

### Merge Conflicts

```bash
# When pulling/rebasing results in conflicts
git status  # See conflicting files

# Edit conflicting files manually
# Look for:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

# After fixing conflicts
git add conflicting-file.tsx
git rebase --continue

# Or abort if in doubt
git rebase --abort
```

### Need to Update Your Branch with Latest Main?

```bash
# Option 1: Rebase (linear history, preferred)
git fetch origin main
git rebase origin/main
git push -f origin feature/your-feature  # Note: -f flag needed after rebase

# Option 2: Merge (creates merge commit)
git fetch origin main
git merge origin/main
git push origin feature/your-feature
```

### Lost Commits?

```bash
# View all commits (including deleted branches)
git reflog

# Find your commit hash and restore it
git checkout <commit-hash>

# Or create a new branch from it
git checkout -b recovered-branch <commit-hash>
```

### Accidentally Deleted a Branch?

```bash
# Find the commit hash in reflog
git reflog

# Recreate the branch
git checkout -b recovered-branch <commit-hash>
```

---

## 📋 Pre-Commit Checklist

Before pushing your changes:

- [ ] All code formatted: `npm run format`
- [ ] No linting errors: `npm run lint`
- [ ] TypeScript types pass: `npm run type-check`
- [ ] Feature works locally: `npm run dev:full`
- [ ] Meaningful commit message: `git commit -m "feat/fix/docs: description"`
- [ ] Pushed to correct branch: `git push origin feature/your-feature`
- [ ] Created Pull Request on GitHub

---

## 📚 Additional Resources

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **Conventional Commits**: https://www.conventionalcommits.org
- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Conductor Documentation**: https://conductor.netflix.com
