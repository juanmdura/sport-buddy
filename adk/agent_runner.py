#!/usr/bin/env python3
"""
Sports Events Agent Runner
Handles proper invocation of the ADK agent with context
"""

import sys
import asyncio
import json
import traceback
from typing import Dict, Any

try:
    from agents.sports_events_agent.agent import sports_agent
except ImportError as e:
    print(f"AGENT_ERROR_START\nImport error: {e}\nAGENT_ERROR_END")
    sys.exit(1)


async def run_agent(user_message: str, user_context: Dict[str, Any] = None) -> str:
    """
    Run the sports agent with proper context
    
    Args:
        user_message: The user's question/message
        user_context: Additional context about the user (session, preferences, etc.)
    
    Returns:
        Agent's response as a string
    """
    try:
        # For google.adk.agents.LlmAgent, we pass the message directly
        # The LlmAgent should handle the user message as input
        
        # Run the agent and collect all response chunks
        full_response = ""
        
        # Try passing the user message directly to run_async
        async for chunk in sports_agent.run_async(user_message):
            # Handle different chunk types
            if hasattr(chunk, 'content'):
                full_response += str(chunk.content)
            elif hasattr(chunk, 'text'):
                full_response += str(chunk.text)
            elif hasattr(chunk, 'data'):
                full_response += str(chunk.data)
            else:
                full_response += str(chunk)
        
        return full_response.strip()
        
    except Exception as e:
        error_details = f"Agent execution error: {str(e)}\n{traceback.format_exc()}"
        raise Exception(error_details)


async def main():
    """Main entry point for the agent runner"""
    try:
        # Get command line arguments
        if len(sys.argv) < 2:
            print("AGENT_ERROR_START\nUsage: python agent_runner.py <message> [context_json]\nAGENT_ERROR_END")
            sys.exit(1)
        
        user_message = sys.argv[1]
        user_context = {}
        
        # Parse optional context JSON
        if len(sys.argv) > 2:
            try:
                user_context = json.loads(sys.argv[2])
            except json.JSONDecodeError as e:
                print(f"AGENT_ERROR_START\nInvalid context JSON: {e}\nAGENT_ERROR_END")
                sys.exit(1)
        
        # Run the agent
        response = await run_agent(user_message, user_context)
        
        # Output the response with markers for parsing
        print("AGENT_RESPONSE_START")
        print(response)
        print("AGENT_RESPONSE_END")
        
    except Exception as e:
        print("AGENT_ERROR_START")
        print(f"Error: {str(e)}")
        print("AGENT_ERROR_END")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
