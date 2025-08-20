const axios = require('axios');

/**
 * Sports Events API Client
 * Fetches sports events from TheSportsDB API (free tier)
 */
class SportsEventsAPI {
    constructor() {
        this.baseURL = 'https://www.thesportsdb.com/api/v1/json/962825';
        this.apiKey = '962825'; // Premium API key
    }

    /**
     * Fetch events for a specific league
     * @param {string} leagueId - The league ID (e.g., '4328' for English Premier League)
     * @returns {Promise<Object>} Events data
     */
    async getEventsByLeague(leagueId) {
        try {
            const url = `${this.baseURL}/eventsseason.php?id=${leagueId}`;
            console.log(`Fetching events from: ${url}`);
            
            const response = await axios.get(url, {
                timeout: 30000, // Increased timeout for premium API
                headers: {
                    'User-Agent': 'Sports-Events-System/1.0'
                }
            });

            if (response.data && response.data.events) {
                return {
                    success: true,
                    events: response.data.events,
                    count: response.data.events.length
                };
            } else {
                return {
                    success: false,
                    message: 'No events found for this league',
                    events: []
                };
            }
        } catch (error) {
            console.error('Error fetching events:', error.message);
            return {
                success: false,
                message: `Error fetching events: ${error.message}`,
                events: []
            };
        }
    }

    /**
     * Fetch upcoming events for a specific team
     * @param {string} teamName - The team name
     * @returns {Promise<Object>} Events data
     */
    async getUpcomingEventsByTeam(teamName) {
        try {
            const url = `${this.baseURL}/eventsnext.php?id=${teamName}`;
            console.log(`Fetching upcoming events for team: ${teamName}`);
            
            const response = await axios.get(url, {
                timeout: 30000, // Increased timeout for premium API
                headers: {
                    'User-Agent': 'Sports-Events-System/1.0'
                }
            });

            if (response.data && response.data.events) {
                return {
                    success: true,
                    events: response.data.events,
                    count: response.data.events.length
                };
            } else {
                return {
                    success: false,
                    message: 'No upcoming events found for this team',
                    events: []
                };
            }
        } catch (error) {
            console.error('Error fetching upcoming events:', error.message);
            return {
                success: false,
                message: `Error fetching upcoming events: ${error.message}`,
                events: []
            };
        }
    }

    /**
     * Get all leagues for a specific sport
     * @param {string} sport - The sport name (e.g., 'Soccer', 'Basketball')
     * @returns {Promise<Object>} Leagues data
     */
    async getLeaguesBySport(sport) {
        try {
            const url = `${this.baseURL}/all_leagues.php`;
            console.log(`Fetching all leagues to filter by sport: ${sport}`);
            
            const response = await axios.get(url, {
                timeout: 30000, // Increased timeout for premium API
                headers: {
                    'User-Agent': 'Sports-Events-System/1.0'
                }
            });

            if (response.data && response.data.leagues) {
                const filteredLeagues = response.data.leagues.filter(league => 
                    league.strSport && league.strSport.toLowerCase() === sport.toLowerCase()
                );
                
                return {
                    success: true,
                    leagues: filteredLeagues,
                    count: filteredLeagues.length
                };
            } else {
                return {
                    success: false,
                    message: 'No leagues found',
                    leagues: []
                };
            }
        } catch (error) {
            console.error('Error fetching leagues:', error.message);
            return {
                success: false,
                message: `Error fetching leagues: ${error.message}`,
                leagues: []
            };
        }
    }

    /**
     * Format event data for display
     * @param {Object} event - Raw event data from API
     * @returns {Object} Formatted event data
     */
    formatEvent(event) {
        return {
            id: event.idEvent,
            name: `${event.strHomeTeam} vs ${event.strAwayTeam}`,
            homeTeam: event.strHomeTeam,
            awayTeam: event.strAwayTeam,
            date: event.dateEvent,
            time: event.strTime,
            venue: event.strVenue,
            sport: event.strSport,
            league: event.strLeague,
            season: event.strSeason,
            status: event.strStatus,
            homeScore: event.intHomeScore,
            awayScore: event.intAwayScore
        };
    }

    /**
     * Get available sports from the API
     * @returns {Promise<Object>} Sports data
     */
    async getAvailableSports() {
        try {
            const url = `${this.baseURL}/all_sports.php`;
            console.log('Fetching available sports from:', url);
            
            const response = await axios.get(url, {
                timeout: 30000, // Increased timeout for premium API
                headers: {
                    'User-Agent': 'Sports-Events-System/1.0'
                }
            });

            console.log('Sports API response status:', response.status);
            console.log('Sports API response data keys:', Object.keys(response.data || {}));

            if (response.data && response.data.sports) {
                console.log('Number of sports received:', response.data.sports.length);
                return {
                    success: true,
                    sports: response.data.sports,
                    count: response.data.sports.length
                };
            } else {
                console.log('No sports in response data:', response.data);
                return {
                    success: false,
                    message: 'No sports found',
                    sports: []
                };
            }
        } catch (error) {
            console.error('Error fetching sports:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            return {
                success: false,
                message: `Error fetching sports: ${error.message}`,
                sports: []
            };
        }
    }

