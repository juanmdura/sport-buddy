import os

from google.adk.agents import LlmAgent
from .tools import nationality_toolset
from .prompt import AGENT_INSTRUCTIONS
# from opik.integrations.adk import OpikTracer
#
# import opik

# # observability setup
# opik.configure(
#     api_key=os.getenv("OPIK_API_KEY"),
#     workspace=os.getenv("OPIK_WORKSPACE"),
# )
# opik_tracer = OpikTracer()

# agent constructor
root_agent = LlmAgent(
    name="example_agent",
    model="gemini-2.5-pro",
    description=("Responds to user using tools generated from an OpenAPI spec."),
    instruction=AGENT_INSTRUCTIONS,
    tools=[nationality_toolset],
    # before_agent_callback=opik_tracer.before_agent_callback,
    # after_agent_callback=opik_tracer.after_agent_callback,
    # before_model_callback=opik_tracer.before_model_callback,
    # after_model_callback=opik_tracer.after_model_callback,
    # before_tool_callback=opik_tracer.before_tool_callback,
    # after_tool_callback=opik_tracer.after_tool_callback,
)