// Sports Preferences Manager

class PreferencesManager {
    constructor() {
        this.selectedSports = new Set();
        this.selectedTeams = new Map(); // Changed to Map to store team objects
        this.selectedLeagues = new Map(); // Changed to Map to store league objects
        this.availableSports = [];
        this.availableTeams = []; // Store all teams
        this.availableLeagues = []; // Store all leagues
        this.searchResults = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkAuthentication();
        await this.loadPreferences();
        await this.loadAvailableSports();
        this.renderSports();
        await this.loadAllTeams();
        await this.loadAllLeagues();
        this.updateChipsDisplay();
    }

    bindEvents() {
        // Reset preferences button
        document.getElementById('reset-preferences-btn').addEventListener('click', () => {
            this.resetPreferences();
        });

        // Remove the search teams button since we now filter in real-time
        // (search functionality is now handled by the real-time filter inputs)

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

        // Search functionality
        this.bindSearchEvents();
    }

    bindSearchEvents() {
        // Sports search
        const sportsSearch = document.getElementById('sports-search');
        const clearSportsSearch = document.getElementById('clear-sports-search');
        
        if (sportsSearch) {
            sportsSearch.addEventListener('input', (e) => {
                this.filterSports(e.target.value);
                this.toggleClearButton(e.target.value, clearSportsSearch);
            });
            
            sportsSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch('sports');
                }
            });
        }
        
        if (clearSportsSearch) {
            clearSportsSearch.addEventListener('click', () => {
                this.clearSearch('sports');
            });
        }

        // Teams search
        const teamsSearch = document.getElementById('teams-search');
        const clearTeamsSearch = document.getElementById('clear-teams-search');
        
        if (teamsSearch) {
            teamsSearch.addEventListener('input', (e) => {
                this.filterTeams(e.target.value);
                this.toggleClearButton(e.target.value, clearTeamsSearch);
            });
            
            teamsSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch('teams');
                }
            });
        }
        
        if (clearTeamsSearch) {
            clearTeamsSearch.addEventListener('click', () => {
                this.clearSearch('teams');
            });
        }

        // Leagues search
        const leaguesSearch = document.getElementById('leagues-search');
        const clearLeaguesSearch = document.getElementById('clear-leagues-search');
        
        if (leaguesSearch) {
            leaguesSearch.addEventListener('input', (e) => {
                this.filterLeagues(e.target.value);
                this.toggleClearButton(e.target.value, clearLeaguesSearch);
            });
            
            leaguesSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch('leagues');
                }
            });
        }
        
        if (clearLeaguesSearch) {
            clearLeaguesSearch.addEventListener('click', () => {
                this.clearSearch('leagues');
            });
        }
    }

    async loadPreferences() {
        try {
            const response = await fetch('/api/preferences');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.selectedSports = new Set(data.preferences.selectedSports || []);
                    
                    // Handle both old format (array of IDs) and new format (array of objects)
                    this.selectedTeams = new Map();
                    if (data.preferences.selectedTeams) {
                        data.preferences.selectedTeams.forEach(team => {
                            if (typeof team === 'string') {
                                // Old format - just ID
                                this.selectedTeams.set(team, { id: team, name: `Team ${team}` });
                            } else {
                                // New format - object with id and name
                                this.selectedTeams.set(team.id, team);
                            }
                        });
                    }
                    
                    this.selectedLeagues = new Map();
                    if (data.preferences.selectedLeagues) {
                        data.preferences.selectedLeagues.forEach(league => {
                            if (typeof league === 'string') {
                                // Old format - just ID
                                this.selectedLeagues.set(league, { id: league, name: `League ${league}` });
                            } else {
                                // New format - object with id and name
                                this.selectedLeagues.set(league.id, league);
                            }
                        });
                    }
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

    async loadAllTeams() {
        this.showLoading('Loading all teams...');
        this.availableTeams = [];
        
        try {
            // Get all sports first
            if (this.availableSports.length === 0) {
                this.hideLoading();
                return;
            }

            // Load teams from multiple popular sports
            const popularSports = this.availableSports.slice(0, 10); // Get first 10 sports
            const teamsPromises = popularSports.map(async (sport) => {
                try {
                    const sportName = sport.originalName || sport.name;
                    const response = await fetch(`/api/teams/sport/${encodeURIComponent(sportName)}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.teams && data.teams.length > 0) {
                            return data.teams;
                        }
                    }
                } catch (error) {
                    console.error(`Error loading teams for ${sport.name}:`, error);
                }
                return [];
            });

            const allTeams = await Promise.all(teamsPromises);
            const flatTeams = allTeams.flat();

            // Remove duplicates and sort
            this.availableTeams = flatTeams.filter((team, index, self) => 
                index === self.findIndex(t => t.idTeam === team.idTeam)
            ).sort((a, b) => a.strTeam.localeCompare(b.strTeam));

            console.log(`Loaded ${this.availableTeams.length} teams`);
            this.renderAllTeams();
            this.hideLoading();

        } catch (error) {
            console.error('Error loading all teams:', error);
            this.hideLoading();
            this.showError('Error loading teams: ' + error.message);
        }
    }

    async loadAllLeagues() {
        this.showLoading('Loading all leagues...');
        this.availableLeagues = [];
        
        try {
            // Get all sports first
            if (this.availableSports.length === 0) {
                this.hideLoading();
                return;
            }

            // Load leagues from all sports
            const leaguesPromises = this.availableSports.map(async (sport) => {
                try {
                    const sportName = sport.originalName || sport.name;
                    const response = await fetch(`/api/leagues/${encodeURIComponent(sportName)}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.leagues && data.leagues.length > 0) {
                            return data.leagues;
                        }
                    }
                } catch (error) {
                    console.error(`Error loading leagues for ${sport.name}:`, error);
                }
                return [];
            });

            const allLeagues = await Promise.all(leaguesPromises);
            const flatLeagues = allLeagues.flat();

            // Remove duplicates and sort
            this.availableLeagues = flatLeagues.filter((league, index, self) => 
                index === self.findIndex(l => l.idLeague === league.idLeague)
            ).sort((a, b) => a.strLeague.localeCompare(b.strLeague));

            console.log(`Loaded ${this.availableLeagues.length} leagues`);
            this.renderAllLeagues();
            this.hideLoading();

        } catch (error) {
            console.error('Error loading all leagues:', error);
            this.hideLoading();
            this.showError('Error loading leagues: ' + error.message);
        }
    }

    renderAllTeams() {
        const teamsGrid = document.getElementById('teams-grid');
        teamsGrid.innerHTML = '';

        if (this.availableTeams.length === 0) {
            teamsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No teams available</h3>
                    <p>Unable to load teams from the API</p>
                </div>
            `;
            return;
        }

        this.availableTeams.forEach(team => {
            const teamElement = this.createTeamCard(team);
            teamElement.addEventListener('click', () => {
                this.toggleTeamSelection(team);
            });
            teamsGrid.appendChild(teamElement);
        });
    }

    renderAllLeagues() {
        const leaguesGrid = document.getElementById('leagues-grid');
        leaguesGrid.innerHTML = '';

        if (this.availableLeagues.length === 0) {
            leaguesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No leagues available</h3>
                    <p>Unable to load leagues from the API</p>
                </div>
            `;
            return;
        }

        this.availableLeagues.forEach(league => {
            const leagueElement = this.createLeagueCard(league);
            leagueElement.addEventListener('click', () => {
                this.toggleLeagueSelection(league.idLeague);
            });
            leaguesGrid.appendChild(leagueElement);
        });
    }

    renderSports() {
        const sportsGrid = document.getElementById('sports-grid');
        sportsGrid.innerHTML = '';

        console.log('Rendering sports:', this.availableSports.length, 'sports available'); // Debug log
        console.log('Sports data:', this.availableSports); // Debug log

        // Reset search filters when rendering new content
        this.resetSearchFilters();

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
            });

            sportsGrid.appendChild(sportElement);
        });
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
        
        // Update chips display
        this.updateChipsDisplay();
        
        // Auto-save when selection changes
        this.autoSavePreferences();
    }

    toggleTeamSelection(team) {
        const teamElement = document.querySelector(`[data-team-id="${team.idTeam}"]`);
        
        if (this.selectedTeams.has(team.idTeam)) {
            this.selectedTeams.delete(team.idTeam);
            teamElement.classList.remove('selected');
        } else {
            // Store team object with both id and name
            this.selectedTeams.set(team.idTeam, {
                id: team.idTeam,
                name: team.strTeam,
                sport: team.strSport || 'Unknown Sport'
            });
            teamElement.classList.add('selected');
        }
        
        this.updateSelectedTeamsDisplay();
        
        // Auto-save when selection changes
        this.autoSavePreferences();
        
        // Update chips display
        this.updateChipsDisplay();
    }

    toggleLeagueSelection(leagueId) {
        const leagueElement = document.querySelector(`[data-league-id="${leagueId}"]`);
        
        if (this.selectedLeagues.has(leagueId)) {
            this.selectedLeagues.delete(leagueId);
            leagueElement.classList.remove('selected');
        } else {
            // Store league object with both id and name
            const leagueName = leagueElement.querySelector('.league-name').textContent;
            const leagueSport = leagueElement.querySelector('.league-sport').textContent;
            this.selectedLeagues.set(leagueId, {
                id: leagueId,
                name: leagueName,
                sport: leagueSport
            });
            leagueElement.classList.add('selected');
        }
        
        // Auto-save when selection changes
        this.autoSavePreferences();
        
        // Update chips display
        this.updateChipsDisplay();
    }

    updateSelectedTeamsDisplay() {
        const selectedTeamsContainer = document.getElementById('selected-teams');
        selectedTeamsContainer.innerHTML = '';

        if (this.selectedTeams.size === 0) {
            selectedTeamsContainer.innerHTML = '<p class="empty-state">No teams selected</p>';
            return;
        }

        this.selectedTeams.forEach((teamData, teamId) => {
            const teamElement = document.querySelector(`[data-team-id="${teamId}"]`);
            const teamName = teamData.name;
            const tag = this.createSelectedItemTag(teamName, () => {
                this.selectedTeams.delete(teamId);
                if (teamElement) {
                    teamElement.classList.remove('selected');
                }
                this.updateSelectedTeamsDisplay();
                this.updateChipsDisplay();
                // Auto-save when team is removed
                this.autoSavePreferences();
            });
            selectedTeamsContainer.appendChild(tag);
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
                selectedTeams: Array.from(this.selectedTeams.values()),
                selectedLeagues: Array.from(this.selectedLeagues.values())
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
            this.updateChipsDisplay();
            
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
    }

    // CHIPS MANAGEMENT METHODS

    /**
     * Update the chips display with current selections
     */
    updateChipsDisplay() {
        this.updateSportsChips();
        this.updateTeamsChips();
        this.updateLeaguesChips();
        this.toggleChipsSection();
    }

    /**
     * Create a chip element
     */
    createChip(text, icon, isRemovable = true, onRemove = null) {
        const chip = document.createElement('div');
        chip.className = `chip ${isRemovable ? 'removable' : ''}`;
        
        chip.innerHTML = `
            ${icon ? `<span class="chip-icon">${icon}</span>` : ''}
            <span class="chip-text">${text}</span>
            ${isRemovable ? '<button class="chip-remove" type="button">×</button>' : ''}
        `;

        if (isRemovable && onRemove) {
            const removeBtn = chip.querySelector('.chip-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                chip.classList.add('removing');
                setTimeout(() => {
                    onRemove();
                }, 300);
            });
        }

        return chip;
    }

    /**
     * Update sports chips
     */
    updateSportsChips() {
        const sportsChipsContainer = document.getElementById('sports-chips');
        sportsChipsContainer.innerHTML = '';

        this.selectedSports.forEach(sportId => {
            const sport = this.availableSports.find(s => s.id === sportId);
            if (sport) {
                const chip = this.createChip(
                    sport.name,
                    sport.icon,
                    true,
                    () => {
                        this.selectedSports.delete(sportId);
                        const sportElement = document.querySelector(`[data-id="${sportId}"]`);
                        if (sportElement) {
                            sportElement.classList.remove('selected');
                        }
                        this.updateChipsDisplay();
                        this.autoSavePreferences();
                    }
                );
                sportsChipsContainer.appendChild(chip);
            }
        });
    }

    /**
     * Update teams chips
     */
    updateTeamsChips() {
        const teamsChipsContainer = document.getElementById('teams-chips');
        teamsChipsContainer.innerHTML = '';

        this.selectedTeams.forEach((teamData, teamId) => {
            const teamElement = document.querySelector(`[data-team-id="${teamId}"]`);
            const chip = this.createChip(
                teamData.name,
                '👥',
                true,
                () => {
                    this.selectedTeams.delete(teamId);
                    if (teamElement) {
                        teamElement.classList.remove('selected');
                    }
                    this.updateChipsDisplay();
                    this.updateSelectedTeamsDisplay();
                    this.autoSavePreferences();
                }
            );
            teamsChipsContainer.appendChild(chip);
        });
    }

    /**
     * Update leagues chips
     */
    updateLeaguesChips() {
        const leaguesChipsContainer = document.getElementById('leagues-chips');
        leaguesChipsContainer.innerHTML = '';

        this.selectedLeagues.forEach((leagueData, leagueId) => {
            const leagueElement = document.querySelector(`[data-league-id="${leagueId}"]`);
            const chip = this.createChip(
                leagueData.name,
                '🏆',
                true,
                () => {
                    this.selectedLeagues.delete(leagueId);
                    if (leagueElement) {
                        leagueElement.classList.remove('selected');
                    }
                    this.updateChipsDisplay();
                    this.autoSavePreferences();
                }
            );
            leaguesChipsContainer.appendChild(chip);
        });
    }

    /**
     * Show or hide the chips section based on selections
     */
    toggleChipsSection() {
        const chipsSection = document.getElementById('chips-section');
        const chipsContainer = document.querySelector('.chips-container-horizontal');
        const hasSelections = this.selectedSports.size > 0 || 
                             this.selectedTeams.size > 0 || 
                             this.selectedLeagues.size > 0;
        
        if (hasSelections) {
            chipsSection.style.display = 'block';
            // Remove any empty state message
            const emptyMessage = chipsContainer.querySelector('.chips-empty-all');
            if (emptyMessage) {
                emptyMessage.remove();
            }
        } else {
            chipsSection.style.display = 'none';
        }
    }

    /**
     * Clear all chips and selections
     */
    clearAllSelections() {
        if (confirm('Are you sure you want to clear all selections?')) {
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
            this.updateChipsDisplay();
            this.autoSavePreferences();
        }
    }

    // SEARCH FUNCTIONALITY METHODS

    /**
     * Toggle visibility of clear button based on input value
     */
    toggleClearButton(value, clearButton) {
        if (clearButton) {
            clearButton.style.display = value.trim() ? 'flex' : 'none';
        }
    }

    /**
     * Clear search input and reset filters
     */
    clearSearch(type) {
        const searchInput = document.getElementById(`${type}-search`);
        const clearButton = document.getElementById(`clear-${type}-search`);
        
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        if (clearButton) {
            clearButton.style.display = 'none';
        }
        
        // Reset the filter for this type
        switch (type) {
            case 'sports':
                this.filterSports('');
                break;
            case 'teams':
                this.filterTeams('');
                break;
            case 'leagues':
                this.filterLeagues('');
                break;
        }
    }

    /**
     * Filter sports based on search term
     */
    filterSports(searchTerm) {
        const sportsGrid = document.getElementById('sports-grid');
        const sportCards = sportsGrid.querySelectorAll('.selectable-item');
        
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;
        
        sportCards.forEach(card => {
            const sportName = card.querySelector('.item-name').textContent.toLowerCase();
            const sportDescription = card.querySelector('.item-description').textContent.toLowerCase();
            const isMatch = !term || sportName.includes(term) || sportDescription.includes(term);
            
            card.style.display = isMatch ? 'block' : 'none';
            if (isMatch) visibleCount++;
        });
        
        // Show/hide empty state
        this.toggleEmptyState('sports', visibleCount === 0 && term, `No sports found matching "${searchTerm}"`);
    }

    /**
     * Filter teams based on search term
     */
    filterTeams(searchTerm) {
        const teamsGrid = document.getElementById('teams-grid');
        const teamCards = teamsGrid.querySelectorAll('.team-card');
        
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;
        
        teamCards.forEach(card => {
            const teamName = card.querySelector('.team-name').textContent.toLowerCase();
            const teamSport = card.querySelector('.team-sport').textContent.toLowerCase();
            const isMatch = !term || teamName.includes(term) || teamSport.includes(term);
            
            card.style.display = isMatch ? 'block' : 'none';
            if (isMatch) visibleCount++;
        });
        
        // Show/hide empty state
        this.toggleEmptyState('teams', visibleCount === 0 && term, `No teams found matching "${searchTerm}"`);
    }

    /**
     * Filter leagues based on search term
     */
    filterLeagues(searchTerm) {
        const leaguesGrid = document.getElementById('leagues-grid');
        const leagueCards = leaguesGrid.querySelectorAll('.league-card');
        
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;
        
        leagueCards.forEach(card => {
            const leagueName = card.querySelector('.league-name').textContent.toLowerCase();
            const leagueSport = card.querySelector('.league-sport').textContent.toLowerCase();
            const isMatch = !term || leagueName.includes(term) || leagueSport.includes(term);
            
            card.style.display = isMatch ? 'block' : 'none';
            if (isMatch) visibleCount++;
        });
        
        // Show/hide empty state
        this.toggleEmptyState('leagues', visibleCount === 0 && term, `No leagues found matching "${searchTerm}"`);
    }

    /**
     * Show or hide empty state for search results
     */
    toggleEmptyState(type, show, message) {
        const container = document.getElementById(`${type}-grid`);
        let emptyState = container.querySelector('.search-empty-state');
        
        if (show) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'search-empty-state empty-state';
                emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>No Results Found</h3>
                    <p>${message}</p>
                    <div class="empty-actions">
                        <button class="btn btn-secondary" onclick="window.preferencesManager.clearSearch('${type}')">
                            <i class="fas fa-times"></i> Clear Search
                        </button>
                    </div>
                `;
                container.appendChild(emptyState);
            }
            emptyState.style.display = 'block';
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }
    }

    /**
     * Clear all search inputs
     */
    clearAllSearches() {
        ['sports', 'teams', 'leagues'].forEach(type => {
            this.clearSearch(type);
        });
    }

    /**
     * Reset search when items are loaded
     */
    resetSearchFilters() {
        // Clear any existing search empty states
        document.querySelectorAll('.search-empty-state').forEach(state => {
            state.remove();
        });
        
        // Show all items
        document.querySelectorAll('.selectable-item, .team-card, .league-card').forEach(item => {
            item.style.display = 'block';
        });
    }
}

// Initialize the preferences manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.preferencesManager = new PreferencesManager();
    console.log('🔧 Sports Preferences Manager initialized');
});
