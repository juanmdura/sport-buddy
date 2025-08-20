#!/usr/bin/env node

/**
 * Sports Events System - Main Entry Point
 * 
 * This is the main entry point for the Sports Events System.
 * It delegates to the CLI module which handles all functionality.
 */

// Import the CLI module and execute the main function
const { main } = require('./src/cli/index');

// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Application error:', error.message);
        process.exit(1);
    });
}

// Export the main function for use by the root index.js
module.exports = { main };
