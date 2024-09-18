import os
from python.helpers import tavily_search  # Changed from perplexity_search to tavily_search
from python.helpers import duckduckgo_search
from . import memory_tool
import concurrent.futures
from python.helpers.tool import Tool, Response
from python.helpers.print_style import PrintStyle
from python.helpers.errors import handle_error

class Knowledge(Tool):
    async def execute(self, question="", **kwargs):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Schedule the two functions to be run in parallel

            # Tavily search, if API key provided
            if os.getenv("API_KEY_TAVILY"):  # Updated to check for Tavily API key
                tavily = executor.submit(tavily_search.tavily_search, question)  # Changed to use tavily_search
            else: 
                PrintStyle.hint("No API key provided for Tavily. Skipping Tavily search.")
                self.agent.context.log.log(type="hint", content="No API key provided for Tavily. Skipping Tavily search.")
                tavily = None
                

            # duckduckgo search
            duckduckgo = executor.submit(duckduckgo_search.search, question)

            # memory search
            future_memory = executor.submit(memory_tool.search, self.agent, question)

            # Wait for both functions to complete
            try:
                tavily_result = (tavily.result() if tavily else "") or ""  # Updated to get result from Tavily
            except Exception as e:
                handle_error(e)
                tavily_result = "Tavily search failed: " + str(e)

            try:
                duckduckgo_result = duckduckgo.result()
            except Exception as e:
                handle_error(e)
                duckduckgo_result = "DuckDuckGo search failed: " + str(e)

            try:
                memory_result = future_memory.result()
            except Exception as e:
                handle_error(e)
                memory_result = "Memory search failed: " + str(e)

        tavily_result_str = str(tavily_result) if tavily else ""
        msg = self.agent.read_prompt("tool.knowledge.response.md", 
                              online_sources = (tavily_result_str + "\n\n") + str(duckduckgo_result),
                              memory = memory_result )

        if self.agent.handle_intervention(msg): pass # wait for intervention and handle it, if paused

        return Response(message=msg, break_loop=False)
