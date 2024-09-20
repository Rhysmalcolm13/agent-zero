from agent import Agent
from python.helpers.tool import Tool, Response

class Delegation(Tool):

    async def execute(self, message="", reset="", role="", **kwargs):
        # Create subordinate agent if not exists or reset flag is true
        if self.agent.get_data("subordinate") is None or str(reset).lower().strip() == "true":
            subordinate = Agent(
                self.agent.number + 1,
                self.agent.config,
                self.agent.context,
                role=role  # Assign role to subordinate
            )
            subordinate.set_data("superior", self.agent)
            self.agent.set_data("subordinate", subordinate)
        
        # Run subordinate agent message loop
        return Response(
            message=await self.agent.get_data("subordinate").message_loop(message),
            break_loop=False
        )