# sports-buddy - Multi-Language Sports Events System

This repository contains a comprehensive sports events management system with both **JavaScript (Node.js)** and **Python** components, integrating AI capabilities through Google's ADK.

## 🏗️ Project Structure

```
sports-buddy/
├── index.js                    # Main entry point (delegates to App or ADK)
├── requirements.txt            # Project requirements specification
├── README.md                   # This file
├── env.example                 # Environment variables template
├── app/                        # Node.js/JavaScript application
│   ├── index.js               # App entry point
│   ├── package.json           # Node.js dependencies
│   ├── src/                   # Source code
│   │   ├── services/          # API services (TheSportsDB)
│   │   ├── cli/               # Command line interface
│   │   └── web/               # Web-related components
│   │       ├── server/        # Express web server
│   │       └── public/        # Frontend assets (HTML, CSS, JS)
│   └── sports-system-README.md # App-specific documentation
└── adk/                        # Python Google ADK components
    ├── pyproject.toml         # Python project configuration
    ├── agents/                # AI agents for event enhancement
    ├── .venv/                 # Python virtual environment
    └── README.md              # ADK-specific documentation
```

## 🎯 Features

### App (Node.js/JavaScript) Components
- **Sports Events API Integration** with TheSportsDB
- **Modern Web Dashboard** with responsive UI
- **REST API Server** with Express.js
- **CLI Interface** for testing and automation
- **Real-time Data Fetching** for multiple sports and leagues

### ADK (Python) Components  
- **Google ADK Integration** for AI agent development
- **Gemini AI Model** for intelligent event descriptions
- **AI-Enhanced Content Discovery** (YouTube highlights, news)
- **Google Calendar Integration** with smart descriptions

## 🚀 Quick Start

### Option 1: Use Main Entry Point

```bash
# Show available options
node index.js --help

# Run App web server
node index.js app --web

# Run App CLI
node index.js app --cli

# Run ADK components
node index.js adk
```

### Option 2: Run Components Directly

**App Components:**
```bash
cd app
npm install
npm start          # Web server at http://localhost:3000
npm run cli        # CLI mode
npm run dev        # Development mode with auto-restart
```

**ADK Components:**
```bash
cd adk
source .venv/bin/activate  # Activate virtual environment
python -m agents.example.agent
```

## 📋 Requirements Implementation

This system implements the following requirements:

1. ✅ **Node.js API System** - Reads sports events from TheSportsDB API
2. ✅ **Web Interface** - Beautiful dashboard displaying events
3. ✅ **User Sport Selection** - Interactive sport and league selection
4. 🚧 **PostgreSQL Database** - Store events (coming next)
5. 🚧 **Google Calendar Integration** - Add selected events to calendar
6. 🚧 **AI-Enhanced Descriptions** - Google ADK + Gemini for intelligent summaries

## 🌐 Web Dashboard

The App web interface provides:
- **Interactive Sport Selection** (Soccer, Basketball, etc.)
- **Dynamic League Loading** based on selected sport
- **Event Cards** with match details, scores, venues
- **Statistics Dashboard** showing event counts
- **Responsive Design** for desktop and mobile
- **Real-time API Integration** with loading states

Access at: http://localhost:3000

## 🤖 AI Integration

The ADK components use Google ADK to:
- Generate intelligent event descriptions using Gemini AI
- Find related YouTube highlights and news articles
- Enhance calendar events with contextual information
- Provide insights about teams, players, and match history

## 🔧 Configuration

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Set required variables:**
   - Google Cloud credentials for ADK
   - API keys for external services
   - Database connection strings

## 🧪 Testing

**App Tests:**
```bash
cd app
npm test
```

**ADK Tests:**
```bash
cd adk
python -m agents.example.test_deployed_agent
```

## 📊 API Endpoints

**App REST API:**
- `GET /` - Web dashboard
- `GET /api/leagues/:sport` - Get leagues for a sport
- `GET /api/events/league/:leagueId` - Get events for a league
- `GET /api/events/team/:teamName` - Get upcoming events for a team
- `GET /health` - Health check

## 🛠️ Development

### Technology Stack Separation

This project maintains a clear separation between:
- **App (Node.js)**: Web interface, API server, real-time data fetching
- **ADK (Python)**: AI agents, Google ADK integration, machine learning capabilities

### Adding New Features

**App (Node.js):**
- Add API services in `app/src/services/`
- Add server routes in `app/src/web/server/`
- Add CLI commands in `app/src/cli/`

**ADK (Python):**
- Add new agents in `adk/agents/`
- Extend AI capabilities in agent modules
- Add integration tests

### Dependencies

**App:** Express.js, Axios, modern ES6+
**ADK:** Google ADK, Google Cloud AI Platform, Opik

### Python Setup (Google ADK)

1. **Install UV Python Manager:**
   ```bash
   # On macOS and Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # On Windows
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

2. **Install ADK Dependencies:**
   ```bash
   cd adk
   uv sync
   ```

3. **Run ADK Web Interface:**
   ```bash
   cd adk
   uv run adk web
   ```

## 🔗 Integration Between Components

The App and ADK components are designed to work together:

1. **Data Flow**: App fetches sports events → ADK enhances with AI → Results stored/displayed
2. **API Integration**: ADK agents can be called from Node.js using child processes or HTTP APIs
3. **Shared Configuration**: Environment variables and configuration shared between both stacks

## 📚 Documentation

- **App Components**: See `app/sports-system-README.md`
- **ADK Components**: See `adk/README.md`
- **Google ADK Official Docs**: [https://google.github.io/adk-docs/](https://google.github.io/adk-docs/)
- **ADK Samples**: [https://github.com/google/adk-samples](https://github.com/google/adk-samples)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Choose the appropriate technology stack (JS or Python)
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

## 📄 License

[License information]