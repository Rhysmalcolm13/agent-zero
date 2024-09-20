import json
from typing import Any, Dict, List, Optional

class BlueprintManager:
    def __init__(self, blueprint_path: str):
        with open(blueprint_path, 'r') as f:
            self.blueprint = json.load(f)

    def get_task_definition(self) -> Dict[str, Any]:
        return self.blueprint.get('task_definition', {})

    def get_delegation_criteria(self) -> Dict[str, Any]:
        return self.blueprint.get('delegation', {}).get('agent_selection_criteria', {})

    def get_error_handling_config(self) -> Dict[str, Any]:
        return self.blueprint.get('error_handling', {})

    def get_workflow_steps(self) -> List[Dict[str, Any]]:
        return self.blueprint.get('workflow', {}).get('steps', [])

    def get_tool_config(self) -> Dict[str, Any]:
        return self.blueprint.get('tools', {})

    def get_communication_config(self) -> Dict[str, Any]:
        return self.blueprint.get('communication', {})

    def get_multi_agent_config(self) -> Dict[str, Any]:
        return self.blueprint.get('multi_agent_collaboration', {})

    def get_template_management_config(self) -> Dict[str, Any]:
        return self.blueprint.get('template_management', {})

    def get_performance_optimization_config(self) -> Dict[str, Any]:
        return self.blueprint.get('performance_optimization', {})

    def get_tool_integration(self, tool_name: str) -> Optional[Dict[str, Any]]:
        return self.blueprint.get('tools', {}).get('tool_integration', {}).get(tool_name)

    def should_delegate_task(self, task: str) -> bool:
        delegation_criteria = self.get_delegation_criteria()
        roles = delegation_criteria.get("role_based", {})
        skills = delegation_criteria.get("skill_based", {})
        
        # Example logic to decide delegation
        # Adjust based on your actual criteria
        required_role = self.blueprint.get('task_definition', {}).get('main_task', '')
        return required_role in roles

    def get_agent_for_task(self, task: str) -> Optional[str]:
        delegation_criteria = self.get_delegation_criteria()
        roles = delegation_criteria.get("role_based", {})
        skills = delegation_criteria.get("skill_based", {})
        load_balancing = delegation_criteria.get("load_balancing", "round_robin")
        
        # Implement role-based selection
        for role, tasks in roles.items():
            if task in tasks:
                return role  # Return the role name

        return None  # If no suitable agent found