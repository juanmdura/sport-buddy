"""
ADK Best Practice: Sports Tools for Team and Event Information
Following security, safety, and documentation best practices from ADK guidelines.
"""
import requests
import re
import logging
from typing import Dict, Any, List

# ADK Best Practice: Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def search_teams(team_name: str) -> Dict[str, Any]:
    """
    Search for sports teams by name using TheSportsDB API.
    
    ADK Best Practice: Comprehensive documentation with examples and error cases.

    Args:
        team_name (str): The team name to search for (e.g., 'Arsenal', 'Lakers', 'Patriots')

    Returns:
        Dict[str, Any]: Dictionary containing team search results including:
            - teams: List of matching teams with details
            - count: Number of teams found
            - success: Whether the search was successful
            - timestamp: When data was retrieved
            - search_term: The validated search term used
            
    Examples:
        >>> search_teams("Arsenal")
        {"teams": [{"team_name": "Arsenal", "league": "Premier League", ...}], "count": 1, "success": True}
        
        >>> search_teams("Lakers")
        {"teams": [{"team_name": "Los Angeles Lakers", "league": "NBA", ...}], "count": 1, "success": True}
        
    ADK Safety: Input validation and error handling included.
    """
    try:
        # ADK Best Practice: Input validation and sanitization
        if not team_name or not isinstance(team_name, str):
            logger.error(f"Invalid team_name input: {team_name}")
            return {
                "error": "Invalid team name provided. Please provide a valid team name string.",
                "team_name": team_name,
                "validation_failed": True,
                "success": False
            }
        
        # ADK Security: Sanitize input to prevent injection
        team_name_clean = team_name.strip()
        
        # Basic validation - allow letters, numbers, spaces, and common team name characters
        if not re.match(r'^[a-zA-Z0-9\s\-\.\'&]+$', team_name_clean):
            logger.warning(f"Team name format validation failed: {team_name}")
            return {
                "error": f"Invalid team name format. Use only letters, numbers, spaces and basic punctuation.",
                "team_name": team_name,
                "validation_failed": True,
                "success": False
            }
        
        # ADK Security: Length validation
        if len(team_name_clean) > 50:
            logger.warning(f"Team name too long: {team_name}")
            return {
                "error": f"Team name too long. Maximum 50 characters allowed.",
                "team_name": team_name,
                "validation_failed": True,
                "success": False
            }
        
        logger.info(f"Searching for teams: {team_name_clean}")
        
        # ADK Best Practice: Robust API call with timeout and error handling
        api_url = f"https://www.thesportsdb.com/api/v1/json/962825/searchteams.php"
        
        response = requests.get(
            api_url,
            params={'t': team_name_clean},
            timeout=10,  # ADK Safety: Timeout to prevent hanging
            headers={
                'User-Agent': 'Sports-Events-Agent/1.0',
                'Accept': 'application/json'
            }
        )
        
        # ADK Best Practice: HTTP status validation
        response.raise_for_status()
        
        data = response.json()
        
        # ADK Best Practice: Validate API response structure
        if not isinstance(data, dict):
            logger.warning(f"Unexpected API response format: {type(data)}")
            return {
                "error": "Invalid response format from sports API",
                "team_name": team_name_clean,
                "api_error": True,
                "success": False
            }
        
        # Process teams data
        teams_data = data.get('teams', [])
        
        if not teams_data or teams_data == [None]:
            logger.info(f"No teams found for: {team_name_clean}")
            return {
                "teams": [],
                "count": 0,
                "message": f"No teams found matching '{team_name_clean}'. Try different spelling or a more specific name.",
                "search_term": team_name_clean,
                "success": True,
                "timestamp": None
            }
        
        # ADK Best Practice: Process and validate each team
        processed_teams = []
        for team in teams_data:
            if team and isinstance(team, dict):
                processed_team = {
                    "team_id": team.get('idTeam'),
                    "team_name": team.get('strTeam', 'Unknown'),
                    "alternate_name": team.get('strAlternate', ''),
                    "league": team.get('strLeague', 'Unknown League'),
                    "sport": team.get('strSport', 'Unknown Sport'),
                    "founded": team.get('intFormedYear', ''),
                    "venue": team.get('strStadium', 'Unknown Venue'),
                    "location": team.get('strLocation', 'Unknown Location'),
                    "description": team.get('strDescriptionEN', '')[:200] + '...' if team.get('strDescriptionEN') and len(team.get('strDescriptionEN', '')) > 200 else team.get('strDescriptionEN', ''),
                    "website": team.get('strWebsite', ''),
                    "logo": team.get('strTeamBadge', ''),
                    "jersey": team.get('strTeamJersey', ''),
                    "country": team.get('strCountry', 'Unknown')
                }
                processed_teams.append(processed_team)
        
        # ADK Best Practice: Structured response with metadata
        result = {
            "teams": processed_teams,
            "count": len(processed_teams),
            "search_term": team_name_clean,
            "api_source": "TheSportsDB",
            "success": True,
            "timestamp": response.headers.get('date', 'Unknown'),
            "message": f"Found {len(processed_teams)} team(s) matching '{team_name_clean}'"
        }
        
        logger.info(f"Successfully found {len(processed_teams)} teams for '{team_name_clean}'")
        return result
        
    except requests.exceptions.Timeout:
        # ADK Best Practice: Specific timeout handling
        error_msg = f"Request timeout while searching for teams: {team_name}"
        logger.error(error_msg)
        return {
            "error": f"Request timed out. The sports API is taking too long to respond. Please try again.",
            "team_name": team_name,
            "timeout_error": True,
            "success": False,
            "timestamp": None
        }
        
    except requests.exceptions.RequestException as e:
        # ADK Best Practice: Network error handling
        error_msg = f"Network error searching for teams: {str(e)}"
        logger.error(error_msg)
        return {
            "error": f"Network error occurred while searching for teams. Please check your connection and try again.",
            "team_name": team_name,
            "network_error": True,
            "technical_details": str(e),
            "success": False,
            "timestamp": None
        }
        
    except Exception as e:
        # ADK Best Practice: Comprehensive error logging and user-friendly responses
        error_msg = str(e)
        logger.error(f"Error searching for teams '{team_name}': {error_msg}")
        
        return {
            "error": f"Unable to search for teams matching '{team_name}'. Please try a different team name or try again later.",
            "team_name": team_name,
            "technical_error": error_msg,
            "success": False,
            "timestamp": None
        }
