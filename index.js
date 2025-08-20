#!/usr/bin/env node

/**
 * Zubale ADK - Main Entry Point
 * 
 * This project contains both App (Node.js) and ADK (Python) components:
 * - App: Sports Events System with web interface
 * - ADK: Google ADK integration for AI agents
 * 
 * This entry point delegates to the appropriate technology stack.
 */

const path = require('path');
const { spawn } = require('child_process');

/**
 * Display help information
 */
function showHelp() {
    console.log('🏆 Zubale ADK - Multi-Language Sports Events System\n');
    console.log('This project contains both App (Node.js) and ADK (Python) components.\n');
    console.log('Usage:');
    console.log('  node index.js [component] [options]\n');
    console.log('Components:');
    console.log('  app, js           Run App/Node.js sports events system');
    console.log('  adk, py           Run ADK/Python Google ADK components');
    console.log('  --help, -h        Show this help message\n');
    console.log('App Examples:');
    console.log('  node index.js app --web       # Start sports events web server');
    console.log('  node index.js app --cli       # Run sports events CLI');
    console.log('  node index.js app --help      # Show App help\n');
    console.log('ADK Examples:');
    console.log('  node index.js adk             # Run ADK components');
    console.log('  node index.js adk --help      # Show ADK help\n');
    console.log('Direct Access:');
    console.log('  cd app && npm start           # Start App web server');
    console.log('  cd adk && python -m agents.example.agent  # Run ADK agent\n');
}

/**
 * Run App components
 */
function runApp(args) {
    const appIndexPath = path.join(__dirname, 'app', 'index.js');
    
    // Change working directory to app folder
    const originalCwd = process.cwd();
    process.chdir(path.join(__dirname, 'app'));
    
    try {
        // Import and run the App main function
        const { main } = require(appIndexPath);
        
        // Override process.argv to pass through the arguments
        const originalArgv = process.argv;
        process.argv = ['node', 'index.js', ...args];
        
        main().catch(error => {
            console.error('❌ App application error:', error.message);
            process.exit(1);
        }).finally(() => {
            // Restore original argv and cwd
            process.argv = originalArgv;
            process.chdir(originalCwd);
        });
    } catch (error) {
        process.chdir(originalCwd);
        throw error;
    }
}

/**
 * Run ADK components
 */
function runADK(args) {
    console.log('🐍 ADK Google ADK Components\n');
    
    const adkPath = path.join(__dirname, 'adk');
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('ADK components available:');
        console.log('- Google ADK integration');
        console.log('- AI Agents for sports event descriptions');
        console.log('- Gemini model integration');
        console.log('\nTo run ADK components:');
        console.log('  cd adk');
        console.log('  python -m agents.example.agent');
        console.log('  # or activate virtual environment first:');
        console.log('  source .venv/bin/activate  # (or .venv\\Scripts\\activate on Windows)');
        return;
    }
    
    // Try to run an ADK component
    console.log('Running ADK example agent...');
    console.log(`Working directory: ${adkPath}\n`);
    
    const adkProcess = spawn('python', ['-m', 'agents.example.agent'], {
        cwd: adkPath,
        stdio: 'inherit'
    });
    
    adkProcess.on('error', (error) => {
        console.error('❌ Failed to run ADK component:', error.message);
        console.log('\nMake sure Python is installed and dependencies are available.');
        console.log('You may need to activate the virtual environment first:');
        console.log(`  cd ${adkPath}`);
        console.log('  source .venv/bin/activate  # (or .venv\\Scripts\\activate on Windows)');
        console.log('  python -m agents.example.agent');
    });
    
    adkProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`\n❌ ADK process exited with code ${code}`);
        }
    });
}

/**
 * Main application entry point
 */
function main() {
    const args = process.argv.slice(2);
    
    // Show main help only if no arguments or help is the first argument
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        return;
    }
    
    const component = args[0].toLowerCase();
    const componentArgs = args.slice(1);
    
    switch (component) {
        case 'app':
        case 'js':
        case 'javascript':
        case 'node':
            runApp(componentArgs);
            break;
            
        case 'adk':
        case 'py':
        case 'python':
            runADK(componentArgs);
            break;
            
        default:
            console.log(`❌ Unknown component: ${component}`);
            console.log('Use --help for usage information.');
            process.exit(1);
    }
}

// Run the application if this file is executed directly
if (require.main === module) {
    main();
}
