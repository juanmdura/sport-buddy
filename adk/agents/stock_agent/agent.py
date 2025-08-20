import os

from google.adk import Agent
from google.adk.tools import FunctionTool

from .tools import get_stock_price
from opik.integrations.adk import OpikTracer

import opik

# observability setup
opik.configure(
    api_key=os.getenv("OPIK_API_KEY"),
    workspace=os.getenv("OPIK_WORKSPACE"),
)
opik_tracer = OpikTracer()

# agent constructor
stock_agent = Agent(
    name="stock_agent",
    model="gemini-2.5-pro",
    description=("An agent that provides stock market information"),
    instructions="You are a helpful financial assistant that provides stock market information. When asked about stock prices, use the get_stock_price tool to retrieve current information. Explain the data in a clear, concise manner",
    tools=[FunctionTool(get_stock_price)],
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)
