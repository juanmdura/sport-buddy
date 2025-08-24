#!/usr/bin/env node

const SportsEventsAPI = require('../services/sports-api');
const SportsEventsServer = require('../web/server/server');
const path = require('path');

// Load environment variables from .env file in project root
require('dotenv').config({ path: path.join(__dirname, '../../..', '.env') });

/**
 * Main Sports Events System Application
 * 
 * This application can run in two modes:
 * 1. Web Mode (default): Starts an Express web server with dashboard
 * 2. CLI Mode: Runs command-line interface for testing API functionality
 */

/**
 * CLI Mode - Test API functionality from command line
 */
async function runCLIMode() {
    console.log('🏆 Sports Events System - CLI Mode\n');
    
    const sportsAPI = new SportsEventsAPI();
    
    try {
        // Example 1: Get available sports
        console.log('🎯 Fetching available sports...');
        const availableSports = await sportsAPI.getAvailableSports();
        if (availableSports.success && availableSports.sports.length > 0) {
            console.log(`Found ${availableSports.count} sports:`);
            availableSports.sports.slice(0, 10).forEach(sport => {
                console.log(`  - ${sport.strSport}`);
            });
            console.log('');
        }

        // Example 2: Get Soccer leagues
        console.log('📋 Fetching Soccer leagues...');
        const soccerLeagues = await sportsAPI.getLeaguesBySport('Soccer');
        if (soccerLeagues.success && soccerLeagues.leagues.length > 0) {
            console.log(`Found ${soccerLeagues.count} Soccer leagues:`);
            soccerLeagues.leagues.slice(0, 5).forEach(league => {
                console.log(`  - ${league.strLeague} (ID: ${league.idLeague})`);
            });
            console.log('');
            
            // Example 3: Get events for English Premier League (ID: 4328)
            console.log('⚽ Fetching English Premier League events...');
            const premierLeagueEvents = await sportsAPI.getEventsByLeague('4328');
            if (premierLeagueEvents.success && premierLeagueEvents.events.length > 0) {
                console.log(`Found ${premierLeagueEvents.count} events:`);
                
                // Display first 5 events
                premierLeagueEvents.events.slice(0, 5).forEach(event => {
                    const formattedEvent = sportsAPI.formatEvent(event);
                    console.log(`  📅 ${formattedEvent.date} - ${formattedEvent.name}`);
                    if (formattedEvent.venue) {
                        console.log(`     📍 Venue: ${formattedEvent.venue}`);
                    }
                    if (formattedEvent.homeScore !== null && formattedEvent.awayScore !== null) {
                        console.log(`     ⚽ Score: ${formattedEvent.homeScore} - ${formattedEvent.awayScore}`);
                    }
                    console.log('');
                });
            } else {
                console.log('No Premier League events found or error occurred.');
                if (premierLeagueEvents.message) {
                    console.log(`Message: ${premierLeagueEvents.message}`);
                }
            }
        } else {
            console.log('No Soccer leagues found or error occurred.');
            if (soccerLeagues.message) {
                console.log(`Message: ${soccerLeagues.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ CLI Application error:', error.message);
    }
    
    console.log('✅ CLI Mode finished.');
}

/**
 * Web Mode - Start Express web server
 */
async function runWebMode() {
    console.log('🌐 Starting Sports Events Web Server...\n');
    
    try {
        const port = process.env.PORT || 3000;
        const server = new SportsEventsServer(port);
        await server.start();
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Gracefully shutting down server...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Gracefully shutting down server...');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start web server:', error.message);
        process.exit(1);
    }
}

/**
 * Display help information
 */
function showHelp() {
    console.log('🏆 Sports Events System\n');
    console.log('A comprehensive Node.js application for sports events management.\n');
    console.log('Usage:');
    console.log('  node app.js [options]\n');
    console.log('Options:');
    console.log('  --web, -w     Start web server (default)');
    console.log('  --cli, -c     Run CLI mode for testing');
    console.log('  --help, -h    Show this help message\n');
    console.log('Examples:');
    console.log('  node app.js              # Start web server');
    console.log('  node app.js --web        # Start web server');
    console.log('  node app.js --cli        # Run CLI mode');
    console.log('  npm start                # Start web server');
    console.log('  npm run cli              # Run CLI mode');
    console.log('  npm run dev              # Start web server with auto-restart\n');
    console.log('Web Interface:');
    console.log('  http://localhost:3000    # Access the sports events dashboard');
}

/**
 * Main application entry point
 */
async function main() {
    const args = process.argv.slice(2);
    
    // Parse command line arguments
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
    } else if (args.includes('--cli') || args.includes('-c')) {
        await runCLIMode();
    } else if (args.includes('--web') || args.includes('-w') || args.length === 0) {
        await runWebMode();
    } else {
        console.log('❌ Unknown arguments. Use --help for usage information.');
        process.exit(1);
    }
}

// Run the application if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Application error:', error.message);
        process.exit(1);
    });
}

// Export modules for use in other files
module.exports = {
    SportsEventsAPI,
    SportsEventsServer,
    runCLIMode,
    runWebMode,
    main
};