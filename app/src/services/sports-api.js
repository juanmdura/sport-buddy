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
}

module.exports = SportsEventsAPI;
