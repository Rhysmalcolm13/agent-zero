import asyncio
from dataclasses import dataclass, field
import time, importlib, inspect, os, json
from typing import Any, Optional, Dict, List
import uuid
from python.helpers import extract_tools, rate_limiter, files, errors
from python.helpers.print_style import PrintStyle
from python.helpers.blueprint_manager import BlueprintManager
from langchain.schema import AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.language_models.llms import BaseLLM
from langchain_core.embeddings import Embeddings
import python.helpers.log as Log
from python.helpers.dirty_json import DirtyJson
from python.helpers.defer import DeferredTask

class AgentContext:
    contexts: dict[str, 'AgentContext'] = {}
    counter: int = 0
    
    def __init__(self, config: 'AgentConfig', id:str|None = None, agent0: 'Agent|None' = None):
        # build context
        self.id = id or str(uuid.uuid4())
        self.config = config
        self.log = Log.Log()
        self.agent0 = agent0 or Agent(0, self.config, self)
        self.paused = False
        self.streaming_agent: Agent|None = None
        self.process: DeferredTask|None = None
        AgentContext.counter += 1
        self.no = AgentContext.counter                     
        self.contexts[self.id] = self

    @staticmethod
    def get(id:str):
        return AgentContext.contexts.get(id, None)

    @staticmethod
    def first():
        if not AgentContext.contexts: return None
        return list(AgentContext.contexts.values())[0]

    @staticmethod
    def remove(id:str):
        context = AgentContext.contexts.pop(id, None)
        if context and context.process: context.process.kill()
        return context

    def reset(self):
        if self.process: self.process.kill()
        self.log.reset()
        self.agent0 = Agent(0, self.config, self)
        self.streaming_agent = None
        self.paused = False   

    def communicate(self, msg: str, broadcast_level: int = 1):
        self.paused=False #unpause if paused
        
        if self.process and self.process.is_alive():
            if self.streaming_agent: current_agent = self.streaming_agent
            else:                     current_agent = self.agent0

            # set intervention messages to agent(s):
            intervention_agent = current_agent
            while intervention_agent and broadcast_level !=0:
                intervention_agent.intervention_message = msg
                broadcast_level -= 1
                intervention_agent = intervention_agent.data.get("superior",None)
        else:
            self.process = DeferredTask(self.agent0.message_loop, msg)

        return self.process
            
@dataclass
class AgentConfig: 
    chat_model: BaseChatModel | BaseLLM
    utility_model: BaseChatModel | BaseLLM
    embeddings_model:Embeddings
    prompts_subdir: str = ""
    memory_subdir: str = ""
    knowledge_subdir: str = ""
    auto_memory_count: int = 3
    auto_memory_skip: int = 2
    rate_limit_seconds: int = 60
    rate_limit_requests: int = 15
    rate_limit_input_tokens: int = 0
    rate_limit_output_tokens: int = 0
    msgs_keep_max: int = 25
    msgs_keep_start: int = 5
    msgs_keep_end: int = 10
    response_timeout_seconds: int = 160
    max_tool_response_length: int = 6000
    code_exec_docker_enabled: bool = True
    code_exec_docker_name: str = "agent-zero-exe"
    code_exec_docker_image: str = "frdel/agent-zero-exe:latest"
    code_exec_docker_ports: dict[str,int] = field(default_factory=lambda: {"22/tcp": 50022})
    code_exec_docker_volumes: dict[str, dict[str, str]] = field(default_factory=lambda: {files.get_abs_path("work_dir"): {"bind": "/root", "mode": "rw"}})
    code_exec_ssh_enabled: bool = True
    code_exec_ssh_addr: str = "localhost"
    code_exec_ssh_port: int = 50022
    code_exec_ssh_user: str = "root"
    code_exec_ssh_pass: str = "toor"
    blueprint_path: str = "blueprint.json"
    additional: Dict[str, Any] = field(default_factory=dict)

# intervention exception class - skips rest of message loop iteration
class InterventionException(Exception):
    pass

# killer exception class - not forwarded to LLM, cannot be fixed on its own, ends message loop
class KillerException(Exception):
    pass

