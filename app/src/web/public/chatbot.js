// Sports Events Chatbot Client

class SportsChatbot {
    constructor() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.chatForm = document.getElementById('chat-form');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.agentStatus = document.getElementById('agent-status');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        
        this.isProcessing = false;
        this.userPreferences = null; // Store user preferences
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadUserPreferences();
        this.checkAgentStatus();
        console.log('🤖 Sports Chatbot initialized');
    }

    bindEvents() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                this.userInput.value = query;
                this.sendMessage();
            });
        });

        // Error popup close
        const closeErrorBtn = document.getElementById('close-error');
        if (closeErrorBtn) {
            closeErrorBtn.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Enter key handling
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async loadUserPreferences() {
        try {
            const response = await fetch('/api/preferences');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.userPreferences = data.preferences;
                    console.log('📋 User preferences loaded:', this.userPreferences);
                    this.updateWelcomeMessage();
                } else {
                    console.warn('No user preferences found');
                    this.userPreferences = { selectedSports: [], selectedTeams: [], selectedLeagues: [] };
                }
            } else {
                console.warn('Could not load user preferences - user may not be logged in');
                this.userPreferences = { selectedSports: [], selectedTeams: [], selectedLeagues: [] };
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
            this.userPreferences = { selectedSports: [], selectedTeams: [], selectedLeagues: [] };
        }
    }

    updateWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message .message-content');
        if (welcomeMessage && this.userPreferences) {
            const hasPreferences = this.userPreferences.selectedSports?.length > 0 || 
                                 this.userPreferences.selectedTeams?.length > 0 || 
                                 this.userPreferences.selectedLeagues?.length > 0;
            
            if (hasPreferences) {
                const sportsCount = this.userPreferences.selectedSports?.length || 0;
                const teamsCount = this.userPreferences.selectedTeams?.length || 0;
                const leaguesCount = this.userPreferences.selectedLeagues?.length || 0;
                
                welcomeMessage.innerHTML = `
                    <p>👋 Hi! I'm your personalized Sports Events Assistant!</p>
                    <p>🎯 <strong>Your preferences:</strong></p>
                    <ul>
                        <li>📊 ${sportsCount} sport${sportsCount !== 1 ? 's' : ''} selected</li>
                        <li>👥 ${teamsCount} team${teamsCount !== 1 ? 's' : ''} selected</li>
                        <li>🏆 ${leaguesCount} league${leaguesCount !== 1 ? 's' : ''} selected</li>
                    </ul>
                    <p>I'll only show you information about your configured sports, teams, and leagues!</p>
                    <p>Try asking: <em>"What events are happening?"</em> or <em>"Show me my team's matches"</em></p>
                `;
            }
        }
    }

    async checkAgentStatus() {
        try {
            // Check if our sports events API is accessible
            const response = await fetch('/api/sports');
            if (response.ok) {
                this.updateStatus('Ready', 'online');
            } else {
                this.updateStatus('API Error', 'error');
            }
        } catch (error) {
            console.error('Error checking agent status:', error);
            this.updateStatus('Offline', 'error');
        }
    }

    updateStatus(text, status = 'online') {
        const statusElement = this.agentStatus;
        if (!statusElement) {
            console.warn('Status element not found');
            return;
        }
        
        const icon = statusElement.querySelector('i');
        const textSpan = statusElement.querySelector('span:last-child');
        
        if (textSpan) {
            textSpan.textContent = text;
        } else {
            console.warn('Status text span not found');
        }
        
        // Update icon color based on status
        if (icon) {
            icon.className = 'fas fa-circle';
            switch (status) {
                case 'online':
                    icon.style.color = '#4ade80';
                    break;
                case 'processing':
                    icon.style.color = '#fbbf24';
                    break;
                case 'error':
                    icon.style.color = '#ef4444';
                    break;
            }
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.updateStatus('Processing...', 'processing');
        this.sendBtn.disabled = true;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.userInput.value = '';

        // Show typing indicator
        const typingId = this.showTypingIndicator();

        try {
            // Send message to our agent API
            const agentResult = await this.callSportsAgent(message);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Add bot response with AI indicator
            this.addMessage(agentResult.response, 'bot', agentResult.isRealAI);

        } catch (error) {
            console.error('Error calling sports agent:', error);
            this.removeTypingIndicator(typingId);
            this.addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'bot');
            this.showError('Failed to get response from sports agent: ' + error.message);
        } finally {
            this.isProcessing = false;
            this.updateStatus('Ready', 'online');
            this.sendBtn.disabled = false;
            this.userInput.focus();
        }
    }

    async callSportsAgent(message) {
        console.log('🤖 Calling Sports Agent with message:', message);
        
        // Try the real ADK agent first (context issues now fixed!)
        try {
            console.log('🧠 Calling real Gemini 2.5 Pro AI agent...');
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Real AI agent responded successfully');
                return { 
                    response: data.response, 
                    isRealAI: true,
                    reasoning: data.reasoning,
                    userContextApplied: data.user_context_applied
                };
            } else {
                console.warn('⚠️ Real AI agent failed:', data.message);
                throw new Error(data.message || 'Agent failed');
            }
        } catch (error) {
            console.error('❌ Real AI agent error:', error);
            
            // Fallback to enhanced simulation only if agent completely fails
            console.log('🔄 Falling back to enhanced simulation...');
            const fallbackResponse = await this.enhancedAgentResponse(message);
            return { 
                response: fallbackResponse, 
                isRealAI: false,
                reasoning: 'Fallback simulation due to agent error: ' + error.message
            };
        }
    }

    async enhancedAgentResponse(message) {
        console.log('🧠 Enhanced AI reasoning for:', message);
        
        // Multi-step reasoning inspired by agent instructions
        const analysis = this.analyzeQuery(message);
        console.log('🔍 Query analysis:', analysis);
        
        // Use tools strategically based on analysis
        return await this.executeSmartResponse(analysis, message);
    }
    
    analyzeQuery(message) {
        const lowerMessage = message.toLowerCase();
        
        return {
            intent: this.detectIntent(lowerMessage),
            entities: this.extractEntities(lowerMessage),
            context: this.getContextualInfo(lowerMessage),
            complexity: this.assessComplexity(lowerMessage)
        };
    }
    
    detectIntent(message) {
        // Intent detection with better reasoning
        if (message.includes('when') && (message.includes('play') || message.includes('match') || message.includes('game'))) {
            return 'schedule_query';
        }
        if (message.includes('how') && (message.includes('doing') || message.includes('performing'))) {
            return 'performance_query';  
        }
        if (message.includes('what') && message.includes('events')) {
            return 'event_discovery';
        }
        if (message.includes('show') || message.includes('list') || message.includes('see')) {
            return 'display_request';
        }
        if (message.includes('compare') || message.includes('vs') || message.includes('versus')) {
            return 'comparison_query';
        }
        if (message.includes('recommend') || message.includes('suggest')) {
            return 'recommendation_request';
        }
        
        return 'general_inquiry';
    }
    
    extractEntities(message) {
        const entities = {
            teams: [],
            sports: [],
            leagues: [],
            timeframes: [],
            locations: []
        };
        
        // Extract teams from user preferences
        if (this.userPreferences?.selectedTeams) {
            for (const team of this.userPreferences.selectedTeams) {
                if (message.includes(team.name.toLowerCase())) {
                    entities.teams.push(team);
                }
            }
        }
        
        // Extract sports
        const sportsKeywords = ['soccer', 'football', 'basketball', 'tennis', 'baseball', 'hockey'];
        for (const sport of sportsKeywords) {
            if (message.includes(sport)) {
                entities.sports.push(sport);
            }
        }
        
        // Extract time references
        const timeKeywords = ['today', 'tomorrow', 'this week', 'next week', 'weekend', 'month'];
        for (const time of timeKeywords) {
            if (message.includes(time)) {
                entities.timeframes.push(time);
            }
        }
        
        return entities;
    }
    
    getContextualInfo(message) {
        return {
            hasPreferences: this.hasValidPreferences(),
            userTeamsCount: this.userPreferences?.selectedTeams?.length || 0,
            userSportsCount: this.userPreferences?.selectedSports?.length || 0,
            previousQueries: [] // TODO: implement query history
        };
    }
    
    assessComplexity(message) {
        let score = 0;
        
        // Multiple entities increase complexity
        if (message.split(' ').length > 8) score += 2;
        if ((message.match(/and|or|but/g) || []).length > 0) score += 1;
        if (message.includes('compare') || message.includes('vs')) score += 2;
        if (message.includes('?')) score += 1;
        
        if (score <= 2) return 'simple';
        if (score <= 4) return 'moderate';
        return 'complex';
    }
    
    async executeSmartResponse(analysis, originalMessage) {
        console.log(`🎯 Executing ${analysis.intent} strategy with ${analysis.complexity} complexity`);
        
        // Smart routing based on intent and context
        switch (analysis.intent) {
            case 'schedule_query':
                return await this.handleScheduleQuery(analysis, originalMessage);
            
            case 'event_discovery':
                return await this.handleEventDiscovery(analysis, originalMessage);
                
            case 'performance_query':
                return await this.handlePerformanceQuery(analysis, originalMessage);
                
            case 'comparison_query':
                return await this.handleComparisonQuery(analysis, originalMessage);
                
            case 'recommendation_request':
                return await this.handleRecommendationRequest(analysis, originalMessage);
                
            default:
                return await this.handleGeneralInquiry(analysis, originalMessage);
        }
    }
    
    async handleScheduleQuery(analysis, message) {
        if (analysis.entities.teams.length > 0) {
            const team = analysis.entities.teams[0];
            return await this.getTeamEventsResponse(team.name);
        }
        
        if (analysis.context.hasPreferences) {
            return await this.getCurrentEventsResponse();
        }
        
        return "⚽ I'd love to help you find match schedules! To give you personalized results, please configure your favorite teams on the preferences page first.";
    }
    
    async handleEventDiscovery(analysis, message) {
        if (analysis.entities.sports.length > 0) {
            const sport = analysis.entities.sports[0];
            if (sport === 'soccer' || sport === 'football') {
                return await this.getSoccerEventsResponse();
            }
        }
        
        return await this.getCurrentEventsResponse();
    }
    
    async handlePerformanceQuery(analysis, message) {
        if (analysis.entities.teams.length > 0) {
            const teamName = analysis.entities.teams[0].name;
            return `📊 **${teamName} Performance Analysis:**\n\nI'd love to provide detailed performance stats for ${teamName}! This would include:\n• Recent match results\n• Current league position\n• Goal statistics\n• Form over last 5 games\n\nThis feature is coming soon! For now, I can show you their upcoming fixtures. Just ask "When does ${teamName} play?"`;
        }
        
        return "📊 Performance analysis is available for your configured teams! Tell me which team you'd like to analyze, or configure your favorites on the preferences page.";
    }
    
    async handleComparisonQuery(analysis, message) {
        if (analysis.entities.teams.length >= 2) {
            const team1 = analysis.entities.teams[0].name;
            const team2 = analysis.entities.teams[1].name;
            
            return `⚔️ **${team1} vs ${team2} Comparison:**\n\nThis would be an exciting analysis! I would compare:\n• Head-to-head record\n• Current league positions\n• Recent form\n• Key player stats\n• Upcoming fixtures\n\nThis feature is in development! For now, I can show you when each team plays next. Try asking "When does ${team1} play?" or "When does ${team2} play?"`;
        }
        
        return "⚔️ I can help compare teams! Tell me which teams you'd like to compare, or configure multiple teams in your preferences for personalized comparisons.";
    }
    
    async handleRecommendationRequest(analysis, message) {
        if (analysis.context.hasPreferences) {
            return `🎯 **Personalized Recommendations for You:**\n\nBased on your configured preferences:\n• ${analysis.context.userTeamsCount} favorite teams\n• ${analysis.context.userSportsCount} sports interests\n\nI recommend checking out your upcoming matches! Ask me "What events are happening?" to see your personalized fixture list.\n\nWant more specific recommendations? Ask about:\n• "Best matches this weekend"\n• "When does [your team] play next?"\n• "Show me derby matches"`;
        }
        
        return "🎯 I'd love to give you personalized recommendations! First, configure your favorite sports and teams on the preferences page, then I can suggest the best matches for you!";
    }
    
    async handleGeneralInquiry(analysis, message) {
        // Fallback to original simulation with better formatting
        return await this.simulateAgentResponse(message);
    }

    async simulateAgentResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Route to appropriate API based on message content
        try {
            // Check for specific team queries first
            const teamQuery = this.extractTeamFromMessage(message);
            if (teamQuery && (lowerMessage.includes('play') || lowerMessage.includes('match') || lowerMessage.includes('game') || lowerMessage.includes('when'))) {
                return await this.getTeamEventsResponse(teamQuery);
            }
            
            if (lowerMessage.includes('current events') || lowerMessage.includes('what events') || lowerMessage.includes('happening')) {
                return await this.getCurrentEventsResponse();
            }
            
            if (lowerMessage.includes('soccer') || lowerMessage.includes('football')) {
                return await this.getSoccerEventsResponse();
            }
            
            if (lowerMessage.includes('sports are available') || lowerMessage.includes('what sports')) {
                return await this.getAvailableSportsResponse();
            }
            
            if (lowerMessage.includes('preferences') || lowerMessage.includes('my sports')) {
                return await this.getUserPreferencesResponse();
            }
            
            if (lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
                return await this.getEventSummaryResponse();
            }
            
            if (lowerMessage.includes('team') && (lowerMessage.includes('find') || lowerMessage.includes('search'))) {
                const searchQuery = this.extractTeamQuery(message);
                return await this.searchTeamsResponse(searchQuery);
            }
            
            // Default response
            return await this.getDefaultResponse(message);
            
        } catch (error) {
            return this.getErrorResponse(error);
        }
    }

    async getCurrentEventsResponse() {
        // Use filtered events endpoint if user has preferences
        if (this.hasValidPreferences()) {
            const response = await fetch('/api/dashboard/filtered');
            const data = await response.json();
            
            if (!data.success || !data.events.length) {
                return "🏟️ No events found for your configured sports, teams, and leagues. You can update your preferences on the preferences page.";
            }

            const events = data.events.slice(0, 10); // Show more events since they're personalized
            const eventsBySpot = this.groupEventsBySport(events);
            
            let message = "🎯 **Your Personalized Sports Events:**\n\n";
            
            for (const [sport, sportEvents] of Object.entries(eventsBySpot)) {
                message += `**${this.getSportEmoji(sport)} ${sport}:**\n`;
                for (const event of sportEvents.slice(0, 5)) {
                    message += `• ${event.name || `${event.homeTeam} vs ${event.awayTeam}`}\n`;
                    if (event.date) message += `  📅 ${new Date(event.date).toLocaleDateString()}\n`;
                    if (event.league) message += `  🏆 ${event.league}\n`;
                }
                message += "\n";
            }
            
            return message + "These events match your configured preferences! 🎯";
        } else {
            return "⚙️ You haven't configured any sports preferences yet! Visit the preferences page to select your favorite sports, teams, and leagues, then I can show you personalized events.";
        }
    }

    async getSoccerEventsResponse() {
        // Check if user is interested in soccer
        if (!this.isUserInterestedInSport('Soccer')) {
            return "⚽ Soccer is not in your configured sports preferences. To see soccer events, please add Soccer to your preferences on the preferences page.";
        }

        // Use filtered events to get only user's soccer preferences
        if (this.hasValidPreferences()) {
            const response = await fetch('/api/dashboard/filtered');
            const data = await response.json();
            
            if (!data.success) {
                return "⚽ Sorry, I couldn't fetch your personalized soccer events right now. Please try again later.";
            }

            const soccerEvents = data.events.filter(event => 
                event.sport?.toLowerCase().includes('soccer') || 
                event.sport?.toLowerCase().includes('football')
            );

            if (!soccerEvents.length) {
                return "⚽ No soccer events found for your configured teams and leagues. You can add more soccer teams or leagues in your preferences.";
            }

            let message = "⚽ **Your Soccer Events:**\n\n";
            soccerEvents.slice(0, 8).forEach(event => {
                message += `• ${event.name || `${event.homeTeam} vs ${event.awayTeam}`}\n`;
                if (event.league) message += `  🏆 ${event.league}\n`;
                if (event.date) message += `  📅 ${new Date(event.date).toLocaleDateString()}\n`;
                message += "\n";
            });

            return message + "These are soccer events from your configured preferences! 🎯";
        } else {
            return "⚙️ Configure your soccer preferences first! Visit the preferences page to select your favorite soccer teams and leagues.";
        }
    }

    async getAvailableSportsResponse() {
        if (!this.hasValidPreferences()) {
            return "⚙️ You haven't configured any sports preferences yet! Visit the preferences page to select your favorite sports, teams, and leagues first.";
        }

        const selectedSports = this.userPreferences.selectedSports || [];
        const selectedTeams = this.userPreferences.selectedTeams || [];
        const selectedLeagues = this.userPreferences.selectedLeagues || [];

        // Get unique sports from all selections
        const userSports = new Set();
        
        selectedSports.forEach(sport => userSports.add(sport));
        selectedTeams.forEach(team => {
            if (team.sport) userSports.add(team.sport);
        });
        selectedLeagues.forEach(league => {
            if (league.sport) userSports.add(league.sport);
        });

        if (userSports.size === 0) {
            return "⚙️ No sports found in your preferences. Please configure your sports, teams, and leagues on the preferences page.";
        }

        let message = "🎯 **Your Configured Sports:**\n\n";
        Array.from(userSports).forEach(sport => {
            message += `${this.getSportEmoji(sport)} ${sport}\n`;
        });

        return message + "\nI'll only show you information about these sports! To add more sports, visit the preferences page. 🔧";
    }

    async getUserPreferencesResponse() {
        try {
            const response = await fetch('/api/preferences');
            const data = await response.json();
            
            if (!data.success) {
                return "🔐 I need you to be logged in to show your preferences. Please visit the preferences page to set them up!";
            }

            const prefs = data.preferences;
            let message = "🎯 **Your Sports Preferences:**\n\n";

            if (prefs.selectedSports?.length) {
                message += "**Sports:** " + prefs.selectedSports.join(', ') + "\n";
            }
            
            if (prefs.selectedTeams?.length) {
                message += "**Teams:** " + prefs.selectedTeams.map(t => t.name || t).join(', ') + "\n";
            }
            
            if (prefs.selectedLeagues?.length) {
                message += "**Leagues:** " + prefs.selectedLeagues.map(l => l.name || l).join(', ') + "\n";
            }

            if (!prefs.selectedSports?.length && !prefs.selectedTeams?.length && !prefs.selectedLeagues?.length) {
                message += "No preferences set yet. Visit the preferences page to set them up!\n";
            }

            return message + "\nWant to see events matching your preferences? Just ask!";
            
        } catch (error) {
            return "🔐 Please make sure you're logged in to view your preferences.";
        }
    }

    async getEventSummaryResponse() {
        const [eventsRes, sportsRes] = await Promise.all([
            fetch('/api/events'),
            fetch('/api/sports')
        ]);

        const eventsData = await eventsRes.json();
        const sportsData = await sportsRes.json();

        if (!eventsData.success || !sportsData.success) {
            return "📊 I couldn't generate a summary right now. Please try again later.";
        }

        const eventsBySpot = this.groupEventsBySport(eventsData.events || []);
        
        let message = "📊 **Sports Events Summary:**\n\n";
        message += `🎯 **Total Events:** ${eventsData.events?.length || 0}\n`;
        message += `🏆 **Available Sports:** ${sportsData.sports?.length || 0}\n\n`;
        
        message += "**Events by Sport:**\n";
        for (const [sport, events] of Object.entries(eventsBySpot)) {
            message += `${this.getSportEmoji(sport)} ${sport}: ${events.length} events\n`;
        }

        return message + "\nWhat sport would you like to explore? 🔍";
    }

    async getTeamEventsResponse(teamName) {
        try {
            // Check if the team is in user's preferences
            if (!this.userPreferences || !this.userPreferences.selectedTeams) {
                return "⚙️ You haven't configured any teams yet! Visit the preferences page to add your favorite teams first.";
            }

            const selectedTeams = this.userPreferences.selectedTeams || [];
            const team = selectedTeams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
            
            if (!team) {
                return `⚽ ${teamName} is not in your configured teams. I can only show information for your selected teams. Visit the preferences page to add ${teamName} to your favorites!`;
            }

            // Call the team events API endpoint using the team ID
            const response = await fetch(`/api/events/team/${encodeURIComponent(team.id)}`);
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Team events API error:', data);
                return `⚽ Sorry, I couldn't fetch upcoming matches for ${teamName} right now. Please try again later.`;
            }

            if (!data.success || !data.events || data.events.length === 0) {
                return `⚽ No upcoming matches found for ${teamName}. This could mean:\n• No scheduled matches in the near future\n• The team data might not be available\n• Try asking about current events instead!`;
            }

            let message = `⚽ **Upcoming matches for ${teamName}:**\n\n`;
            
            // Show up to 5 upcoming matches
            const upcomingMatches = data.events.slice(0, 5);
            upcomingMatches.forEach((match, index) => {
                message += `${index + 1}. `;
                if (match.homeTeam && match.awayTeam) {
                    message += `${match.homeTeam} vs ${match.awayTeam}\n`;
                } else if (match.name) {
                    message += `${match.name}\n`;
                } else {
                    message += `Match details TBA\n`;
                }
                
                if (match.date) {
                    const matchDate = new Date(match.date);
                    message += `   📅 ${matchDate.toLocaleDateString()} at ${matchDate.toLocaleTimeString()}\n`;
                }
                
                if (match.league) {
                    message += `   🏆 ${match.league}\n`;
                }
                
                if (match.venue) {
                    message += `   🏟️ ${match.venue}\n`;
                }
                
                message += "\n";
            });

            if (data.events.length > 5) {
                message += `... and ${data.events.length - 5} more matches!\n\n`;
            }

            message += `These are the upcoming matches for your team ${teamName}! 🎯`;
            return message;
            
        } catch (error) {
            console.error('Error fetching team events:', error);
            return `⚽ Sorry, I encountered an error while looking up matches for ${teamName}. Please try again later.`;
        }
    }

    async searchTeamsResponse(query) {
        if (!query) {
            return "👥 Please tell me which team you'd like to search for!";
        }

        if (!this.hasValidPreferences()) {
            return "⚙️ You haven't configured any teams yet! Visit the preferences page to add your favorite teams first.";
        }

        const selectedTeams = this.userPreferences.selectedTeams || [];
        
        if (selectedTeams.length === 0) {
            return "👥 No teams configured in your preferences. Add your favorite teams on the preferences page first!";
        }

        // Search within user's configured teams
        const matchingTeams = selectedTeams.filter(team => 
            team.name && team.name.toLowerCase().includes(query.toLowerCase())
        );

        if (matchingTeams.length) {
            let message = `👥 **Your teams matching "${query}":**\n\n`;
            matchingTeams.forEach(team => {
                message += `• ${team.name}\n`;
                if (team.sport) message += `  🏆 ${team.sport}\n`;
                message += "\n";
            });
            return message + "These are from your configured teams! Want to see their upcoming matches?";
        } else {
            let message = `👥 No matches for "${query}" in your configured teams.\n\n**Your current teams:**\n`;
            selectedTeams.forEach(team => {
                message += `• ${team.name} (${team.sport || 'Unknown Sport'})\n`;
            });
            return message + "\nTo add more teams, visit the preferences page! ⚙️";
        }
    }

    getDefaultResponse(message) {
        if (!this.hasValidPreferences()) {
            return "🤖 Hi! I'm your personalized sports assistant. To get started, please visit the preferences page to configure your favorite sports, teams, and leagues. Then I can show you personalized events and information!";
        }
        
        const responses = [
            "🤖 I'm here to help with your personalized sports events! Try asking about current events for your configured sports.",
            "🏆 I can show you events for your favorite teams and leagues! Ask me what's happening with your sports.",
            "📊 Want to know what's happening with your teams? I can show you personalized events and information!",
            "⚽ I'm your personalized sports assistant! Try asking 'What events are happening?' or 'Show me my team's matches'."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getErrorResponse(error) {
        console.error('Agent error:', error);
        return "😅 I encountered an issue while processing your request. Please try asking about current events or available sports!";
    }

    extractTeamFromMessage(message) {
        // Check if user's configured teams are mentioned in the message
        if (!this.userPreferences || !this.userPreferences.selectedTeams) {
            return null;
        }
        
        const lowerMessage = message.toLowerCase();
        
        for (const team of this.userPreferences.selectedTeams) {
            const teamName = team.name.toLowerCase();
            if (lowerMessage.includes(teamName)) {
                return team.name;
            }
        }
        
        return null;
    }

    extractTeamQuery(message) {
        // Simple extraction - look for team names after "find" or "search"
        const match = message.match(/(?:find|search)(?:\s+for)?\s+(.+)/i);
        return match ? match[1].replace(/teams?/gi, '').trim() : '';
    }

    hasValidPreferences() {
        return this.userPreferences && (
            (this.userPreferences.selectedSports && this.userPreferences.selectedSports.length > 0) ||
            (this.userPreferences.selectedTeams && this.userPreferences.selectedTeams.length > 0) ||
            (this.userPreferences.selectedLeagues && this.userPreferences.selectedLeagues.length > 0)
        );
    }

    isUserInterestedInSport(sport) {
        if (!this.userPreferences) return false;
        
        // Check if sport is in selected sports
        const selectedSports = this.userPreferences.selectedSports || [];
        if (selectedSports.some(s => s.toLowerCase() === sport.toLowerCase())) {
            return true;
        }
        
        // Check if any selected teams are from this sport
        const selectedTeams = this.userPreferences.selectedTeams || [];
        if (selectedTeams.some(t => t.sport && t.sport.toLowerCase() === sport.toLowerCase())) {
            return true;
        }
        
        // Check if any selected leagues are from this sport
        const selectedLeagues = this.userPreferences.selectedLeagues || [];
        if (selectedLeagues.some(l => l.sport && l.sport.toLowerCase() === sport.toLowerCase())) {
            return true;
        }
        
        return false;
    }

    groupEventsBySport(events) {
        const grouped = {};
        events.forEach(event => {
            const sport = event.sport || 'Other Sports';
            if (!grouped[sport]) grouped[sport] = [];
            grouped[sport].push(event);
        });
        return grouped;
    }

    getSportEmoji(sport) {
        const emojis = {
            'Soccer': '⚽',
            'Basketball': '🏀',
            'American Football': '🏈',
            'Baseball': '⚾',
            'Tennis': '🎾',
            'Hockey': '🏒',
            'Golf': '⛳',
            'Boxing': '🥊',
            'Football': '⚽',
            'Motorsport': '🏎️'
        };
        return emojis[sport] || '🏆';
    }

    addMessage(content, sender, isRealAI = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Convert markdown-like formatting to HTML
        const formattedContent = this.formatMessage(content);
        messageContent.innerHTML = formattedContent;
        
        // Add AI indicator for bot messages
        if (sender === 'bot') {
            const aiIndicator = document.createElement('div');
            aiIndicator.className = 'ai-indicator';
            aiIndicator.innerHTML = isRealAI 
                ? '<small>🧠 <em>Powered by Gemini 2.5 Pro AI</em></small>'
                : '<small>🤖 <em>Enhanced AI Simulation</em></small>';
            aiIndicator.style.cssText = `
                margin-top: 8px;
                opacity: 0.7;
                font-size: 11px;
                color: ${isRealAI ? '#4ade80' : '#fbbf24'};
            `;
            messageContent.appendChild(aiIndicator);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/^• (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = `
            <span>Thinking</span>
            <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(typingContent);
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        return 'typing-indicator';
    }

    removeTypingIndicator(id) {
        const typingElement = document.getElementById(id);
        if (typingElement) {
            typingElement.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showError(message) {
        const errorText = document.getElementById('error-text');
        if (errorText) {
            errorText.textContent = message;
            this.errorMessage.classList.remove('hidden');
        }
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showLoading() {
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }
}

// Initialize the chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sportsChatbot = new SportsChatbot();
    console.log('🤖 Sports Events Buddy ready!');
});
