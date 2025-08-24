const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const SportsEventsAPI = require('../../services/sports-api');

/**
 * Express Web Server Setup
 * Handles all HTTP routes and serves the web interface
 */
class SportsEventsServer {
    constructor(port = 3000) {
        this.app = express();
        this.port = port;
        this.sportsAPI = new SportsEventsAPI();
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Serve static files from public directory
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Parse JSON bodies
        this.app.use(express.json());

        // Session management middleware
        this.app.use((req, res, next) => {
            req.sessionId = req.headers['x-session-id'] || req.headers.cookie?.match(/sessionId=([^;]+)/)?.[1];
            next();
        });

        // Add basic logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Setup all API routes
     */
    setupRoutes() {
        // Login page
        this.app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, '../public', 'login.html'));
        });

        // Registration page
        this.app.get('/register', (req, res) => {
            res.sendFile(path.join(__dirname, '../public', 'register.html'));
        });

        // Main page (protected)
        this.app.get('/', this.requireAuthRedirect.bind(this), (req, res) => {
            res.sendFile(path.join(__dirname, '../public', 'index.html'));
        });

        // Preferences page (protected)
        this.app.get('/preferences', this.requireAuthRedirect.bind(this), (req, res) => {
            res.sendFile(path.join(__dirname, '../public', 'preferences.html'));
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Authentication endpoints
        this.app.post('/api/auth/login', async (req, res) => {
            try {
                const { username, password, rememberMe } = req.body;
                
                if (!username || !password) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username and password are required'
                    });
                }

                const loginResult = await this.authenticateUser(username, password);
                
                if (loginResult.success) {
                    const sessionData = await this.createSession(loginResult.user, rememberMe);
                    
                    // Set session cookie
                    res.cookie('sessionId', sessionData.sessionId, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 days or 1 day
                        sameSite: 'lax'
                    });

                    res.json({
                        success: true,
                        message: 'Login successful',
                        user: {
                            username: loginResult.user.username,
                            displayName: loginResult.user.displayName,
                            email: loginResult.user.email
                        }
                    });
                } else {
                    res.status(401).json({
                        success: false,
                        message: loginResult.message
                    });
                }
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });

        this.app.get('/api/auth/check', async (req, res) => {
            try {
                const sessionData = await this.validateSession(req.sessionId);
                
                if (sessionData.valid) {
                    res.json({
                        authenticated: true,
                        user: {
                            username: sessionData.user.username,
                            displayName: sessionData.user.displayName,
                            email: sessionData.user.email
                        }
                    });
                } else {
                    res.status(401).json({
                        authenticated: false,
                        message: sessionData.message
                    });
                }
            } catch (error) {
                console.error('Session check error:', error);
                res.status(500).json({
                    authenticated: false,
                    message: 'Internal server error'
                });
            }
        });

        this.app.post('/api/auth/logout', async (req, res) => {
            try {
                if (req.sessionId) {
                    await this.destroySession(req.sessionId);
                }
                
                res.clearCookie('sessionId');
                res.json({
                    success: true,
                    message: 'Logout successful'
                });
            } catch (error) {
                console.error('Logout error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });

        // Registration endpoint
        this.app.post('/api/auth/register', async (req, res) => {
            try {
                const { username, email, displayName, password, confirmPassword, agreeTerms, newsletter } = req.body;
                
                // Validate required fields
                if (!username || !email || !displayName || !password || !confirmPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'All fields are required'
                    });
                }

                // Validate password match
                if (password !== confirmPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'Passwords do not match'
                    });
                }

                // Validate terms agreement
                if (!agreeTerms) {
                    return res.status(400).json({
                        success: false,
                        message: 'You must agree to the Terms of Service and Privacy Policy'
                    });
                }

                const registrationResult = await this.registerUser({
                    username,
                    email,
                    displayName,
                    password,
                    newsletter
                });
                
                if (registrationResult.success) {
                    res.json({
                        success: true,
                        message: 'Account created successfully',
                        user: {
                            username: registrationResult.user.username,
                            displayName: registrationResult.user.displayName,
                            email: registrationResult.user.email
                        }
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: registrationResult.message
                    });
                }
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });

        // Check username availability
        this.app.get('/api/auth/check-username', async (req, res) => {
            try {
                const { username } = req.query;
                
                if (!username) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username is required'
                    });
                }

                const isAvailable = await this.checkUsernameAvailability(username);
                
                res.json({
                    success: true,
                    available: isAvailable,
                    message: isAvailable ? 'Username is available' : 'Username is already taken'
                });
            } catch (error) {
                console.error('Username check error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });

        // API endpoint to get all available sports
        this.app.get('/api/sports', async (req, res) => {
            try {
                const result = await this.sportsAPI.getAvailableSports();
                console.log('Raw sports API result:', result); // Debug log
                
                if (result.success && result.sports) {
                    console.log('Number of sports from API:', result.sports.length); // Debug log
                    console.log('First few sports:', result.sports.slice(0, 5)); // Debug log
                    
                    // Add icons to sports for better UI
                    const sportsWithIcons = result.sports.map(sport => ({
                        id: sport.strSport.toLowerCase().replace(/\s+/g, '-'),
                        name: sport.strSport,
                        icon: this.getSportIcon(sport.strSport),
                        originalName: sport.strSport
                    }));

                    console.log('Processed sports count:', sportsWithIcons.length); // Debug log

                    res.json({
                        success: true,
                        sports: sportsWithIcons,
                        count: sportsWithIcons.length
                    });
                } else {
                    console.log('Sports API failed or no sports returned:', result); // Debug log
                    res.json(result);
                }
            } catch (error) {
                console.error('Error in /api/sports endpoint:', error); // Debug log
                res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching sports',
                    error: error.message 
                });
            }
        });

        // API endpoint to get leagues by sport
        this.app.get('/api/leagues/:sport', async (req, res) => {
            try {
                const sport = req.params.sport;
                const result = await this.sportsAPI.getLeaguesBySport(sport);
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching leagues',
                    error: error.message 
                });
            }
        });

        // API endpoint to get events by league
        this.app.get('/api/events/league/:leagueId', async (req, res) => {
            try {
                const leagueId = req.params.leagueId;
                const result = await this.sportsAPI.getEventsByLeague(leagueId);
                
                if (result.success && result.events) {
                    // Format events for web display
                    const formattedEvents = result.events.map(event => 
                        this.sportsAPI.formatEvent(event)
                    );
                    res.json({
                        ...result,
                        events: formattedEvents
                    });
                } else {
                    res.json(result);
                }
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching events',
                    error: error.message 
                });
            }
        });

        // API endpoint to get upcoming events by team
        this.app.get('/api/events/team/:teamName', async (req, res) => {
            try {
                const teamName = req.params.teamName;
                const result = await this.sportsAPI.getUpcomingEventsByTeam(teamName);
                
                if (result.success && result.events) {
                    const formattedEvents = result.events.map(event => 
                        this.sportsAPI.formatEvent(event)
                    );
                    res.json({
                        ...result,
                        events: formattedEvents
                    });
                } else {
                    res.json(result);
                }
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching team events',
                    error: error.message 
                });
            }
        });

        // API endpoint to search teams
        this.app.get('/api/teams/search/:teamName', async (req, res) => {
            try {
                const teamName = req.params.teamName;
                const result = await this.sportsAPI.searchTeams(teamName);
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error searching teams',
                    error: error.message 
                });
            }
        });

        // API endpoint to get teams by sport (Fili y Tizi requirement)
        this.app.get('/api/teams/sport/:sportName', async (req, res) => {
            try {
                const sportName = req.params.sportName;
                console.log(`Getting teams for sport: ${sportName}`);
                const result = await this.sportsAPI.getTeamsBySport(sportName);
                res.json(result);
            } catch (error) {
                console.error('Error getting teams by sport:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'Error getting teams by sport',
                    error: error.message 
                });
            }
        });

        // API endpoint to get formatted event data
        this.app.post('/api/events/format', async (req, res) => {
            try {
                const { events } = req.body;
                
                if (!events || !Array.isArray(events)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid events data provided'
                    });
                }

                const formattedEvents = events.map(event => 
                    this.sportsAPI.formatEvent(event)
                );
                
                res.json({
                    success: true,
                    events: formattedEvents,
                    count: formattedEvents.length
                });
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error formatting events',
                    error: error.message 
                });
            }
        });

        // API endpoint to get current events (aggregate from popular sports)
        this.app.get('/api/events', async (req, res) => {
            try {
                console.log('🔄 Fetching current events from popular sports...');
                
                // Define popular sports to get events from
                const popularSports = ['Soccer', 'Basketball', 'American Football', 'Baseball', 'Tennis'];
                let allEvents = [];
                
                // Get events from each popular sport
                for (const sport of popularSports) {
                    try {
                        console.log(`🏆 Getting events for ${sport}...`);
                        const leaguesResult = await this.sportsAPI.getLeaguesBySport(sport);
                        
                        if (leaguesResult.success && leaguesResult.leagues && leaguesResult.leagues.length > 0) {
                            // Get events from the first few leagues of this sport
                            const topLeagues = leaguesResult.leagues.slice(0, 2); // Limit to avoid too many API calls
                            
                            for (const league of topLeagues) {
                                try {
                                    const eventsResult = await this.sportsAPI.getEventsByLeague(league.idLeague);
                                    if (eventsResult.success && eventsResult.events) {
                                        const formattedEvents = eventsResult.events.map(event => ({
                                            ...this.sportsAPI.formatEvent(event),
                                            sport: sport // Ensure sport is set correctly
                                        }));
                                        allEvents.push(...formattedEvents);
                                    }
                                } catch (error) {
                                    console.error(`Error getting events for league ${league.idLeague}:`, error.message);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error getting leagues for ${sport}:`, error.message);
                    }
                }
                
                // Remove duplicates and limit results
                const uniqueEvents = allEvents.filter((event, index, self) => 
                    index === self.findIndex(e => e.id === event.id)
                ).slice(0, 50); // Limit to 50 events max
                
                console.log(`✅ Found ${uniqueEvents.length} total events`);
                
                res.json({
                    success: true,
                    events: uniqueEvents,
                    count: uniqueEvents.length,
                    message: `Found ${uniqueEvents.length} current events`
                });
                
            } catch (error) {
                console.error('Error in /api/events endpoint:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching current events',
                    error: error.message 
                });
            }
        });

        // API endpoint to get user preferences (protected)
        this.app.get('/api/preferences', this.requireAuth.bind(this), async (req, res) => {
            try {
                const dbPath = path.join(__dirname, '../public/db.json');
                const data = await this.readDB(dbPath);
                
                res.json({
                    success: true,
                    preferences: data.userPreferences
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error loading preferences',
                    error: error.message
                });
            }
        });

        // API endpoint to save user preferences (protected)
        this.app.post('/api/preferences', this.requireAuth.bind(this), async (req, res) => {
            try {
                const { preferences } = req.body;
                
                if (!preferences) {
                    return res.status(400).json({
                        success: false,
                        message: 'Preferences data is required'
                    });
                }

                const dbPath = path.join(__dirname, '../public/db.json');
                const data = await this.readDB(dbPath);
                
                // Update user preferences
                data.userPreferences = {
                    selectedSports: preferences.selectedSports || [],
                    selectedTeams: preferences.selectedTeams || [],
                    selectedEvents: preferences.selectedEvents || [],
                    selectedLeagues: preferences.selectedLeagues || []
                };

                await this.writeDB(dbPath, data);
                
                res.json({
                    success: true,
                    message: 'Preferences saved successfully',
                    preferences: data.userPreferences
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error saving preferences',
                    error: error.message
                });
            }
        });

        // API endpoint to get filtered data based on user preferences (protected)
        this.app.get('/api/dashboard/filtered', this.requireAuth.bind(this), async (req, res) => {
            try {
                const dbPath = path.join(__dirname, '../public/db.json');
                const data = await this.readDB(dbPath);
                const preferences = data.userPreferences;
                
                // If no preferences set, return empty results
                if (!preferences.selectedSports.length && !preferences.selectedLeagues.length) {
                    return res.json({
                        success: true,
                        message: 'No preferences set',
                        events: [],
                        leagues: [],
                        teams: []
                    });
                }

                // Get events from selected leagues
                let allEvents = [];
                if (preferences.selectedLeagues.length > 0) {
                    const eventsPromises = preferences.selectedLeagues.map(async (league) => {
                        try {
                            // Extract the ID from the league object
                            const leagueId = typeof league === 'string' ? league : league.id;
                            console.log('🔄 Fetching events for league ID:', leagueId);
                            const result = await this.sportsAPI.getEventsByLeague(leagueId);
                            return result.success ? result.events : [];
                        } catch (error) {
                            console.error(`Error fetching events for league ${league}:`, error);
                            return [];
                        }
                    });

                    const leagueEvents = await Promise.all(eventsPromises);
                    allEvents = leagueEvents.flat();
                }

                // Format events
                const formattedEvents = allEvents.map(event => 
                    this.sportsAPI.formatEvent(event)
                );

                res.json({
                    success: true,
                    events: formattedEvents,
                    preferences: preferences,
                    count: formattedEvents.length
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error loading filtered dashboard data',
                    error: error.message
                });
            }
        });

        // AI Agent endpoint - Connect to real ADK agent
        this.app.post('/api/agent/chat', this.requireAuth.bind(this), async (req, res) => {
            try {
                const { message } = req.body;
                
                if (!message) {
                    return res.status(400).json({
                        success: false,
                        message: 'Message is required'
                    });
                }

                console.log(`🤖 AI Agent query: "${message}"`);

                // Get user context for personalized responses
                const userContext = {
                    user: req.user,
                    sessionId: req.sessionId,
                    timestamp: new Date().toISOString()
                };

                // Import and call the actual AI agent using spawn for better error handling
                const { spawn } = require('child_process');
                const path = require('path');
                
                // Path to ADK agent runner
                const agentPath = path.join(__dirname, '../../../../adk');
                const agentRunnerPath = path.join(agentPath, 'agent_runner.py');
                
                // Escape message and context for shell safety
                const escapedMessage = message.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const contextJson = JSON.stringify(userContext).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

                // Execute the real ADK agent with Opik tracing
                const agentScript = `
import sys
import asyncio
import os
from io import StringIO
sys.path.append('${agentPath}')

async def main():
    try:
        from agents.sports_events_agent.agent import sports_agent
        
        print("AGENT_RESPONSE_START")
        
        # Set environment - API key should be loaded from environment
        if not os.environ.get('GOOGLE_API_KEY'):
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        # Simulate user input via stdin (this method works reliably with ADK)
        user_message = "${escapedMessage}"
        original_stdin = sys.stdin
        sys.stdin = StringIO(user_message + "\\n")
        
        full_response = ""
        
        try:
            # Import ADK components
            from google.adk.agents.invocation_context import InvocationContext
            from google.adk.sessions.in_memory_session_service import InMemorySessionService
            from google.adk.agents.run_config import RunConfig
            import uuid
            
            # Create minimal ADK context
            session_service = InMemorySessionService()
            run_config = RunConfig(response_modalities=["TEXT"])
            
            # Create proper session object with all required fields
            mock_session = {
                'id': str(uuid.uuid4()),
                'state': {},
                'user_id': 'web-user',
                'appName': 'sports-buddy-web-chat'
            }
            
            context = InvocationContext(
                session_service=session_service,
                invocation_id=str(uuid.uuid4()),
                agent=sports_agent,
                session=mock_session,
                run_config=run_config
            )
            
            # Process agent response with proper ADK pattern
            chunk_count = 0
            async for response_chunk in sports_agent.run_async(context):
                if chunk_count > 20:  # Prevent infinite loops
                    break
                chunk_count += 1
                
                # Extract ALL content including function calls and responses
                if hasattr(response_chunk, 'content'):
                    content = response_chunk.content
                    if hasattr(content, 'parts'):
                        for part in content.parts:
                            if hasattr(part, 'text') and part.text:
                                text = str(part.text).strip()
                                if text:
                                    full_response += text + " "
                            elif hasattr(part, 'function_call'):
                                # Function call detected - let the agent complete the call
                                func_call = part.function_call
                                if func_call and hasattr(func_call, 'name'):
                                    full_response += f"[Calling {func_call.name}...] "
                            elif hasattr(part, 'function_response'):
                                # Function response - include in final response
                                func_resp = part.function_response
                                if func_resp and hasattr(func_resp, 'response'):
                                    # Parse the tool response
                                    try:
                                        import json
                                        tool_data = json.loads(str(func_resp.response))
                                        if tool_data.get('success') and tool_data.get('teams'):
                                            teams = tool_data['teams']
                                            full_response += f"Found {len(teams)} team(s). "
                                            for team in teams[:2]:  # Limit to first 2 teams
                                                full_response += f"{team.get('team_name', 'Unknown')} ({team.get('sport', 'Unknown sport')}, {team.get('league', 'Unknown league')}). "
                                    except:
                                        # Fallback to raw response
                                        full_response += f"Tool result: {str(func_resp.response)[:100]}... "
                    else:
                        # Fallback for direct content
                        content_text = str(response_chunk.content).strip()
                        if content_text and len(content_text) > 3:
                            full_response += content_text + " "
                elif hasattr(response_chunk, 'text'):
                    text = str(response_chunk.text).strip() 
                    if text:
                        full_response += text + " "
                else:
                    # Last resort - convert to string
                    chunk_str = str(response_chunk).strip()
                    if chunk_str and len(chunk_str) > 5 and not chunk_str.startswith('<'):
                        full_response += chunk_str + " "
                        
        finally:
            sys.stdin = original_stdin
        
        # Clean and output response
        clean_response = full_response.strip()
        if clean_response:
            print(clean_response)
        else:
            # Fallback only if no content at all
            print("I'm Sports Buddy! I can help you find information about any sports team. Which team interests you?")
        
        print("AGENT_RESPONSE_END")
        
    except Exception as e:
        print("AGENT_ERROR_START")
        print(f"Error: {str(e)}")
        print("AGENT_ERROR_END")

if __name__ == "__main__":
    asyncio.run(main())
                `;

                // Execute the agent script
                const python = spawn('python3', ['-c', agentScript], {
                    cwd: agentPath,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        PYTHONPATH: agentPath,
                        OPIK_API_KEY: process.env.OPIK_API_KEY,
                        OPIK_WORKSPACE: process.env.OPIK_WORKSPACE
                    }
                });

                let output = '';
                let errorOutput = '';

                python.stdout.on('data', (data) => {
                    output += data.toString();
                });

                python.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                python.on('close', (code) => {
                    console.log(`🐍 Python process exited with code: ${code}`);
                    
                    if (code === 0) {
                        // Extract agent response
                        const startMarker = 'AGENT_RESPONSE_START';
                        const endMarker = 'AGENT_RESPONSE_END';
                        const startIndex = output.indexOf(startMarker);
                        const endIndex = output.indexOf(endMarker);
                        
                        if (startIndex !== -1 && endIndex !== -1) {
                            const agentResponse = output.substring(
                                startIndex + startMarker.length, 
                                endIndex
                            ).trim();
                            
                            console.log(`✅ AI Agent response: ${agentResponse.substring(0, 100)}...`);
                            
                            res.json({
                                success: true,
                                response: agentResponse,
                                reasoning: 'Generated using Gemini 2.5 Pro with sports tools and user context',
                                agent_used: true,
                                user_context_applied: true
                            });
                        } else {
                            // Check for agent error
                            const errorStartMarker = 'AGENT_ERROR_START';
                            const errorEndMarker = 'AGENT_ERROR_END';
                            const errorStartIndex = output.indexOf(errorStartMarker);
                            const errorEndIndex = output.indexOf(errorEndMarker);
                            
                            if (errorStartIndex !== -1 && errorEndIndex !== -1) {
                                const agentError = output.substring(
                                    errorStartIndex + errorStartMarker.length, 
                                    errorEndIndex
                                ).trim();
                                
                                console.error('❌ Agent reported error:', agentError);
                                res.status(500).json({
                                    success: false,
                                    message: 'AI Agent reported an error',
                                    error: agentError
                                });
                            } else {
                                console.error('❌ Could not parse agent response:', output);
                                res.status(500).json({
                                    success: false,
                                    message: 'Could not parse agent response',
                                    raw_output: output,
                                    stderr: errorOutput
                                });
                            }
                        }
                    } else {
                        console.error('❌ AI Agent process failed with code:', code);
                        console.error('❌ stderr:', errorOutput);
                        console.error('❌ stdout:', output);
                        
                        res.status(500).json({
                            success: false,
                            message: 'AI Agent process failed',
                            error: errorOutput || output,
                            exit_code: code
                        });
                    }
                });

                python.on('error', (error) => {
                    console.error('❌ Failed to start Python process:', error);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Failed to start AI Agent process',
                            error: error.message
                        });
                    }
                });

                // Set timeout for agent response
                const timeout = setTimeout(() => {
                    if (!res.headersSent) {
                        console.warn('⏰ AI Agent timeout - killing process');
                        python.kill('SIGTERM');
                        res.status(408).json({
                            success: false,
                            message: 'AI Agent timeout - response took too long'
                        });
                    }
                }, 60000); // 60 second timeout (agents can be slow)
                
                // Clear timeout if response comes back in time
                python.on('close', () => {
                    clearTimeout(timeout);
                });
                
            } catch (error) {
                console.error('❌ AI Agent endpoint error:', error);
                res.status(500).json({
                    success: false,
                    message: 'AI Agent error',
                    error: error.message
                });
            }
        });

        // 404 handler for API routes
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found',
                path: req.path
            });
        });

        // 404 handler for all other routes
        this.app.use('*', (req, res) => {
            res.status(404).sendFile(path.join(__dirname, '../public', 'index.html'));
        });

        // Error handling middleware
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }

    /**
     * Start the Express server
     * @returns {Promise} Server instance
     */
    start() {
        return new Promise((resolve, reject) => {
            try {
                const server = this.app.listen(this.port, () => {
                    console.log(`🌐 Web server running at http://localhost:${this.port}`);
                    console.log(`📊 Sports Events Dashboard available at http://localhost:${this.port}`);
                    resolve(server);
                });

                server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.error(`❌ Port ${this.port} is already in use`);
                        reject(new Error(`Port ${this.port} is already in use`));
                    } else {
                        console.error('❌ Server error:', error);
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get the Express app instance
     * @returns {Express} Express app
     */
    getApp() {
        return this.app;
    }

    /**
     * Get the SportsEventsAPI instance
     * @returns {SportsEventsAPI} API instance
     */
    getAPI() {
        return this.sportsAPI;
    }

    /**
     * Read database file
     * @param {string} dbPath - Path to database file
     * @returns {Object} Database content
     */
    async readDB(dbPath) {
        try {
            const data = await fs.readFile(dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is invalid, return default structure
            return {
                userPreferences: {
                    selectedSports: [],
                    selectedTeams: [],
                    selectedEvents: [],
                    selectedLeagues: []
                },
                availableSports: [],
                teams: [],
                events: [],
                leagues: []
            };
        }
    }

    /**
     * Write database file
     * @param {string} dbPath - Path to database file
     * @param {Object} data - Data to write
     */
    async writeDB(dbPath, data) {
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    }

    /**
     * Get appropriate icon for a sport
     * @param {string} sportName - Name of the sport
     * @returns {string} Emoji icon for the sport
     */
    getSportIcon(sportName) {
        const sportIcons = {
            'Soccer': '⚽',
            'Football': '⚽',
            'Basketball': '🏀',
            'American Football': '🏈',
            'Baseball': '⚾',
            'Ice Hockey': '🏒',
            'Hockey': '🏒',
            'Tennis': '🎾',
            'Golf': '⛳',
            'Cricket': '🏏',
            'Rugby': '🏉',
            'Volleyball': '🏐',
            'Table Tennis': '🏓',
            'Badminton': '🏸',
            'Boxing': '🥊',
            'Martial Arts': '🥋',
            'Swimming': '🏊',
            'Athletics': '🏃',
            'Track and Field': '🏃',
            'Cycling': '🚴',
            'Motorsport': '🏎️',
            'Formula 1': '🏎️',
            'Skiing': '⛷️',
            'Snowboarding': '🏂',
            'Wrestling': '🤼',
            'Handball': '🤾',
            'Water Polo': '🤽',
            'Archery': '🏹',
            'Fishing': '🎣',
            'Sailing': '⛵',
            'Surfing': '🏄',
            'Climbing': '🧗',
            'Gymnastics': '🤸',
            'Weightlifting': '🏋️',
            'Darts': '🎯',
            'Billiards': '🎱',
            'Bowling': '🎳',
            'Esports': '🎮',
            'Chess': '♟️'
        };

        // Try exact match first
        if (sportIcons[sportName]) {
            return sportIcons[sportName];
        }

        // Try partial matches
        const sportLower = sportName.toLowerCase();
        for (const [key, icon] of Object.entries(sportIcons)) {
            if (sportLower.includes(key.toLowerCase()) || key.toLowerCase().includes(sportLower)) {
                return icon;
            }
        }

        // Default icon for unrecognized sports
        return '🏆';
    }

    /**
     * Authentication middleware for API routes
     */
    async requireAuth(req, res, next) {
        try {
            const sessionData = await this.validateSession(req.sessionId);
            
            if (sessionData.valid) {
                req.user = sessionData.user;
                next();
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Authentication middleware for page routes (redirects to login)
     */
    async requireAuthRedirect(req, res, next) {
        try {
            const sessionData = await this.validateSession(req.sessionId);
            
            if (sessionData.valid) {
                req.user = sessionData.user;
                next();
            } else {
                // Redirect to login with return URL
                const returnTo = encodeURIComponent(req.originalUrl);
                res.redirect(`/login?redirect=${returnTo}`);
            }
        } catch (error) {
            console.error('Auth redirect middleware error:', error);
            res.redirect('/login');
        }
    }

    /**
     * Authenticate user credentials
     */
    async authenticateUser(username, password) {
        try {
            const sessionPath = path.join(__dirname, '../public/session.json');
            const sessionData = await this.readSessionFile(sessionPath);
            
            const user = sessionData.users[username];
            
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            // In a real app, you'd hash and compare passwords
            if (user.password !== password) {
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            await this.writeSessionFile(sessionPath, sessionData);

            return {
                success: true,
                user: {
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    lastLogin: user.lastLogin
                }
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                message: 'Authentication service error'
            };
        }
    }

    /**
     * Create a new session
     */
    async createSession(user, rememberMe = false) {
        try {
            const sessionPath = path.join(__dirname, '../public/session.json');
            const sessionData = await this.readSessionFile(sessionPath);
            
            const sessionId = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            
            if (rememberMe) {
                expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
            } else {
                expiresAt.setDate(expiresAt.getDate() + 1); // 1 day
            }

            sessionData.sessions[sessionId] = {
                userId: user.username,
                user: user,
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
                rememberMe: rememberMe
            };

            await this.writeSessionFile(sessionPath, sessionData);

            return {
                sessionId,
                expiresAt: expiresAt.toISOString()
            };
        } catch (error) {
            console.error('Session creation error:', error);
            throw new Error('Failed to create session');
        }
    }

    /**
     * Validate a session
     */
    async validateSession(sessionId) {
        try {
            if (!sessionId) {
                return {
                    valid: false,
                    message: 'No session ID provided'
                };
            }

            const sessionPath = path.join(__dirname, '../public/session.json');
            const sessionData = await this.readSessionFile(sessionPath);
            
            const session = sessionData.sessions[sessionId];
            
            if (!session) {
                return {
                    valid: false,
                    message: 'Session not found'
                };
            }

            const now = new Date();
            const expiresAt = new Date(session.expiresAt);

            if (now > expiresAt) {
                // Clean up expired session
                delete sessionData.sessions[sessionId];
                await this.writeSessionFile(sessionPath, sessionData);
                
                return {
                    valid: false,
                    message: 'Session expired'
                };
            }

            return {
                valid: true,
                user: session.user,
                session: session
            };
        } catch (error) {
            console.error('Session validation error:', error);
            return {
                valid: false,
                message: 'Session validation failed'
            };
        }
    }

    /**
     * Destroy a session
     */
    async destroySession(sessionId) {
        try {
            const sessionPath = path.join(__dirname, '../public/session.json');
            const sessionData = await this.readSessionFile(sessionPath);
            
            delete sessionData.sessions[sessionId];
            
            await this.writeSessionFile(sessionPath, sessionData);
            
            return { success: true };
        } catch (error) {
            console.error('Session destruction error:', error);
            throw new Error('Failed to destroy session');
        }
    }

    /**
     * Read session file
     */
    async readSessionFile(sessionPath) {
        try {
            const data = await fs.readFile(sessionPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, create default structure
            const defaultData = {
                users: {
                    demo: {
                        username: 'demo',
                        password: 'demo123',
                        email: 'demo@sportbuddy.com',
                        displayName: 'Demo User',
                        createdAt: new Date().toISOString(),
                        lastLogin: null
                    },
                    admin: {
                        username: 'admin',
                        password: 'admin123',
                        email: 'admin@sportbuddy.com',
                        displayName: 'Administrator',
                        createdAt: new Date().toISOString(),
                        lastLogin: null
                    }
                },
                sessions: {}
            };
            
            await this.writeSessionFile(sessionPath, defaultData);
            return defaultData;
        }
    }

    /**
     * Write session file
     */
    async writeSessionFile(sessionPath, data) {
        await fs.writeFile(sessionPath, JSON.stringify(data, null, 2), 'utf8');
    }

    /**
     * Register a new user
     */
    async registerUser(userData) {
        try {
            const sessionPath = path.join(__dirname, '../public/session.json');
            const sessionData = await this.readSessionFile(sessionPath);
            
            // Check if username already exists
            if (sessionData.users[userData.username]) {
                return {
                    success: false,
                    message: 'Username is already taken'
                };
            }

            // Check if email already exists
            const existingUser = Object.values(sessionData.users).find(user => user.email === userData.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email address is already registered'
                };
            }

            // Validate username format
            const usernameRegex = /^[a-zA-Z0-9_]+$/;
            if (!usernameRegex.test(userData.username) || userData.username.length < 3 || userData.username.length > 20) {
                return {
                    success: false,
                    message: 'Username must be 3-20 characters, letters, numbers, and underscores only'
                };
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                return {
                    success: false,
                    message: 'Please enter a valid email address'
                };
            }

            // Validate password length
            if (userData.password.length < 6) {
                return {
                    success: false,
                    message: 'Password must be at least 6 characters long'
                };
            }

            // Create new user
            const newUser = {
                username: userData.username,
                email: userData.email,
                displayName: userData.displayName,
                password: userData.password, // In production, this should be hashed
                newsletter: userData.newsletter || false,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                emailVerified: false, // For future email verification feature
                isActive: true
            };

            // Add user to database
            sessionData.users[userData.username] = newUser;
            
            // Save updated data
            await this.writeSessionFile(sessionPath, sessionData);

            return {
                success: true,
                user: {
                    username: newUser.username,
                    email: newUser.email,
                    displayName: newUser.displayName,
                    createdAt: newUser.createdAt
                }
            };
        } catch (error) {
            console.error('User registration error:', error);
            return {
                success: false,
                message: 'Registration service error'
            };
        }
    }

    /**
     * Check if username is available
     */
    async checkUsernameAvailability(username) {
        try {
            const sessionPath = path.join(__dirname, '../public/session.json');
            const sessionData = await this.readSessionFile(sessionPath);
            
            // Check if username exists (case-insensitive)
            const existingUser = Object.keys(sessionData.users).find(
                user => user.toLowerCase() === username.toLowerCase()
            );
            
            return !existingUser;
        } catch (error) {
            console.error('Username availability check error:', error);
            // In case of error, assume unavailable for safety
            return false;
        }
    }
}

module.exports = SportsEventsServer;
