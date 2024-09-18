from tavily import TavilyClient, MissingAPIKeyError, InvalidAPIKeyError, UsageLimitExceededError
import models
from typing import Literal

def tavily_search(query: str, api_key=None, search_depth: Literal["basic", "advanced"] = "basic", include_answer: bool = True):
    api_key = api_key or models.get_api_key("tavily")

    client = TavilyClient(api_key=api_key)
    
    try:
        response = client.search(
            query=query,
            search_depth=search_depth,
            include_answer=include_answer
        )
        
        # If include_answer is True, return the answer, otherwise return the full response
        if include_answer:
            return response.get('answer', 'No answer provided')
        else:
            return response
        
    except Exception as e:
        # Handle specific exceptions as per the documentation
        if isinstance(e, MissingAPIKeyError):
            return "Error: API key is missing. Please provide a valid API key."
        elif isinstance(e, InvalidAPIKeyError):
            return "Error: Invalid API key provided. Please check your API key."
        elif isinstance(e, UsageLimitExceededError):
            return "Error: Usage limit exceeded. Please check your plan's usage limits or consider upgrading."
        else:
            return f"An error occurred: {str(e)}"
        