    /**
     * Search for teams by name
     * @param {string} teamName - The team name to search for
     * @returns {Promise<Object>} Teams data
     */
    async searchTeams(teamName) {
        try {
            const url = `${this.baseURL}/searchteams.php?t=${encodeURIComponent(teamName)}`;
            console.log(`Searching for teams: ${teamName}`);
            
            const response = await axios.get(url, {
                timeout: 30000, // Increased timeout for premium API
                headers: {
                    'User-Agent': 'Sports-Events-System/1.0'
                }
            });

            if (response.data && response.data.teams) {
                return {
                    success: true,
                    teams: response.data.teams,
                    count: response.data.teams.length
                };
            } else {
                return {
                    success: false,
                    message: 'No teams found',
                    teams: []
                };
            }
        } catch (error) {
            console.error('Error searching teams:', error.message);
            return {
                success: false,
                message: `Error searching teams: ${error.message}`,
                teams: []
            };
        }
    }

    /**
     * Get teams by sport - uses league-based approach
     * @param {string} sportName - The sport name to get teams for
     * @returns {Promise<Object>} Teams data
     */
    async getTeamsBySport(sportName) {
        try {
            console.log(`Getting teams for sport: ${sportName}`);
            
            // First get leagues for this sport
            const leaguesResult = await this.getLeaguesBySport(sportName);
            
            if (!leaguesResult.success || leaguesResult.leagues.length === 0) {
                return {
                    success: false,
                    message: `No leagues found for sport: ${sportName}`,
                    teams: []
                };
            }

            // Get teams from the first few leagues (limit to avoid too many API calls)
            const leagues = leaguesResult.leagues.slice(0, 3); // Limit to first 3 leagues
            const teamsPromises = leagues.map(league => this.getTeamsByLeague(league.idLeague));
            
            const teamsResults = await Promise.all(teamsPromises);
            
            // Combine all teams from all leagues
            let allTeams = [];
            teamsResults.forEach(result => {
                if (result.success && result.teams) {
                    allTeams = allTeams.concat(result.teams);
                }
            });

            // Remove duplicates based on team ID
            const uniqueTeams = allTeams.filter((team, index, self) => 
                index === self.findIndex(t => t.idTeam === team.idTeam)
            );

            return {
                success: true,
                teams: uniqueTeams,
                count: uniqueTeams.length
            };

        } catch (error) {
            console.error('Error getting teams by sport:', error.message);
            return {
                success: false,
                message: `Error getting teams by sport: ${error.message}`,
                teams: []
            };
        }
    }

    /**
     * Get teams by league (using league name since search_all_teams requires league name not ID)
     * @param {string} leagueId - The league ID
     * @returns {Promise<Object>} Teams data
     */
    async getTeamsByLeague(leagueId) {
        try {
            // First, get the league info to find the league name
            const leagueUrl = `${this.baseURL}/lookupleague.php?id=${leagueId}`;
            console.log(`Getting league info for ID: ${leagueId}`);
            
            const leagueResponse = await axios.get(leagueUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Sports-Events-System/1.0'
                }
            });

            if (!leagueResponse.data || !leagueResponse.data.leagues || leagueResponse.data.leagues.length === 0) {
                return {
                    success: false,
                    message: 'League not found',
                    teams: []
                };
            }

            const leagueName = leagueResponse.data.leagues[0].strLeague;
            console.log(`Getting teams for league: ${leagueName}`);

            // Now get teams using the league name
            const teamsUrl = `${this.baseURL}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`;
            
            const teamsResponse = await axios.get(teamsUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Sports-Events-System/1.0'
                }
            });

            if (teamsResponse.data && teamsResponse.data.teams) {
                return {
                    success: true,
                    teams: teamsResponse.data.teams,
                    count: teamsResponse.data.teams.length
                };
            } else {
                return {
                    success: false,
                    message: 'No teams found for this league',
                    teams: []
                };
            }
        } catch (error) {
            console.error('Error fetching teams by league:', error.message);
            return {
                success: false,
                message: `Error fetching teams by league: ${error.message}`,
                teams: []
            };
        }
    }
}

module.exports = SportsEventsAPI;
