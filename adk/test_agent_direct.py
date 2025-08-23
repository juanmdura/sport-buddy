#!/usr/bin/env python3
"""
Direct test of the sports agent to verify tool usage
"""
import sys
import asyncio
import os
from io import StringIO

# Set up environment
os.environ['GOOGLE_API_KEY'] = 'AIzaSyD4Hte33d85BriJG1JI5yDlO1HbE7JjQzM'
os.environ['OPIK_API_KEY'] = 'FmS00BRumiIHn8w9Lm7STohfz'
os.environ['OPIK_WORKSPACE'] = 'juan-dura'

async def test_agent():
    try:
        from agents.sports_events_agent.agent import sports_agent
        from google.adk.agents.invocation_context import InvocationContext
        from google.adk.sessions.in_memory_session_service import InMemorySessionService
        from google.adk.agents.run_config import RunConfig
        import uuid
        
        print("🧪 Testing sports agent directly...")
        
        # Create ADK context
        session_service = InMemorySessionService()
        run_config = RunConfig(response_modalities=["TEXT"])
        mock_session = {
            'id': str(uuid.uuid4()),
            'state': {},
            'user_id': 'test-user',
            'appName': 'direct-test'
        }
        
        context = InvocationContext(
            session_service=session_service,
            invocation_id=str(uuid.uuid4()),
            agent=sports_agent,
            session=mock_session,
            run_config=run_config
        )
        
        # Test with just the team name
        test_message = "Arsenal"
        print(f"📝 Test message: {test_message}")
        
        original_stdin = sys.stdin
        sys.stdin = StringIO(test_message + "\n")
        
        full_response = ""
        tool_calls_detected = []
        tool_responses_detected = []
        
        try:
            chunk_count = 0
            print("🚀 Starting agent execution...")
            
            async for chunk in sports_agent.run_async(context):
                chunk_count += 1
                print(f"📦 Chunk {chunk_count}: {type(chunk).__name__}")
                
                if chunk_count > 25:  # Prevent infinite loops
                    print("⏹️  Max chunks reached, stopping...")
                    break
                
                # Check for tool usage - examine ALL parts including non-text
                if hasattr(chunk, 'content') and chunk.content:
                    content = chunk.content
                    print(f"   🔍 Content type: {type(content)}")
                    
                    # Check if content has parts
                    if hasattr(content, 'parts'):
                        print(f"   🔍 Number of parts: {len(content.parts)}")
                        for i, part in enumerate(content.parts):
                            part_type = type(part).__name__
                            print(f"   📦 Part {i} type: {part_type}")
                            
                            if hasattr(part, 'text') and part.text:
                                text_content = str(part.text).strip()
                                print(f"     📝 Text: {text_content[:100]}...")
                                full_response += text_content + "\n"
                            elif hasattr(part, 'function_call'):
                                func_call = part.function_call
                                if func_call:
                                    print(f"     🎯 TOOL CALL: {func_call.name} with args: {func_call.args}")
                                    tool_calls_detected.append(func_call.name)
                                else:
                                    print(f"     ⚠️ function_call is None")
                            elif hasattr(part, 'function_response'):
                                func_resp = part.function_response
                                print(f"     📊 TOOL RESPONSE: {func_resp.name}")
                                tool_responses_detected.append(func_resp.name)
                            else:
                                print(f"     ❓ Unknown part type: {part_type}")
                    else:
                        print(f"   ⚠️ Content has no parts attribute")
                        content_str = str(content)[:200]
                        print(f"   📄 Raw content: {content_str}...")
        
        finally:
            sys.stdin = original_stdin
        
        print(f"\n🎯 RESULTS:")
        print(f"   Total chunks: {chunk_count}")
        print(f"   Tool calls detected: {tool_calls_detected}")
        print(f"   Tool responses detected: {tool_responses_detected}")
        print(f"   Final response length: {len(full_response)}")
        print(f"   Final response: {full_response[:200]}...")
        
        if tool_calls_detected:
            print("✅ SUCCESS: Agent used tools!")
        else:
            print("❌ ISSUE: Agent did not use tools")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
