import os
from python.helpers import perplexity_search
from python.helpers import duckduckgo_search
from . import memory_tool
import concurrent.futures
from python.helpers.tool import Tool, Response
from python.helpers.print_style import PrintStyle
from python.helpers.errors import handle_error

class Knowledge(Tool):
    async def execute(self, question="", **kwargs):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Schedule the three functions to be run in parallel

            # perplexity search, if API key provided
            if os.getenv("API_KEY_PERPLEXITY"):
                perplexity_future = executor.submit(perplexity_search.perplexity_search, question)
            else: 
                PrintStyle.hint("No API key provided for Perplexity. Skipping Perplexity search.")
                self.agent.context.log.log(type="hint", content="No API key provided for Perplexity. Skipping Perplexity search.")
                perplexity_future = None

            # duckduckgo search
            duckduckgo_future = executor.submit(duckduckgo_search.search, question)

            # memory search
            memory_future = executor.submit(memory_tool.search, self.agent, question)

            # Wait for all functions to complete
            futures = {
                "perplexity": perplexity_future,
                "duckduckgo": duckduckgo_future,
                "memory": memory_future
            }

            results = {}
            for key, future in futures.items():
                if future:
                    try:
                        results[key] = future.result()
                    except Exception as e:
                        handle_error(e)
                        results[key] = f"{key.capitalize()} search failed: {str(e)}"
                else:
                    results[key] = ""

        msg = self.agent.read_prompt(
            "tool.knowledge.response.md", 
            online_sources=((results["perplexity"] + "\n\n") if results["perplexity"] else "") + str(results["duckduckgo"]),
            memory=results["memory"]
        )

        if self.agent.handle_intervention(msg): pass # wait for intervention and handle it, if paused

        return Response(message=msg, break_loop=False)