class Agent:
    
    def __init__(self, number:int, config: AgentConfig, context: AgentContext|None = None, role: str = "orchestrator"):
        # agent config  
        self.config = config       

        # agent context
        self.context = context or AgentContext(config)

        # non-config vars
        self.number = number
        self.agent_name = f"Agent {self.number}"

        self.history = []
        self.last_message = ""
        self.intervention_message = ""
        self.rate_limiter = rate_limiter.RateLimiter(
            self.context.log,
            max_calls=self.config.rate_limit_requests,
            max_input_tokens=self.config.rate_limit_input_tokens,
            max_output_tokens=self.config.rate_limit_output_tokens,
            window_seconds=self.config.rate_limit_seconds
        )
        self.data = {} # free data object all the tools can use
        self.blueprint_manager = BlueprintManager(self.config.blueprint_path)
        self.subordinate_agents = {}
        self.cache = {}
        self.performance_config = self.blueprint_manager.get_performance_optimization_config()
        self.role = role  # Added role attribute

    async def message_loop(self, msg: str):
        try:
            printer = PrintStyle(italic=True, font_color="#b3ffd9", padding=False)    
            user_message = self.read_prompt("fw.user_message.md", message=msg)
            await self.append_message(user_message, human=True) # Append the user's input to the history                        
            memories = await self.fetch_memories(True)
            
            workflow_steps = self.blueprint_manager.get_workflow_steps()
            for step in workflow_steps:
                self.context.streaming_agent = self #mark self as current streamer
                agent_response = ""

                try:
                    system = self.read_prompt("agent.system.md", agent_name=self.agent_name) + "\n\n" + self.read_prompt("agent.tools.md")
                    memories = await self.fetch_memories()
                    if memories:
                        system += "\n\n" + memories

                    if self.blueprint_manager.should_delegate_task(step.get("name", "")):
                        agent_role = self.blueprint_manager.get_agent_for_task(step.get("name", ""))
                        if agent_role:
                            delegated_response = await self.delegate_task(step, agent_role)
                            agent_response = f"Task '{step.get('name', '')}' delegated to {agent_role}. Response: {delegated_response}"
                    else:
                        cache_key = self.generate_cache_key(step, self.history)
                        cached_response = self.get_from_cache(cache_key)
                        
                        if cached_response:
                            agent_response = cached_response
                        else:
                            prompt = ChatPromptTemplate.from_messages([
                                SystemMessage(content=system),
                                MessagesPlaceholder(variable_name="messages"),
                                HumanMessage(content=step.get("instruction", ""))
                            ])
                            
                            inputs = {"messages": self.history}
                            chain = prompt | self.config.chat_model

                            formatted_inputs = prompt.format(messages=self.history)
                            tokens = int(len(formatted_inputs)/4)     
                            self.rate_limiter.limit_call_and_input(tokens)
                            
                            # output that the agent is starting
                            PrintStyle(bold=True, font_color="green", padding=True, background_color="white").print(f"{self.agent_name}: Generating step {step.get('name', '')}:")
                            log = self.context.log.log(type="agent", heading=f"{self.agent_name}: Generating step {step.get('name', '')}:")
                                      
                            async for chunk in chain.astream(inputs):
                                await self.handle_intervention(agent_response) # wait for intervention and handle it, if paused

                                if isinstance(chunk, str):
                                    content = chunk
                                elif hasattr(chunk, "content"):
                                    content = str(chunk.content)
                                else:
                                    content = str(chunk)
                                
                                if content:
                                    printer.stream(content) # output the agent response stream
                                    agent_response += content # concatenate stream into the response
                                    self.log_from_stream(agent_response, log)

                            self.rate_limiter.set_output_tokens(int(len(agent_response)/4)) # rough estimation
                            
                            self.add_to_cache(cache_key, agent_response)

                    await self.handle_intervention(agent_response)

                    if self.last_message == agent_response: #if assistant_response is the same as last message in history, let him know
                        await self.append_message(agent_response) # Append the assistant's response to the history
                        warning_msg = self.read_prompt("fw.msg_repeat.md")
                        await self.append_message(warning_msg, human=True) # Append warning message to the history
                        PrintStyle(font_color="orange", padding=True).print(warning_msg)
                        self.context.log.log(type="warning", content=warning_msg)

                    else: #otherwise proceed with tool
                        await self.append_message(agent_response) # Append the assistant's response to the history
                        tools_result = await self.process_tools(agent_response) # process tools requested in agent message
                        if tools_result: #final response of message loop available
                            return tools_result #break the execution if the task is done

                except InterventionException as e:
                    pass # intervention message has been handled in handle_intervention(), proceed with conversation loop
                except asyncio.CancelledError as e:
                    PrintStyle(font_color="white", background_color="red", padding=True).print(f"Context {self.context.id} terminated during message loop")
                    raise e # process cancelled from outside, kill the loop
                except KillerException as e:
                    error_message = errors.format_error(e)
                    self.context.log.log(type="error", content=error_message)
                    raise e # kill the loop
                except Exception as e: # Forward other errors to the LLM, maybe it can fix them
                    error_config = self.blueprint_manager.get_error_handling_config()
                    error_message = errors.format_error(e)
                    error_type = type(e).__name__

                    if error_type in error_config.get("error_types", {}):
                        error_action = error_config["error_types"][error_type]["action"]
                        if error_action == "retry":
                            max_retries = error_config["error_types"][error_type].get("max_retries", 1)
                            for _ in range(max_retries):
                                try:
                                    # Retry the current step
                                    continue
                                except Exception:
                                    pass
                        elif error_action == "human_intervention":
                            msg_response = self.read_prompt("fw.error.md", error=error_message)
                            await self.append_message(msg_response, human=True)
                            PrintStyle(font_color="red", padding=True).print(msg_response)
                            self.context.log.log(type="error", content=msg_response)
                    else:
                        msg_response = self.read_prompt("fw.error.md", error=error_message)
                        await self.append_message(msg_response, human=True)
                        PrintStyle(font_color="red", padding=True).print(msg_response)
                        self.context.log.log(type="error", content=msg_response)
                    
        finally:
            self.context.streaming_agent = None # unset current streamer

    async def delegate_task(self, task: Dict[str, Any], agent_role: str) -> str:
        if agent_role not in self.subordinate_agents:
            self.subordinate_agents[agent_role] = Agent(
                len(self.subordinate_agents) + 1, 
                self.config, 
                self.context, 
                role=agent_role  # Assign role to subordinate
            )
        
        subordinate_agent = self.subordinate_agents[agent_role]
        task_instruction = task.get("instruction", "")
        return await subordinate_agent.message_loop(task_instruction)

    def generate_cache_key(self, step: Dict[str, Any], history: List[Any]) -> str:
        # Generate a unique key for caching based on the step and relevant history
        return f"{step['name']}:{hash(str(history[-5:]))}"  # Use last 5 messages for context

    def get_from_cache(self, key: str) -> Optional[str]:
        if self.performance_config.get("caching", {}).get("enabled", False):
            cache_duration = self.performance_config.get("caching", {}).get("cache_duration", 3600)
            cached_item = self.cache.get(key)
            if cached_item and time.time() - cached_item['timestamp'] < cache_duration:
                return cached_item['value']
        return None

    def add_to_cache(self, key: str, value: str):
        if self.performance_config.get("caching", {}).get("enabled", False):
            self.cache[key] = {'value': value, 'timestamp': time.time()}

    def read_prompt(self, file:str, **kwargs):
        content = ""
        if self.config.prompts_subdir:
            try:
                content = files.read_file(files.get_abs_path(f"./prompts/{self.config.prompts_subdir}/{file}"), **kwargs)
            except Exception as e:
                pass
        if not content:
            content = files.read_file(files.get_abs_path(f"./prompts/default/{file}"), **kwargs)
        return content

    def get_data(self, field:str):
        return self.data.get(field, None)

    def set_data(self, field:str, value):
        self.data[field] = value

    async def append_message(self, msg: str, human: bool = False):
        message_type = "human" if human else "ai"
        if self.history and self.history[-1].type == message_type:
            self.history[-1].content += "\n\n" + msg
        else:
            new_message = HumanMessage(content=msg) if human else AIMessage(content=msg)
            self.history.append(new_message)
            await self.cleanup_history(self.config.msgs_keep_max, self.config.msgs_keep_start, self.config.msgs_keep_end)
        if message_type=="ai":
            self.last_message = msg

    def concat_messages(self,messages):
        return "\n".join([f"{msg.type}: {msg.content}" for msg in messages])

    async def send_adhoc_message(self, system: str, msg: str, output_label:str):
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system),
            HumanMessage(content=msg)])

        chain = prompt | self.config.utility_model
        response = ""
        printer = None
        logger = None

        if output_label:
            PrintStyle(bold=True, font_color="orange", padding=True, background_color="white").print(f"{self.agent_name}: {output_label}:")
            printer = PrintStyle(italic=True, font_color="orange", padding=False)
            logger = self.context.log.log(type="adhoc", heading=f"{self.agent_name}: {output_label}:")       

        formatted_inputs = prompt.format()
        tokens = int(len(formatted_inputs)/4)     
        self.rate_limiter.limit_call_and_input(tokens)
    
        async for chunk in chain.astream({}):
            if self.handle_intervention(): break # wait for intervention and handle it, if paused

            if isinstance(chunk, str):
                content = chunk
            elif hasattr(chunk, "content"):
                content = str(chunk.content)
            else:
                content = str(chunk)

            if printer:
                printer.stream(content)
            response += content
            if logger:
                logger.update(content=response)

        self.rate_limiter.set_output_tokens(int(len(response)/4))

        return response
            
    def get_last_message(self):
        if self.history:
            return self.history[-1]

    async def replace_middle_messages(self,middle_messages):
        cleanup_prompt = self.read_prompt("fw.msg_cleanup.md")
        summary = await self.send_adhoc_message(system=cleanup_prompt,msg=self.concat_messages(middle_messages), output_label="Mid messages cleanup summary")
        new_human_message = HumanMessage(content=summary)
        return [new_human_message]

    async def cleanup_history(self, max:int, keep_start:int, keep_end:int):
        if len(self.history) <= max:
            return self.history

        first_x = self.history[:keep_start]
        last_y = self.history[-keep_end:]

        # Identify the middle part
        middle_part = self.history[keep_start:-keep_end]

        # Ensure the first message in the middle is "human", if not, move one message back
        if middle_part and middle_part[0].type != "human":
            if len(first_x) > 0:
                middle_part.insert(0, first_x.pop())

        # Ensure the middle part has an odd number of messages
        if len(middle_part) % 2 == 0:
            middle_part = middle_part[:-1]

        # Replace the middle part using the replacement function
        new_middle_part = await self.replace_middle_messages(middle_part)

        self.history = first_x + new_middle_part + last_y

        return self.history

    async def handle_intervention(self, progress:str=""):
        while self.context.paused:
            await asyncio.sleep(0.1) # wait if paused
        if self.intervention_message: # if there is an intervention message, but not yet processed
            msg = self.intervention_message
            self.intervention_message = "" # reset the intervention message
            if progress.strip():
                await self.append_message(progress) # append the response generated so far
            user_msg = self.read_prompt("fw.intervention.md", user_message=msg) # format the user intervention template
            await self.append_message(user_msg,human=True) # append the intervention message
            raise InterventionException(msg)

    async def process_tools(self, msg: str):
        # search for tool usage requests in agent message
        tool_request = extract_tools.json_parse_dirty(msg)

        if tool_request is not None:
            tool_name = tool_request.get("tool_name", "")
            tool_args = tool_request.get("tool_args", {})
            
            tool_config = self.blueprint_manager.get_tool_integration(tool_name)
            if tool_config:
                # Apply tool-specific configurations from the blueprint
                tool_args.update(tool_config.get("default_args", {}))
            
            tool = self.get_tool(tool_name, tool_args, msg)
                
            await self.handle_intervention() # wait if paused and handle intervention message if needed
            await tool.before_execution(**tool_args)
            await self.handle_intervention() # wait if paused and handle intervention message if needed
            response = await tool.execute(**tool_args)
            await self.handle_intervention() # wait if paused and handle intervention message if needed
            await tool.after_execution(response)
            await self.handle_intervention() # wait if paused and handle intervention message if needed
            if response.break_loop:
                return response.message
        else:
            msg = self.read_prompt("fw.msg_misformat.md")
            await self.append_message(msg, human=True)
            PrintStyle(font_color="red", padding=True).print(msg)
            self.context.log.log(type="error", content=f"{self.agent_name}: Message misformat:")


    def get_tool(self, name: str, args: dict, message: str, **kwargs):
        from python.tools.unknown import Unknown 
        from python.helpers.tool import Tool
        
        tool_class = Unknown
        if files.exists("python/tools",f"{name}.py"): 
            module = importlib.import_module("python.tools." + name)  # Import the module
            class_list = inspect.getmembers(module, inspect.isclass)  # Get all classes in the module

            for cls in class_list:
                if cls[1] is not Tool and issubclass(cls[1], Tool):
                    tool_class = cls[1]
                    break

        return tool_class(agent=self, name=name, args=args, message=message, **kwargs)

    async def fetch_memories(self,reset_skip=False):
        if self.config.auto_memory_count <= 0:
            return ""
        if reset_skip:
            self.memory_skip_counter = 0

        if hasattr(self, 'memory_skip_counter') and self.memory_skip_counter > 0:
            self.memory_skip_counter -= 1
            return ""
        else:
            self.memory_skip_counter = self.config.auto_memory_skip
            from python.tools import memory_tool
            messages = self.concat_messages(self.history)
            memories = memory_tool.search(self, messages)
            input_data = {
                "conversation_history" : messages,
                "raw_memories": memories
            }
            cleanup_prompt = self.read_prompt("msg.memory_cleanup.md").replace("{", "{{")       
            clean_memories = await self.send_adhoc_message(cleanup_prompt, json.dumps(input_data), output_label="Memory injection")
            return clean_memories

    def log_from_stream(self, stream: str, logItem: Log.LogItem):
        try:
            if len(stream) < 25: return # no reason to try
            response = DirtyJson.parse_string(stream)
            if isinstance(response, dict):
                logItem.update(content=stream, kvps=response) #log if result is a dictionary already
        except Exception as e:
            pass

    def call_extension(self, name: str, **kwargs) -> Any:
        pass