from python.helpers.template_manager import Template, load_templates, save_templates, get_next_template_id, delete_template
from python.helpers.tool import Tool, Response
import json

class TemplateTool(Tool):
    async def execute(self, **kwargs):
        """
        Manage templates for website navigation and data extraction.

        :param kwargs: Additional arguments including 'action' to perform (list, create, use, delete, edit)
        :return: A Response object with the result of the operation
        """
        action = kwargs.get('action')
        if action == "list":
            templates = load_templates()
            result = {"ok": True, "templates": [template.to_dict() for template in templates]}

        elif action == "create":
            templates = load_templates()
            new_template = Template(
                id=get_next_template_id(templates),
                name=kwargs.get('name'),
                url=kwargs.get('url', ''),
                navigation_goal=kwargs.get('navigation_goal', ''),
                data_extraction_goal=kwargs.get('data_extraction_goal', ''),
                advanced_settings=kwargs.get('advanced_settings', {})
            )
            templates.append(new_template)
            save_templates(templates)
            result = {"ok": True, "message": "Template created successfully", "template": new_template.to_dict()}

        elif action == "use":
            template_id = kwargs.get('template_id')
            templates = load_templates()
            template = next((t for t in templates if t.id == template_id), None)
            if template:
                prompt = f"Execute template: {template.name}\nURL: {template.url}\nNavigation Goal: {template.navigation_goal}\nData Extraction Goal: {template.data_extraction_goal}"
                if template.advanced_settings:
                    prompt += "\nAdvanced Settings: " + ", ".join(f"{k}: {v}" for k, v in template.advanced_settings.items())
                result = {"ok": True, "message": "Template applied successfully", "prompt": prompt}
            else:
                result = {"ok": False, "message": "Template not found"}

        elif action == "delete":
            template_id = kwargs.get('template_id')
            result = delete_template(template_id)

        elif action == "edit":
            template_id = kwargs.get('template_id')
            templates = load_templates()
            template = next((t for t in templates if t.id == template_id), None)
            if template:
                template.name = kwargs.get('name', template.name)
                template.url = kwargs.get('url', template.url)
                template.navigation_goal = kwargs.get('navigation_goal', template.navigation_goal)
                template.data_extraction_goal = kwargs.get('data_extraction_goal', template.data_extraction_goal)
                template.advanced_settings = kwargs.get('advanced_settings', template.advanced_settings)
                save_templates(templates)
                result = {"ok": True, "message": "Template updated successfully", "template": template.to_dict()}
            else:
                result = {"ok": False, "message": "Template not found"}

        else:
            result = {"ok": False, "message": "Invalid action"}

        return Response(message=json.dumps(result), break_loop=False)