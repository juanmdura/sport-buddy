"""
Sports Events Agent - ADK Implementation
Following Google ADK best practices for agent development and observability.
"""
import os
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from .tools import search_teams
from .prompt import AGENT_INSTRUCTIONS
from opik.integrations.adk import OpikTracer
import opik

# ADK Best Practice: Observability setup with Opik dashboard
opik.configure(
    api_key=os.getenv("OPIK_API_KEY"),
    workspace=os.getenv("OPIK_WORKSPACE"),
)

# ADK Best Practice: Initialize tracing for comprehensive observability
opik_tracer = OpikTracer()

# ADK Best Practice: LlmAgent constructor with comprehensive configuration
sports_agent = LlmAgent(
    name="sports_events_agent",
    model="gemini-2.5-pro",
    description="A sports assistant that helps users find information about sports teams, leagues, and events using real-time data from TheSportsDB API",
    instruction=AGENT_INSTRUCTIONS,
    
    # ADK Best Practice: Tool integration with proper encapsulation
    tools=[
        FunctionTool(search_teams)
    ],
    
    # ADK Best Practice: Comprehensive observability with Opik tracing
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)
