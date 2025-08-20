import os
import vertexai.agent_engines

# Get deployed agent from Agent Engine
deployed_agent = vertexai.agent_engines.get('projects/zb-host-agentspace-poc/locations/us-central1/reasoningEngines/6621813176327471104')

# List Agent Engine sessions
response = deployed_agent.list_sessions(user_id="test_user")
sessions = response["sessions"]

# Use existing session if available, to showcase session state
if sessions:
    print(">>> 🗃️  Found existing sessions!")
    # Use the first session
    session = sessions[0]
    print(f">>> 🗂️  Using first session: {session['id']}")
    session = deployed_agent.get_session(user_id="test_user", session_id=session['id'])
    print(f">>> 🧠  Session state: {session['state']}")
else:
    # Create an Agent Engine session
    session = deployed_agent.create_session(user_id="test_user")
    print(f">>> 📝  Created new session: {session['id']}")
    print(f">>> 🧠  Session state: {session['state']}")

# Use the session to chat with the agent
for event in deployed_agent.stream_query(
        user_id="test_user",
        session_id=session['id'],
        message="what nationality is the name, Sebastian?",
    ):
    print(f"<<< 💬  Streaming Event: {event['content']['parts'][0]}")

# Get session and see updated state
session = deployed_agent.get_session(user_id="test_user", session_id=session['id'])
print(f">>> 🧠  Session state: {session['state']}")