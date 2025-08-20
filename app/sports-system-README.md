# Sports Events System

A comprehensive Node.js application that reads sports events from TheSportsDB API and displays them in a beautiful web interface.

## ✅ Completed Requirements

- **Requirement 1**: ✅ Node.js system that reads sport events from an API
- **Requirement 3**: ✅ Display the events in a web page

## Features

### 🏆 Core Functionality
- ✅ Fetches sports events from TheSportsDB API
- ✅ Supports multiple sports (Soccer, Basketball, etc.)
- ✅ Gets league information and events
- ✅ Formats and displays event data
- ✅ Error handling and timeout configuration
- ✅ Free API (no key required for basic usage)

### 🌐 Web Interface
- ✅ Beautiful, responsive web dashboard
- ✅ Modern UI with gradient backgrounds and animations
- ✅ Interactive sport and league selection
- ✅ Real-time event loading with loading indicators
- ✅ Grid and list view toggles
- ✅ Event statistics and cards
- ✅ Mobile-responsive design
- ✅ Professional error handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the web server:
```bash
npm start
# or
npm run web
```

3. Open your browser and go to:
```
http://localhost:3000
```

4. For development with auto-restart:
```bash
npm run dev
```

5. To run CLI version (original functionality):
```bash
npm run cli
```

## API Usage

The system uses TheSportsDB API which provides:
- **Free tier**: No API key required (uses test key '3')
- **Sports coverage**: Soccer, Basketball, American Football, Hockey, etc.
- **Data types**: Leagues, teams, events, scores

### Web Interface Features

The web dashboard provides:
1. **Sport Selection** - Choose from Soccer, Basketball, American Football, Baseball, etc.
2. **League Browser** - Dynamically loads leagues for selected sport
3. **Event Display** - Beautiful cards showing match details, scores, venues
4. **Statistics** - Total events, completed matches, upcoming games
5. **View Options** - Switch between grid and list views
6. **Responsive Design** - Works on desktop, tablet, and mobile

### API Endpoints

- `GET /` - Web dashboard
- `GET /api/leagues/:sport` - Get leagues for a sport
- `GET /api/events/league/:leagueId` - Get events for a league
- `GET /api/events/team/:teamName` - Get upcoming events for a team

## Sample Output

```
🏆 Sports Events System Starting...

📋 Fetching Soccer leagues...
Found 37 Soccer leagues:
  - English Premier League (ID: 4328)
  - German Bundesliga (ID: 4331)
  - Spanish La Liga (ID: 4335)
  - Italian Serie A (ID: 4332)
  - French Ligue 1 (ID: 4334)

⚽ Fetching English Premier League events...
Found 380 events:
  📅 2024-01-13 - Arsenal vs Crystal Palace
     📍 Venue: Emirates Stadium
     ⚽ Score: 5 - 0

  📅 2024-01-14 - Brighton vs Everton
     📍 Venue: Amex Stadium
     ⚽ Score: 4 - 2
```

## Project Structure

The codebase is organized by responsibility into clean, modular folders:

```
sports-buddy/
├── index.js                    # Main entry point
├── package.json                # Project configuration
├── src/                        # Source code
│   ├── cli/                    # Command line interface
│   │   └── index.js            # CLI application logic
│   ├── server/                 # Web server
│   │   └── server.js           # Express server and routes
│   └── services/               # External services & APIs
│       └── sports-api.js       # TheSportsDB API client
└── public/                     # Frontend assets
    ├── index.html              # Web dashboard
    ├── style.css               # Styling
    └── script.js               # Frontend JavaScript
```

### Responsibilities by Folder:

- **`src/services/`** - External API integrations and data fetching
- **`src/server/`** - HTTP server, routes, and web interface handling  
- **`src/cli/`** - Command line interface and application logic
- **`public/`** - Frontend assets (HTML, CSS, JavaScript)
- **Root** - Entry points and configuration files

## Code Structure

- Clean separation of concerns with dedicated modules
- `SportsEventsAPI` class handles all external API interactions
- `SportsEventsServer` class manages Express server and HTTP routes
- Error handling with try-catch blocks throughout
- Configurable timeouts and base URLs
- Formatted output for easy reading
- Modular design for easy extension and testing

## Next Steps

This fulfills requirement 1. The system can be extended for:
- Requirement 2: Store events in PostgreSQL database
- Requirement 3: Display events in a web page
- Requirement 4: User sport type selection
- Requirement 5: Google Calendar integration
- Requirement 6: AI-powered event descriptions
