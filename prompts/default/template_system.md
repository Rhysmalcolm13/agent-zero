## Workflow Templates

### Initialize Task
~~~json
{
    "step_name": "initialize_task",
    "instruction": "Initialize the main task and gather necessary resources."
}
~~~

### Search Memories
~~~json
{
    "step_name": "search_memories",
    "instruction": "Use knowledge_tool to search in memory for relevant information."
}
~~~

### Search Online
~~~json
{
    "step_name": "search_online",
    "instruction": "Use knowledge_tool to search online sources."
}
~~~

### Generate Subtasks
~~~json
{
    "step_name": "generate_subtasks",
    "instruction": "Break down the task into manageable subtasks."
}
~~~

### Delegate Subtasks
~~~json
{
    "step_name": "delegate_subtasks",
    "instruction": "Delegate each subtask to the appropriate subordinate agent based on roles."
}
~~~

### Aggregate Results
~~~json
{
    "step_name": "aggregate_results",
    "instruction": "Collect and aggregate results from all subordinate agents."
}
~~~

### Verify and Finalize
~~~json
{
    "step_name": "verify_and_finalize",
    "instruction": "Verify the results using available tools and provide the final response to the user."
}
~~~

## Content for python/helpers/templates.json

~~~json
[
    {
        "id": "1",
        "name": "Initialize Task",
        "url": "",
        "navigation_goal": "Set up the main task environment.",
        "data_extraction_goal": "Gather necessary resources and initial data.",
        "advanced_settings": {}
    },
    {
        "id": "2",
        "name": "Search Memories",
        "url": "",
        "navigation_goal": "Retrieve relevant information from memory.",
        "data_extraction_goal": "Use knowledge_tool to fetch relevant memories.",
        "advanced_settings": {}
    },
    {
        "id": "3",
        "name": "Search Online",
        "url": "",
        "navigation_goal": "Gather information from online sources.",
        "data_extraction_goal": "Use knowledge_tool to perform online searches.",
        "advanced_settings": {}
    },
    {
        "id": "4",
        "name": "Generate Subtasks",
        "url": "",
        "navigation_goal": "Break down the main task into smaller subtasks.",
        "data_extraction_goal": "Analyze the main task to create manageable subtasks.",
        "advanced_settings": {}
    },
    {
        "id": "5",
        "name": "Delegate Subtasks",
        "url": "",
        "navigation_goal": "Assign subtasks to appropriate agents.",
        "data_extraction_goal": "Use call_subordinate tool to delegate tasks based on roles.",
        "advanced_settings": {}
    },
    {
        "id": "6",
        "name": "Aggregate Results",
        "url": "",
        "navigation_goal": "Combine results from all subordinate agents.",
        "data_extraction_goal": "Collect and merge outputs from delegated subtasks.",
        "advanced_settings": {}
    },
    {
        "id": "7",
        "name": "Verify and Finalize",
        "url": "",
        "navigation_goal": "Ensure the accuracy of results and complete the task.",
        "data_extraction_goal": "Use available tools to verify results and provide final response.",
        "advanced_settings": {}
    }
]
~~~