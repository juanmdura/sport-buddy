#!/usr/bin/env python3
"""
Simple test to verify basic tool calling works with ADK
"""
import asyncio
import os
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

# Set API key
os.environ['GOOGLE_API_KEY'] = 'AIzaSyD4Hte33d85BriJG1JI5yDlO1HbE7JjQzM'

def simple_search(query: str) -> str:
    """A very simple search function that always works"""
    return f"Found result for: {query}"

# Create a very minimal agent
test_agent = LlmAgent(
    name="test_agent",
    model="gemini-2.5-pro", 
    instruction="You MUST call the simple_search function when the user mentions any word. For 'Arsenal', call simple_search('Arsenal').",
    tools=[FunctionTool(simple_search)]
)

async def test():
    try:
        from google.adk.agents.invocation_context import InvocationContext
        from google.adk.sessions.in_memory_session_service import InMemorySessionService  
        from google.adk.agents.run_config import RunConfig
        import uuid
        from io import StringIO
        import sys
        
        print("🧪 Testing minimal tool calling...")
        
        # Minimal context
        context = InvocationContext(
            session_service=InMemorySessionService(),
            invocation_id=str(uuid.uuid4()),
            agent=test_agent,
            session={'id': str(uuid.uuid4()), 'state': {}, 'user_id': 'test', 'appName': 'test'},
            run_config=RunConfig(response_modalities=["TEXT"])
        )
        
        # Test message  
        original_stdin = sys.stdin
        sys.stdin = StringIO("Arsenal\n")
        
        try:
            print("🚀 Testing with 'Arsenal'...")
            chunk_count = 0
            
            async for chunk in test_agent.run_async(context):
                chunk_count += 1
                print(f"📦 Chunk {chunk_count}: {type(chunk).__name__}")
                
                if chunk_count > 10:
                    break
                    
                if hasattr(chunk, 'content') and chunk.content:
                    if hasattr(chunk.content, 'parts'):
                        for i, part in enumerate(chunk.content.parts):
                            if hasattr(part, 'function_call'):
                                print(f"   🎯 TOOL CALL FOUND: {part.function_call.name}")
                                return True
                                
        finally:
            sys.stdin = original_stdin
            
        print("❌ No tool calls detected")
        return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test())
    if result:
        print("✅ Tool calling works!")
    else:
        print("❌ Tool calling failed")
