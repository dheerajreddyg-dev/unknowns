# Development Automation Agent

An intelligent automation agent that streamlines the entire development workflow from PBI analysis to QA notification.

## 🎯 Features

- **Azure DevOps Integration**: Automatically fetches PBI requirements, DoR, DoD, and website information
- **GitHub Integration**: Manages branches, commits, pushes, and GitHub Actions deployments
- **Intelligent Code Implementation**: Guides developers through implementation with AI assistance
- **Automated Testing**: Runs unit tests and linting before deployment
- **Web Verification**: Uses Playwright to verify changes on dev/stage/prod environments
- **SSO Handling**: Automatically handles SSO authentication for protected sites
- **Screenshot Capture**: Takes comprehensive screenshots for QA documentation
- **Issue Detection & Auto-Fix**: Detects build failures and attempts automatic fixes
- **QA Email Automation**: Drafts and sends professional emails to QA with all evidence
- **Human-in-Loop**: Strategic checkpoints for human approval and decision-making

## 🏗️ Workflow

1. **Analyze PBI**: Fetches PBI from Azure DevOps, extracts requirements, creates todo list
2. **Setup Branch**: Pulls latest changes, creates feature branch (format: `feature/name-PBI12345`)
3. **Implement Changes**: Guides implementation with AI assistance and manual steps
4. **Test & Push**: Runs unit tests, linting, commits, and pushes to GitHub
5. **Deploy Dev**: Triggers GitHub Actions, monitors deployment, verifies on dev site
6. **Deploy Stage**: Merges to stage, deploys, verifies changes
7. **Notify QA**: Drafts email with subject "Femcare | PBI#" and sends with screenshots

## 📦 Installation

### Prerequisites

- Python 3.8+
- Node.js (if working with Node projects)
- Git

### Setup

1. **Clone or navigate to the project directory**

```powershell
cd "c:\Users\61095686\Desktop\AI BUILD\dev-automation-agent"
```

2. **Create virtual environment**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. **Install dependencies**

```powershell
pip install -r requirements.txt
```

4. **Install Playwright browsers**

```powershell
playwright install chromium
```

5. **Configure environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```powershell
cp .env.example .env
```

Edit `.env` file with your details:
- Azure DevOps PAT token
- GitHub token
- Email credentials
- Environment URLs
- SSO credentials (optional)

## 🚀 Usage

### Basic Usage

```powershell
python src/agent.py <PBI_ID>
```

Example:
```powershell
python src/agent.py 12345
```

### Interactive Mode

```powershell
python src/agent.py
# You'll be prompted for PBI ID and repository path
```

## 🔧 Configuration

### config.yaml

Customize workflow settings:
- Branch naming format
- Email subject format
- Human-in-loop approval points
- Verification settings
- Logging configuration

### .env

Configure credentials and URLs:
- `ADO_ORGANIZATION`: Your Azure DevOps organization
- `ADO_PROJECT`: Your project name
- `ADO_PAT`: Personal Access Token
- `GITHUB_TOKEN`: GitHub Personal Access Token
- `GITHUB_REPO_OWNER`: Repository owner
- `GITHUB_REPO_NAME`: Repository name
- `EMAIL_SENDER`: Your email address
- `EMAIL_PASSWORD`: Email password
- `QA_EMAIL`: QA team email
- `DEV_URL`, `STAGE_URL`, `PROD_URL`: Optional - will be prompted during execution if not set

## 📂 Project Structure

```
dev-automation-agent/
├── src/
│   ├── agent.py              # Main orchestrator
│   ├── ado_analyzer.py       # Azure DevOps integration
│   ├── github_manager.py     # GitHub operations
│   ├── code_implementor.py   # Code implementation guidance
│   ├── web_tester.py         # Web testing with Playwright
│   ├── issue_fixer.py        # Issue detection and fixing
│   ├── email_manager.py      # Email drafting and sending
│   ├── config.py             # Configuration loader
│   └── utils.py              # Utility functions
├── screenshots/              # Screenshots directory
├── logs/                     # Log files
├── requirements.txt          # Python dependencies
├── config.yaml              # Workflow configuration
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🎮 Human-in-Loop Points

The agent prompts for approval at key decision points:

1. **After PBI Analysis**: Review todo list before proceeding
2. **Before Implementation**: Confirm implementation approach
3. **Before Pushing**: Review changes before pushing to GitHub
4. **Before Stage Merge**: Confirm promotion to stage
5. **Before QA Email**: Review email before sending
6. **SSO Login**: Provide credentials when needed

## 🔍 Verification Process

For each environment (dev/stage), the agent:

1. Navigates to the URL
2. Handles SSO authentication if required
3. Takes initial screenshot
4. Verifies each requirement interactively
5. Captures screenshots for each verification
6. Logs any issues found
7. Takes final screenshot

## 📧 QA Email Format

Subject: `Femcare | PBI{number} - {title}`

Includes:
- Deployment status summary
- Verification results table
- Verified requirements checklist
- Issues found (if any)
- Screenshots attached
- Testing notes and next steps
- Links to PBI and deployment

## 🛠️ Troubleshooting

### Build Failures

The agent automatically:
- Analyzes error logs
- Attempts common fixes (dependency installation, linting)
- Guides manual fixes with suggestions
- Redeploys after fixes

### SSO Issues

If automatic SSO login fails:
- Agent prompts for manual login
- Waits for user to complete authentication
- Continues verification after login

### Missing Dependencies

Install specific dependencies:

```powershell
# For Azure DevOps
pip install azure-devops

# For GitHub
pip install PyGithub gitpython

# For web testing
pip install playwright
playwright install
```

## 🔐 Security Notes

- Store credentials in `.env` file (never commit to git)
- Use Personal Access Tokens with minimum required permissions
- Review email drafts before sending
- Keep logs secure as they may contain sensitive information

## 📝 Customization

### Adding Custom Checks

Edit `web_tester.py` to add custom verification logic:

```python
def custom_check(self, page):
    # Your custom check logic
    pass
```

### Custom Email Template

Modify the email template in `email_manager.py`:

```python
body_template = """
<!-- Your custom HTML template -->
"""
```

### Workflow Modifications

Adjust workflow steps in `agent.py` by modifying or adding steps in the `run()` method.

## 🤝 Contributing

This is a POC project. Feel free to:
- Report issues
- Suggest improvements
- Add features
- Improve documentation

## 📄 License

Internal use only.

## 🙏 Acknowledgments

- Azure DevOps API
- GitHub API
- Playwright for browser automation
- Rich for beautiful terminal output

## 📞 Support

For issues or questions, contact the development team.

---

**Happy Automating! 🚀**
