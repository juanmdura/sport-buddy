// Sports Preferences Manager

class PreferencesManager {
    constructor() {
        this.selectedSports = new Set();
        this.selectedTeams = new Set();
        this.selectedLeagues = new Set();
        this.availableSports = [];
        this.searchResults = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkAuthentication();
        await this.loadPreferences();
        await this.loadAvailableSports();
        this.renderSports();
    }

    bindEvents() {
        // Reset preferences button
        document.getElementById('reset-preferences-btn').addEventListener('click', () => {
            this.resetPreferences();
        });

        // Team search
        document.getElementById('search-teams-btn').addEventListener('click', () => {
            this.searchTeams();
        });

        // Allow Enter key for team search
        document.getElementById('team-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchTeams();
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Fili y Tizi Requirements - New Event Handlers
        
        // Filters functionality
        document.getElementById('sport-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Collapsible sections
        document.querySelectorAll('.section-header.clickable').forEach(header => {
            header.addEventListener('click', (e) => {
                this.toggleSection(e.currentTarget.dataset.section);
            });
        });
    }

    async loadPreferences() {
        try {
            const response = await fetch('/api/preferences');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.selectedSports = new Set(data.preferences.selectedSports || []);
                    this.selectedTeams = new Set(data.preferences.selectedTeams || []);
                    this.selectedLeagues = new Set(data.preferences.selectedLeagues || []);
                }
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    async loadAvailableSports() {
        this.showLoading('Loading available sports...');
        
        try {
            const response = await fetch('/api/sports');
            if (response.ok) {
                const data = await response.json();
                console.log('Sports API response:', data); // Debug log
                
                if (data.success && data.sports) {
                    this.availableSports = data.sports;
                    console.log('Available sports loaded:', this.availableSports.length, 'sports'); // Debug log
                    this.hideLoading();
                    return;
                }
            }
            
            // If API fails, show error
            this.hideLoading();
            this.showError('Failed to load sports from API. Please try again.');
            
        } catch (error) {
            console.error('Error loading sports:', error);
            this.hideLoading();
            this.showError('Error loading sports: ' + error.message);
        }
    }

    renderSports() {
        const sportsGrid = document.getElementById('sports-grid');
        sportsGrid.innerHTML = '';

        console.log('Rendering sports:', this.availableSports.length, 'sports available'); // Debug log
        console.log('Sports data:', this.availableSports); // Debug log

        if (this.availableSports.length === 0) {
            sportsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No sports available</h3>
                    <p>Unable to load sports from the API</p>
                </div>
            `;
            return;
        }

        this.availableSports.forEach((sport, index) => {
            console.log(`Rendering sport ${index + 1}:`, sport); // Debug log
            
            const sportElement = this.createSelectableItem(
                sport.id,
                sport.icon,
                sport.name,
                'Select to follow this sport',
                this.selectedSports.has(sport.id)
            );

            sportElement.addEventListener('click', () => {
                this.toggleSportSelection(sport.id);
                this.updateLeaguesDisplay();
                this.updateTeamsFromSports();
            });

            sportsGrid.appendChild(sportElement);
        });

        // Update leagues display after rendering sports
        this.updateLeaguesDisplay();
    }

    async updateLeaguesDisplay() {
        const leaguesGrid = document.getElementById('leagues-grid');
        leaguesGrid.innerHTML = '';

        if (this.selectedSports.size === 0) {
            leaguesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>Select sports first</h3>
                    <p>Choose sports above to see available leagues</p>
                </div>
            `;
            return;
        }

        this.showLoading('Loading leagues...');

        try {
            // Get leagues for selected sports
            const leaguesPromises = Array.from(this.selectedSports).map(async (sportId) => {
                // Find the original sport name from our available sports
                const sport = this.availableSports.find(s => s.id === sportId);
                const sportName = sport ? sport.originalName || sport.name : sportId;
                
                const response = await fetch(`/api/leagues/${encodeURIComponent(sportName)}`);
                if (response.ok) {
                    const data = await response.json();
                    return data.success ? data.leagues : [];
                }
                return [];
            });

            const allLeagues = await Promise.all(leaguesPromises);
            const flatLeagues = allLeagues.flat();

            this.hideLoading();

            if (flatLeagues.length === 0) {
                leaguesGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No leagues found</h3>
                        <p>No leagues available for selected sports</p>
                    </div>
                `;
                return;
            }

            // Remove duplicates and sort
            const uniqueLeagues = flatLeagues.filter((league, index, self) => 
                index === self.findIndex(l => l.idLeague === league.idLeague)
            ).sort((a, b) => a.strLeague.localeCompare(b.strLeague));

            uniqueLeagues.forEach(league => {
                const leagueElement = this.createLeagueCard(league);
                leagueElement.addEventListener('click', () => {
                    this.toggleLeagueSelection(league.idLeague);
                });
                leaguesGrid.appendChild(leagueElement);
            });

        } catch (error) {
            this.hideLoading();
            this.showError('Error loading leagues: ' + error.message);
        }
    }

    async searchTeams() {
        const searchTerm = document.getElementById('team-search').value.trim();
        const resultsContainer = document.getElementById('teams-results');

        if (!searchTerm) {
            this.showError('Please enter a team name to search');
            return;
        }

        this.showLoading('Searching teams...');
        resultsContainer.innerHTML = '';

        try {
            const response = await fetch(`/api/teams/search/${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            this.hideLoading();

            if (data.success && data.teams && data.teams.length > 0) {
                data.teams.forEach(team => {
                    const teamElement = this.createTeamCard(team);
                    teamElement.addEventListener('click', () => {
                        this.toggleTeamSelection(team);
                    });
                    resultsContainer.appendChild(teamElement);
                });
            } else {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No teams found</h3>
                        <p>Try searching with different keywords</p>
                    </div>
                `;
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Error searching teams: ' + error.message);
        }
    }

    createSelectableItem(id, icon, name, description, isSelected = false) {
        const item = document.createElement('div');
        item.className = `selectable-item ${isSelected ? 'selected' : ''}`;
        item.dataset.id = id;

        item.innerHTML = `
            <span class="item-icon">${icon}</span>
            <div class="item-name">${name}</div>
            <div class="item-description">${description}</div>
        `;

        return item;
    }

    createTeamCard(team) {
        const card = document.createElement('div');
        card.className = `team-card ${this.selectedTeams.has(team.idTeam) ? 'selected' : ''}`;
        card.dataset.teamId = team.idTeam;

        card.innerHTML = `
            ${team.strTeamBadge ? `<img src="${team.strTeamBadge}" alt="${team.strTeam}" class="team-logo">` : '<div class="team-logo">🏆</div>'}
            <div class="team-name">${team.strTeam}</div>
            <div class="team-sport">${team.strSport || 'Unknown Sport'}</div>
        `;

        return card;
    }

    createLeagueCard(league) {
        const card = document.createElement('div');
        card.className = `league-card ${this.selectedLeagues.has(league.idLeague) ? 'selected' : ''}`;
        card.dataset.leagueId = league.idLeague;

        card.innerHTML = `
            ${league.strLogo ? `<img src="${league.strLogo}" alt="${league.strLeague}" class="league-logo">` : '<div class="league-logo">🏆</div>'}
            <div class="league-name">${league.strLeague}</div>
            <div class="league-sport">${league.strSport || 'Unknown Sport'}</div>
        `;

        return card;
    }

    toggleSportSelection(sportId) {
        const sportElement = document.querySelector(`[data-id="${sportId}"]`);
        
        if (this.selectedSports.has(sportId)) {
            this.selectedSports.delete(sportId);
            sportElement.classList.remove('selected');
        } else {
            this.selectedSports.add(sportId);
            sportElement.classList.add('selected');
        }
        
        // Auto-save when selection changes
        this.autoSavePreferences();
    }

    toggleTeamSelection(team) {
        const teamElement = document.querySelector(`[data-team-id="${team.idTeam}"]`);
        
        if (this.selectedTeams.has(team.idTeam)) {
            this.selectedTeams.delete(team.idTeam);
            teamElement.classList.remove('selected');
        } else {
            this.selectedTeams.add(team.idTeam);
            teamElement.classList.add('selected');
        }
        
        this.updateSelectedTeamsDisplay();
        
        // Auto-save when selection changes
        this.autoSavePreferences();
    }

    toggleLeagueSelection(leagueId) {
        const leagueElement = document.querySelector(`[data-league-id="${leagueId}"]`);
        
        if (this.selectedLeagues.has(leagueId)) {
            this.selectedLeagues.delete(leagueId);
            leagueElement.classList.remove('selected');
        } else {
            this.selectedLeagues.add(leagueId);
            leagueElement.classList.add('selected');
        }
        
        // Auto-save when selection changes
        this.autoSavePreferences();
    }

    updateSelectedTeamsDisplay() {
        const selectedTeamsContainer = document.getElementById('selected-teams');
        selectedTeamsContainer.innerHTML = '';

        if (this.selectedTeams.size === 0) {
            selectedTeamsContainer.innerHTML = '<p class="empty-state">No teams selected</p>';
            return;
        }

        this.selectedTeams.forEach(teamId => {
            const teamElement = document.querySelector(`[data-team-id="${teamId}"]`);
            if (teamElement) {
                const teamName = teamElement.querySelector('.team-name').textContent;
                const tag = this.createSelectedItemTag(teamName, () => {
                    this.selectedTeams.delete(teamId);
                    teamElement.classList.remove('selected');
                    this.updateSelectedTeamsDisplay();
                    // Auto-save when team is removed
                    this.autoSavePreferences();
                });
                selectedTeamsContainer.appendChild(tag);
            }
        });
    }

    createSelectedItemTag(name, onRemove) {
        const tag = document.createElement('div');
        tag.className = 'selected-item-tag';
        
        tag.innerHTML = `
            <span>${name}</span>
            <button class="remove-item" type="button">×</button>
        `;

        tag.querySelector('.remove-item').addEventListener('click', onRemove);
        return tag;
    }

    async savePreferences() {
        try {
            const preferences = {
                selectedSports: Array.from(this.selectedSports),
                selectedTeams: Array.from(this.selectedTeams),
                selectedLeagues: Array.from(this.selectedLeagues)
            };

            const response = await fetch('/api/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preferences })
            });

            const data = await response.json();

            if (data.success) {
                return { success: true };
            } else {
                throw new Error(data.message || 'Error saving preferences');
            }
        } catch (error) {
            throw error;
        }
    }

    // Auto-save preferences with visual feedback
    autoSavePreferences() {
        // Debounce the auto-save to avoid too many requests
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(async () => {
            try {
                // Show subtle saving indicator
                this.showAutoSaveIndicator('Saving...');
                
                await this.savePreferences();
                
                // Show success briefly
                this.showAutoSaveIndicator('Saved ✓', true);
                
                // Hide indicator after 2 seconds
                setTimeout(() => {
                    this.hideAutoSaveIndicator();
                }, 2000);
                
            } catch (error) {
                console.error('Auto-save failed:', error);
                this.showAutoSaveIndicator('Save failed ✗', false);
                
                // Hide error after 3 seconds
                setTimeout(() => {
                    this.hideAutoSaveIndicator();
                }, 3000);
            }
        }, 500); // 500ms debounce
    }

    resetPreferences() {
        if (confirm('Are you sure you want to reset all preferences? This will clear all your selected sports, teams, and leagues.')) {
            this.selectedSports.clear();
            this.selectedTeams.clear();
            this.selectedLeagues.clear();

            // Update UI
            document.querySelectorAll('.selectable-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            document.querySelectorAll('.team-card.selected').forEach(item => {
                item.classList.remove('selected');
            });
            document.querySelectorAll('.league-card.selected').forEach(item => {
                item.classList.remove('selected');
            });

            this.updateSelectedTeamsDisplay();
            this.updateLeaguesDisplay();
            
            // Auto-save the reset
            this.autoSavePreferences();
            
            this.showSuccess('All preferences have been reset and saved!');
        }
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        const loadingText = loading.querySelector('p');
        loadingText.textContent = message;
        loading.style.display = 'block';
        this.hideMessages();
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        this.hideLoading();
        setTimeout(() => this.hideMessages(), 5000);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        const successText = document.getElementById('success-text');
        successText.textContent = message;
        successDiv.style.display = 'flex';
        this.hideLoading();
        setTimeout(() => this.hideMessages(), 3000);
    }

    hideMessages() {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';
    }

    // Auto-save indicator methods
    showAutoSaveIndicator(message, isSuccess = null) {
        const autoSaveInfo = document.querySelector('.auto-save-info span');
        if (autoSaveInfo) {
            autoSaveInfo.textContent = message;
            
            const container = document.querySelector('.auto-save-info');
            if (container) {
                // Remove previous state classes
                container.classList.remove('saving', 'success', 'error');
                
                if (isSuccess === true) {
                    container.classList.add('success');
                } else if (isSuccess === false) {
                    container.classList.add('error');
                } else {
                    container.classList.add('saving');
                }
            }
        }
    }

    hideAutoSaveIndicator() {
        const autoSaveInfo = document.querySelector('.auto-save-info span');
        const container = document.querySelector('.auto-save-info');
        
        if (autoSaveInfo && container) {
            autoSaveInfo.textContent = 'Your preferences are saved automatically';
            container.classList.remove('saving', 'success', 'error');
        }
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
            pageTitle.textContent = `${user.displayName || user.username}'s Sports Preferences`;
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

    // FILI Y TIZI REQUIREMENTS - New Methods

    // Filters functionality
    populateFilterOptions() {
        const sportFilter = document.getElementById('sport-filter');
        
        // Clear existing options (except "All Sports")
        sportFilter.innerHTML = '<option value="">All Sports</option>';
        
        // Add available sports as filter options
        this.availableSports.forEach(sport => {
            const option = document.createElement('option');
            option.value = sport.id;
            option.textContent = sport.name;
            sportFilter.appendChild(option);
        });
    }

    applyFilters() {
        const sportFilter = document.getElementById('sport-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        // Filter sports
        this.filterSports(sportFilter, statusFilter);
        
        // Filter teams 
        this.filterTeams(sportFilter, statusFilter);
        
        // Filter leagues
        this.filterLeagues(sportFilter, statusFilter);
    }

    filterSports(sportFilter, statusFilter) {
        const sportsGrid = document.getElementById('sports-grid');
        const sportCards = sportsGrid.querySelectorAll('.selectable-item');
        
        sportCards.forEach(card => {
            const sportId = card.dataset.id;
            const isSelected = card.classList.contains('selected');
            
            let showCard = true;
            
            // Apply sport filter
            if (sportFilter && sportId !== sportFilter) {
                showCard = false;
            }
            
            // Apply status filter
            if (statusFilter === 'selected' && !isSelected) {
                showCard = false;
            } else if (statusFilter === 'available' && isSelected) {
                showCard = false;
            }
            
            card.style.display = showCard ? 'block' : 'none';
        });
    }

    filterTeams(sportFilter, statusFilter) {
        const teamsGrid = document.getElementById('teams-from-sports');
        const teamCards = teamsGrid.querySelectorAll('.team-card');
        
        teamCards.forEach(card => {
            const isSelected = card.classList.contains('selected');
            
            let showCard = true;
            
            // Apply status filter
            if (statusFilter === 'selected' && !isSelected) {
                showCard = false;
            } else if (statusFilter === 'available' && isSelected) {
                showCard = false;
            }
            
            card.style.display = showCard ? 'block' : 'none';
        });
    }

    filterLeagues(sportFilter, statusFilter) {
        const leaguesGrid = document.getElementById('leagues-grid');
        const leagueCards = leaguesGrid.querySelectorAll('.league-card');
        
        leagueCards.forEach(card => {
            const isSelected = card.classList.contains('selected');
            
            let showCard = true;
            
            // Apply status filter
            if (statusFilter === 'selected' && !isSelected) {
                showCard = false;
            } else if (statusFilter === 'available' && isSelected) {
                showCard = false;
            }
            
            card.style.display = showCard ? 'block' : 'none';
        });
    }

    clearFilters() {
        document.getElementById('sport-filter').value = '';
        document.getElementById('status-filter').value = '';
        
        // Show all items
        document.querySelectorAll('.selectable-item, .team-card, .league-card').forEach(item => {
            item.style.display = 'block';
        });
    }

    // Collapsible sections functionality
    toggleSection(sectionName) {
        const section = document.querySelector(`[data-section="${sectionName}"]`).closest('.collapsible-section');
        const isCollapsed = section.classList.contains('collapsed');
        
        if (isCollapsed) {
            section.classList.remove('collapsed');
        } else {
            section.classList.add('collapsed');
        }
    }

    // Teams from selected sports functionality
    async updateTeamsFromSports() {
        const teamsFromSportsGrid = document.getElementById('teams-from-sports');
        teamsFromSportsGrid.innerHTML = '';

        if (this.selectedSports.size === 0) {
            teamsFromSportsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-futbol"></i>
                    <h3>Select sports first</h3>
                    <p>Choose sports above to see teams automatically</p>
                </div>
            `;
            return;
        }

        this.showLoading('Loading teams from your selected sports...');

        try {
            // Get teams for each selected sport
            const teamsPromises = Array.from(this.selectedSports).map(async (sportId) => {
                const sport = this.availableSports.find(s => s.id === sportId);
                const sportName = sport ? sport.originalName || sport.name : sportId;
                
                try {
                    console.log(`Fetching teams for sport: ${sportName}`);
                    const response = await fetch(`/api/teams/sport/${encodeURIComponent(sportName)}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Teams response for ${sportName}:`, data);
                        
                        if (data.success && data.teams && data.teams.length > 0) {
                            return data.teams;
                        } else {
                            console.log(`No teams found for ${sportName}: ${data.message}`);
                            return [];
                        }
                    } else {
                        console.error(`Failed to fetch teams for ${sportName}: ${response.status}`);
                        return [];
                    }
                } catch (error) {
                    console.error(`Error fetching teams for ${sportName}:`, error);
                    return [];
                }
            });

            const allTeams = await Promise.all(teamsPromises);
            const flatTeams = allTeams.flat();

            this.hideLoading();

            console.log(`Total teams found: ${flatTeams.length}`);

            if (flatTeams.length === 0) {
                // Show a more helpful message when no teams are found
                const selectedSportsNames = Array.from(this.selectedSports).map(sportId => {
                    const sport = this.availableSports.find(s => s.id === sportId);
                    return sport ? sport.name : sportId;
                }).join(', ');

                teamsFromSportsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-info-circle"></i>
                        <h3>Loading teams...</h3>
                        <p>We're looking for teams in: ${selectedSportsNames}</p>
                        <p>This may take a moment as we search through leagues.</p>
                        <div class="retry-section">
                            <button class="btn btn-secondary" onclick="window.preferencesManager.updateTeamsFromSports()">
                                <i class="fas fa-refresh"></i> Try Again
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            // Remove duplicates and sort
            const uniqueTeams = flatTeams.filter((team, index, self) => 
                index === self.findIndex(t => t.idTeam === team.idTeam)
            ).sort((a, b) => a.strTeam.localeCompare(b.strTeam));

            console.log(`Rendering ${uniqueTeams.length} unique teams`);

            uniqueTeams.forEach(team => {
                const teamElement = this.createTeamCard(team);
                teamElement.addEventListener('click', () => {
                    this.toggleTeamSelection(team);
                });
                teamsFromSportsGrid.appendChild(teamElement);
            });

        } catch (error) {
            this.hideLoading();
            console.error('Error loading teams from sports:', error);
            teamsFromSportsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading teams</h3>
                    <p>Unable to load teams for selected sports. Please check your connection and try again.</p>
                    <div class="retry-section">
                        <button class="btn btn-secondary" onclick="window.preferencesManager.updateTeamsFromSports()">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Enhanced search functionality (now for additional teams)
    async searchTeams() {
        const searchTerm = document.getElementById('team-search').value.trim();
        const resultsContainer = document.getElementById('teams-search-results');

        if (!searchTerm) {
            this.showError('Please enter a team name to search');
            return;
        }

        this.showLoading('Searching for additional teams...');
        resultsContainer.innerHTML = '';

        try {
            const response = await fetch(`/api/teams/search/${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            this.hideLoading();

            if (data.success && data.teams && data.teams.length > 0) {
                data.teams.forEach(team => {
                    const teamElement = this.createTeamCard(team);
                    teamElement.addEventListener('click', () => {
                        this.toggleTeamSelection(team);
                    });
                    resultsContainer.appendChild(teamElement);
                });
            } else {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No additional teams found</h3>
                        <p>Try searching with different keywords</p>
                    </div>
                `;
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Error searching for additional teams: ' + error.message);
        }
    }

    // Override the renderSports method to populate filters
    renderSports() {
        const sportsGrid = document.getElementById('sports-grid');
        sportsGrid.innerHTML = '';

        console.log('Rendering sports:', this.availableSports.length, 'sports available');

        if (this.availableSports.length === 0) {
            sportsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No sports available</h3>
                    <p>Unable to load sports from the API</p>
                </div>
            `;
            return;
        }

        this.availableSports.forEach((sport, index) => {
            const sportElement = this.createSelectableItem(
                sport.id,
                sport.icon,
                sport.name,
                'Select to follow this sport',
                this.selectedSports.has(sport.id)
            );

            sportElement.addEventListener('click', () => {
                this.toggleSportSelection(sport.id);
                this.updateLeaguesDisplay();
                this.updateTeamsFromSports();
            });

            sportsGrid.appendChild(sportElement);
        });

        // Populate filter options after rendering sports
        this.populateFilterOptions();
        
        // Update leagues and teams display after rendering sports
        this.updateLeaguesDisplay();
        this.updateTeamsFromSports();
    }
}

// Initialize the preferences manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.preferencesManager = new PreferencesManager();
    console.log('🔧 Sports Preferences Manager initialized');
});
