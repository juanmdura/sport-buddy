// Sports Events Dashboard JavaScript

class SportsEventsDashboard {
    constructor() {
        this.currentEvents = [];
        this.currentView = 'grid';
        this.userPreferences = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkAuthentication();
        await this.loadUserPreferences();
        
        // If user has preferences, load filtered content, otherwise show welcome
        if (this.hasPreferences()) {
            await this.loadFilteredDashboard();
        } else {
            this.showWelcomeSection();
        }
    }

    bindEvents() {
        // Sport selection
        document.getElementById('sport-select').addEventListener('change', (e) => {
            this.onSportChange(e.target.value);
        });

        // League selection
        document.getElementById('league-select').addEventListener('change', (e) => {
            this.onLeagueChange(e.target.value);
        });

        // Load events button
        document.getElementById('load-events-btn').addEventListener('click', () => {
            this.loadEvents();
        });

        // View toggle buttons
        document.getElementById('grid-view').addEventListener('click', () => {
            this.toggleView('grid');
        });

        document.getElementById('list-view').addEventListener('click', () => {
            this.toggleView('list');
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    async onSportChange(sport) {
        const leagueSelector = document.querySelector('.league-selector');
        const leagueSelect = document.getElementById('league-select');
        const loadBtn = document.getElementById('load-events-btn');

        if (!sport) {
            leagueSelector.style.display = 'none';
            loadBtn.disabled = true;
            this.hideAllSections();
            this.showWelcomeSection();
            return;
        }

        this.showLoading('Loading leagues...');
        this.hideErrorMessage();

        try {
            const response = await fetch(`/api/leagues/${encodeURIComponent(sport)}`);
            const data = await response.json();

            if (data.success && data.leagues.length > 0) {
                // Clear and populate league selector
                leagueSelect.innerHTML = '<option value="">Choose a league...</option>';
                
                data.leagues
                    .sort((a, b) => a.strLeague.localeCompare(b.strLeague))
                    .forEach(league => {
                        const option = document.createElement('option');
                        option.value = league.idLeague;
                        option.textContent = league.strLeague;
                        leagueSelect.appendChild(option);
                    });

                leagueSelector.style.display = 'flex';
                this.hideLoading();
            } else {
                this.showError(`No leagues found for ${sport}`);
                leagueSelector.style.display = 'none';
            }
        } catch (error) {
            this.showError(`Error loading leagues: ${error.message}`);
            leagueSelector.style.display = 'none';
        }

        loadBtn.disabled = true;
    }

    onLeagueChange(leagueId) {
        const loadBtn = document.getElementById('load-events-btn');
        loadBtn.disabled = !leagueId;
    }

    async loadEvents() {
        const leagueId = document.getElementById('league-select').value;
        const sportName = document.getElementById('sport-select').selectedOptions[0].textContent;
        const leagueName = document.getElementById('league-select').selectedOptions[0].textContent;

        if (!leagueId) return;

        this.showLoading(`Loading ${leagueName} events...`);
        this.hideErrorMessage();
        this.hideAllSections();

        try {
            const response = await fetch(`/api/events/league/${leagueId}`);
            const data = await response.json();

            if (data.success && data.events.length > 0) {
                this.currentEvents = data.events;
                this.hideLoading();
                this.showStats(data.events);
                this.displayEvents(data.events, leagueName);
            } else {
                this.showError(data.message || `No events found for ${leagueName}`);
            }
        } catch (error) {
            this.showError(`Error loading events: ${error.message}`);
        }
    }

    displayEvents(events, leagueName) {
        const eventsSection = document.getElementById('events-section');
        const eventsGrid = document.getElementById('events-grid');

        // Clear previous events
        eventsGrid.innerHTML = '';

        // Sort events by date (most recent first)
        const sortedEvents = events.sort((a, b) => {
            const dateA = new Date(a.date || '1900-01-01');
            const dateB = new Date(b.date || '1900-01-01');
            return dateB - dateA;
        });

        // Create event cards
        sortedEvents.forEach(event => {
            const eventCard = this.createEventCard(event);
            eventsGrid.appendChild(eventCard);
        });

        eventsSection.style.display = 'block';
        
        // Update section header
        const sectionTitle = eventsSection.querySelector('h2');
        sectionTitle.innerHTML = `<i class="fas fa-calendar-check"></i> ${leagueName} Events (${events.length})`;
    }

    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';

        // Determine event status
        const eventDate = new Date(event.date || '1900-01-01');
        const today = new Date();
        let status = 'upcoming';
        let statusClass = 'status-upcoming';

        if (event.homeScore !== null && event.awayScore !== null) {
            status = 'completed';
            statusClass = 'status-completed';
        } else if (eventDate.toDateString() === today.toDateString()) {
            status = 'live';
            statusClass = 'status-live';
        }

        card.innerHTML = `
            <div class="event-header">
                <div>
                    <div class="event-title">${event.name}</div>
                    <div class="event-league">${event.league || 'Unknown League'}</div>
                </div>
                <div class="event-status ${statusClass}">${status}</div>
            </div>
            
            <div class="event-details">
                ${event.date ? `
                    <div class="event-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(event.date)}</span>
                    </div>
                ` : ''}
                
                ${event.time ? `
                    <div class="event-detail">
                        <i class="fas fa-clock"></i>
                        <span>${event.time}</span>
                    </div>
                ` : ''}
                
                ${event.venue ? `
                    <div class="event-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.venue}</span>
                    </div>
                ` : ''}
                
                ${event.season ? `
                    <div class="event-detail">
                        <i class="fas fa-trophy"></i>
                        <span>Season ${event.season}</span>
                    </div>
                ` : ''}
            </div>
            
            ${event.homeScore !== null && event.awayScore !== null ? `
                <div class="event-score">
                    <div class="score-display">${event.homeScore} - ${event.awayScore}</div>
                    <div class="teams">${event.homeTeam} vs ${event.awayTeam}</div>
                </div>
            ` : ''}
        `;

        return card;
    }

    showStats(events) {
        const statsSection = document.getElementById('stats-section');
        const totalEvents = document.getElementById('total-events');
        const completedEvents = document.getElementById('completed-events');
        const upcomingEvents = document.getElementById('upcoming-events');

        if (statsSection && totalEvents && completedEvents && upcomingEvents) {
            const completed = events.filter(event => 
                event.homeScore !== null && event.awayScore !== null
            ).length;
            
            const upcoming = events.length - completed;

            totalEvents.textContent = events.length;
            completedEvents.textContent = completed;
            upcomingEvents.textContent = upcoming;

            statsSection.style.display = 'block';
        }
    }

    toggleView(view) {
        this.currentView = view;
        const eventsGrid = document.getElementById('events-grid');
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');

        if (view === 'grid') {
            eventsGrid.classList.remove('list-view');
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            eventsGrid.classList.add('list-view');
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        if (loading) {
            const loadingText = loading.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'flex';
        }
        this.hideLoading();
    }

    hideErrorMessage() {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    showWelcomeSection() {
        const welcomeSection = document.getElementById('welcome-section');
        if (welcomeSection) {
            welcomeSection.style.display = 'block';
        }
    }

    hideAllSections() {
        const welcomeSection = document.getElementById('welcome-section');
        const eventsSection = document.getElementById('events-section');
        const statsSection = document.getElementById('stats-section');
        
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (eventsSection) eventsSection.style.display = 'none';
        if (statsSection) statsSection.style.display = 'none';
    }

    formatDate(dateString) {
        if (!dateString) return 'Date TBA';
        
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        
        return date.toLocaleDateString('en-US', options);
    }

    // New methods for user preferences and filtered content

    async loadUserPreferences() {
        try {
            const response = await fetch('/api/preferences');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.userPreferences = data.preferences;
                }
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    hasPreferences() {
        return this.userPreferences && 
               (this.userPreferences.selectedSports.length > 0 || 
                this.userPreferences.selectedLeagues.length > 0 ||
                this.userPreferences.selectedTeams.length > 0);
    }

    async loadFilteredDashboard() {
        this.showLoading('Loading your personalized sports content...');
        this.hideErrorMessage();
        this.hideAllSections();

        try {
            const response = await fetch('/api/dashboard/filtered');
            const data = await response.json();

            if (data.success) {
                this.currentEvents = data.events || [];
                this.hideLoading();
                
                if (this.currentEvents.length > 0) {
                    this.showStats(this.currentEvents);
                    this.displayFilteredEvents(this.currentEvents);
                } else {
                    this.showEmptyPreferencesState();
                }
            } else {
                this.showError(data.message || 'Error loading personalized content');
            }
        } catch (error) {
            this.showError('Error loading personalized content: ' + error.message);
        }
    }

    displayFilteredEvents(events) {
        const eventsSection = document.getElementById('events-section');
        const eventsGrid = document.getElementById('events-grid');

        // Clear previous events
        eventsGrid.innerHTML = '';

        // Sort events by date (most recent first)
        const sortedEvents = events.sort((a, b) => {
            const dateA = new Date(a.date || '1900-01-01');
            const dateB = new Date(b.date || '1900-01-01');
            return dateB - dateA;
        });

        // Create event cards
        sortedEvents.forEach(event => {
            const eventCard = this.createEventCard(event);
            eventsGrid.appendChild(eventCard);
        });

        eventsSection.style.display = 'block';
        
        // Update section header for filtered content
        const sectionTitle = eventsSection.querySelector('h2');
        sectionTitle.innerHTML = `<i class="fas fa-heart"></i> Your Followed Events (${events.length})`;

        // Hide the sport/league selectors since we're showing filtered content
        const navSection = document.querySelector('.nav-section');
        navSection.style.display = 'none';
    }

    showEmptyPreferencesState() {
        const eventsSection = document.getElementById('events-section');
        const eventsGrid = document.getElementById('events-grid');

        eventsGrid.innerHTML = `
            <div class="empty-preferences-state">
                <div class="empty-content">
                    <i class="fas fa-heart-broken"></i>
                    <h3>No events found for your preferences</h3>
                    <p>The sports and leagues you selected don't have any current events.</p>
                    <div class="empty-actions">
                        <a href="preferences.html" class="btn btn-primary">
                            <i class="fas fa-cog"></i> Update Preferences
                        </a>
                        <button class="btn btn-secondary" onclick="window.location.reload()">
                            <i class="fas fa-refresh"></i> Refresh
                        </button>
                    </div>
                </div>
            </div>
        `;

        eventsSection.style.display = 'block';
        
        const sectionTitle = eventsSection.querySelector('h2');
        sectionTitle.innerHTML = `<i class="fas fa-heart"></i> Your Followed Events`;

        // Hide the sport/league selectors
        const navSection = document.querySelector('.nav-section');
        navSection.style.display = 'none';
    }

    // Override showWelcomeSection to include preferences info
    showWelcomeSection() {
        const welcomeSection = document.getElementById('welcome-section');
        const welcomeContent = welcomeSection.querySelector('.welcome-content');
        
        // Update welcome content to include preferences link
        welcomeContent.innerHTML = `
            <i class="fas fa-sports"></i>
            <h2>Welcome to Sports Events Dashboard</h2>
            <p>Set up your preferences to see personalized content, or browse all sports below</p>
            <div class="welcome-actions">
                <a href="preferences.html" class="btn btn-primary">
                    <i class="fas fa-cog"></i> Set Preferences
                </a>
            </div>
            <div class="features">
                <div class="feature">
                    <i class="fas fa-globe"></i>
                    <span>Live Sports Data</span>
                </div>
                <div class="feature">
                    <i class="fas fa-mobile-alt"></i>
                    <span>Mobile Responsive</span>
                </div>
                <div class="feature">
                    <i class="fas fa-lightning-bolt"></i>
                    <span>Real-time Updates</span>
                </div>
            </div>
        `;
        
        welcomeSection.style.display = 'block';

        // Show the sport/league selectors for manual browsing
        const navSection = document.querySelector('.nav-section');
        navSection.style.display = 'block';
    }

    // Authentication methods

    async checkAuthentication() {
        try {
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.showUserInfo(data.user);
                } else {
                    // Not authenticated, redirect to login
                    window.location.href = '/login';
                }
            } else {
                // Not authenticated, redirect to login
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            window.location.href = '/login';
        }
    }

    showUserInfo(user) {
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        const pageTitle = document.getElementById('page-title');
        
        if (userInfo && userName) {
            userName.textContent = user.displayName || user.username;
            userInfo.style.display = 'flex';
        }

        // Update page title with user's name
        if (pageTitle) {
            pageTitle.textContent = `Sports Buddy for ${user.displayName || user.username}`;
        }
    }

    async handleLogout() {
        try {
            this.showLoading('Logging out...');
            
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                // Redirect to login page
                window.location.href = '/login';
            } else {
                this.hideLoading();
                this.showError('Logout failed. Please try again.');
            }
        } catch (error) {
            this.hideLoading();
            console.error('Logout error:', error);
            this.showError('Logout failed. Please try again.');
        }
    }
}

// Utility functions for additional features
const Utils = {
    // Debounce function to limit API calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Format score display
    formatScore(homeScore, awayScore) {
        if (homeScore === null || awayScore === null) {
            return 'vs';
        }
        return `${homeScore} - ${awayScore}`;
    },

    // Get team colors or default colors
    getTeamColors(teamName) {
        const teamColors = {
            'Arsenal': '#DC143C',
            'Chelsea': '#034694',
            'Liverpool': '#C8102E',
            'Manchester United': '#DA020E',
            'Manchester City': '#6CABDD',
            'Tottenham': '#132257'
        };
        return teamColors[teamName] || '#667eea';
    }
};

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SportsEventsDashboard();
    console.log('🏆 Sports Events Dashboard initialized');
});
