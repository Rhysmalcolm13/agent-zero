# template_tool.py

from python.helpers.template_manager import load_templates, save_templates, delete_template, get_next_template_id
from python.helpers.tool import Tool, Response
import json
from python.helpers.template import Template

class ITemplateOperation:
    def execute(self):
        raise NotImplementedError("Subclasses should implement this!")

class ApiTemplateOperation(ITemplateOperation):
    def __init__(self, template):
        self.template = template

    def execute(self):
        # Logic to execute API-related operations using attributes of the API template
        print(f"Executing API operation for template: {self.template.name}")
        # Here you would implement the actual API call logic using self.template attributes

class ScrapingTemplateOperation(ITemplateOperation):
    def __init__(self, template):
        self.template = template

    def execute(self):
        # Logic to execute scraping-related operations using attributes of the scraping template
        print(f"Executing scraping operation for template: {self.template.name}")
        # Implement the web scraping logic using self.template attributes

class EmailTemplateOperation(ITemplateOperation):
    def __init__(self, template):
        self.template = template

    def execute(self):
        # Logic to send email using attributes of the email template
        print(f"Sending email using template: {self.template.name}")
        # Implement email sending logic using self.template attributes

class ReportTemplateOperation(ITemplateOperation):
    def __init__(self, template):
        self.template = template

    def execute(self):
        # Logic to generate report using attributes of the report template
        print(f"Generating report using template: {self.template.name}")
        # Implement report generation logic using self.template attributes

class GenericTemplateOperation(ITemplateOperation):
    def __init__(self, template):
        self.template = template

    def execute(self):
        print(f"Executing generic operation for template: {self.template.name}")
        # Implement generic operation logic here

class TemplateTool(Tool):
    async def execute(self, **kwargs):
        action = kwargs.get('action')
        
        if action == "list":
            templates = load_templates()
            result = {"ok": True, "templates": [template.to_dict() for template in templates]}
            return Response(message=json.dumps(result), break_loop=False)

        elif action == "create":
            new_template_type = kwargs.get('type')
            if not new_template_type:
                return Response(
                    message=json.dumps({"ok": False, "message": "'type' is required for create action"}),
                    break_loop=False
                )
            new_template = Template(
                id=get_next_template_id(load_templates()),
                name=kwargs.get('name', ''),
                description=kwargs.get('description', ''),
                http_method=kwargs.get('http_method', 'GET'),
                endpoint_url=kwargs.get('endpoint_url', ''),
                headers=kwargs.get('headers', {}),
                query_parameters=kwargs.get('query_parameters', {}),
                request_body=kwargs.get('request_body', {}),
                response_mapping=kwargs.get('response_mapping', {}),
                error_handling=kwargs.get('error_handling', {}),
                execution_schedule=kwargs.get('execution_schedule', ''),
                url=kwargs.get('url', ''),
                navigation_goal=kwargs.get('navigation_goal', ''),
                data_extraction_goal=kwargs.get('data_extraction_goal', ''),
                advanced_settings=kwargs.get('advanced_settings', {}),
                tags=kwargs.get('tags', []),
                version=kwargs.get('version', '1.0'),
                default_tool=kwargs.get('default_tool', ''),
                visibility_options=kwargs.get('visibility_options', {}),
                display_order=kwargs.get('display_order', 0),
                created_at=kwargs.get('created_at'),
                modified_at=kwargs.get('modified_at')
            )
            
            operation_class_map = {
                'api': ApiTemplateOperation,
                'scraping': ScrapingTemplateOperation,
                'email': EmailTemplateOperation,
                'report': ReportTemplateOperation,
                'generic': GenericTemplateOperation,  # Added 'generic' type
            }
            
            operation_class = operation_class_map[new_template_type]
            operation_instance = operation_class(new_template)
            operation_instance.execute()  # Execute the appropriate operation
            
            save_templates(load_templates() + [new_template])  # Save new template
            return Response(message=json.dumps({"ok": True, "message": "Template created successfully"}), break_loop=False)

        elif action == "edit":
            template_id = kwargs['template_id']
            templates = load_templates()
            existing_template = next((t for t in templates if t.id == template_id), None)
            
            if existing_template:
                existing_template.name = kwargs.get('name', existing_template.name)
                existing_template.description = kwargs.get('description', existing_template.description)
                existing_template.http_method = kwargs.get('http_method', existing_template.http_method)
                existing_template.endpoint_url = kwargs.get('endpoint_url', existing_template.endpoint_url)
                existing_template.headers = kwargs.get('headers', existing_template.headers)
                existing_template.query_parameters = kwargs.get('query_parameters', existing_template.query_parameters)
                existing_template.request_body = kwargs.get('request_body', existing_template.request_body)
                existing_template.response_mapping = kwargs.get('response_mapping', existing_template.response_mapping)
                existing_template.error_handling = kwargs.get('error_handling', existing_template.error_handling)
                existing_template.execution_schedule = kwargs.get('execution_schedule', existing_template.execution_schedule)
                existing_template.url = kwargs.get('url', existing_template.url)
                existing_template.navigation_goal = kwargs.get('navigation_goal', existing_template.navigation_goal)
                existing_template.data_extraction_goal = kwargs.get('data_extraction_goal', existing_template.data_extraction_goal)
                existing_template.advanced_settings = kwargs.get('advanced_settings', existing_template.advanced_settings)
                existing_template.tags = kwargs.get('tags', existing_template.tags)
                existing_template.version = kwargs.get('version', existing_template.version)
                existing_template.default_tool = kwargs.get('default_tool', existing_template.default_tool)
                existing_template.visibility_options = kwargs.get('visibility_options', existing_template.visibility_options)
                existing_template.display_order = kwargs.get('display_order', existing_template.display_order)
                existing_template.created_at = kwargs.get('created_at', existing_template.created_at)
                existing_template.modified_at = kwargs.get('modified_at', existing_template.modified_at)
                
                save_templates(templates)  # Save updated templates
                return Response(message=json.dumps({"ok": True, "message": "Template updated successfully"}), break_loop=False)
            
            return Response(message=json.dumps({"ok": False, "message": "Template not found"}), break_loop=False)

        elif action == "delete":
            template_id = kwargs['template_id']
            result = delete_template(template_id)  # Delete the specified template
            return Response(message=json.dumps(result), break_loop=False)

        else:
            return Response(message=json.dumps({"ok": False, "message": "Invalid action"}), break_loop=False)