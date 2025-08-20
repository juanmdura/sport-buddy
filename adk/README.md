# Python - Google ADK Integration

This directory contains the Python components for the Zubale ADK project, specifically for Google ADK integration and AI agents.

## 🐍 Python Components

### Google ADK Integration
- **Purpose**: Integration with Google's Agent Development Kit (ADK)
- **Features**: AI agents for enhancing sports events with intelligent descriptions
- **Model**: Gemini AI for generating summaries and finding related content

### Project Structure

```
python/
├── pyproject.toml          # Python project configuration
├── uv.lock                 # Python dependency lock file
├── .venv/                  # Python virtual environment
└── agents/                 # AI agent implementations
    ├── __init__.py
    ├── example/             # Example agent
    │   ├── __init__.py
    │   ├── agent.py         # Main agent implementation
    │   ├── prompt.py        # Agent prompts and templates
    │   ├── tools.py         # Agent tools and functions
    │   └── test_deployed_agent.py  # Tests for deployed agent
    └── stock_agent/         # Stock/finance related agent
        ├── __init__.py
        ├── agent.py
        ├── prompt.py
        └── tools.py
```

## 🚀 Setup & Usage

### 1. Activate Virtual Environment

```bash
# From the python/ directory
source .venv/bin/activate  # On macOS/Linux
# or
.venv\\Scripts\\activate   # On Windows
```

### 2. Install Dependencies

```bash
# Dependencies are managed by uv and defined in pyproject.toml
# They should already be installed in the virtual environment
pip install -e .
```

### 3. Run Example Agent

```bash
# From the python/ directory
python -m agents.example.agent

# Or from the project root
python python/agents/example/agent.py
```

### 4. Test Agent

```bash
# From the python/ directory
python -m agents.example.test_deployed_agent
```

## 🔧 Configuration

The Python components integrate with the JavaScript sports events system to:

1. **Enhance Event Descriptions**: Use Gemini AI to generate intelligent summaries
2. **Find Related Content**: Search for YouTube highlights and news articles
3. **Calendar Integration**: Add AI-enhanced descriptions to Google Calendar events
4. **Sports Analysis**: Provide insights about teams, players, and match history

## 📋 Dependencies

Key dependencies (from `pyproject.toml`):
- `google-adk` - Google Agent Development Kit
- `google-cloud-aiplatform[agent-engine]` - Google Cloud AI Platform with agent engine
- `opik` - Observability and monitoring for AI applications

## 🔗 Integration with JavaScript

The Python components are designed to work with the JavaScript sports events system:

1. **Data Flow**: JavaScript fetches sports events → Python enhances with AI → Results stored/displayed
2. **API Integration**: Python agents can be called from Node.js using child processes or HTTP APIs
3. **Shared Configuration**: Environment variables and configuration shared between both stacks

## 🎯 Future Requirements

This Python component will fulfill these project requirements:
- **Requirement 6**: Using Google ADK and Gemini AI to include intelligent descriptions
- **Calendar Integration**: Enhanced event descriptions for Google Calendar
- **Content Discovery**: AI-powered search for related videos and news

## 🔍 Example Usage

```python
# Example of how the Python agent might be used
from agents.example.agent import SportsAgent

agent = SportsAgent()
enhanced_description = agent.enhance_event_description(
    event_name="Liverpool vs Manchester United",
    teams=["Liverpool", "Manchester United"],
    date="2024-03-15"
)
print(enhanced_description)
```

## 📞 Running from Root

You can also run Python components from the project root:

```bash
# From project root
node index.js python
node index.js py --help
```
