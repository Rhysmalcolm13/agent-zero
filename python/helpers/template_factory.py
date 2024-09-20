# template_factory.py

import json
import os
from python.helpers.template import Template

def get_templates_file_path():
    """Get the file path for storing templates."""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates.json')

def load_templates():
    """Load templates from the JSON file."""
    template_file = get_templates_file_path()
    if not os.path.exists(template_file):
        return []
    
    try:
        with open(template_file, 'r') as f:
            data = json.load(f)
            return [Template.from_dict(item) for item in data]
    except json.JSONDecodeError:
        print(f"Error decoding {template_file}. Starting with empty templates.")
        return []
    except Exception as e:
        print(f"Unexpected error loading templates: {str(e)}")
        return []

def save_templates(templates):
    """Save the list of templates to the JSON file."""
    template_file = get_templates_file_path()
    templates_data = []
    for template in templates:
        template_dict = template.to_dict()
        templates_data.append(template_dict)
    
    with open(template_file, 'w') as f:
        json.dump(templates_data, f, indent=2)

def delete_template(template_id):
    """Delete a template by its ID."""
    templates = load_templates()
    templates = [t for t in templates if t.id != template_id]
    save_templates(templates)
    return {"ok": True, "message": "Template deleted successfully"}

def get_next_template_id(templates):
    """Get the next available template ID."""
    if not templates:
        return "1"
    return str(int(max(int(t.id) for t in templates)) + 1)

class TemplateFactory:
    @staticmethod
    def create_template(template_type, **kwargs):
        """Create a new template based on its type."""
        if template_type == 'api':
            return Template(
                id=kwargs.get('id', ''),
                name=kwargs.get('name', ''),
                description=kwargs.get('description', ''),  # New attribute
                http_method=kwargs.get('http_method', 'GET'),
                endpoint_url=kwargs.get('endpoint_url', ''),
                headers=kwargs.get('headers', {}),
                query_parameters=kwargs.get('query_parameters', {}),
                request_body=kwargs.get('request_body', {}),
                response_mapping=kwargs.get('response_mapping', {}),
                error_handling=kwargs.get('error_handling', {}),
                execution_schedule=kwargs.get('execution_schedule', ''),
                tags=kwargs.get('tags', []),  # New attribute
                version=kwargs.get('version', '1.0'),  # New attribute
                default_tool=kwargs.get('default_tool', ''),  # New attribute
                visibility_options=kwargs.get('visibility_options', {}),  # New attribute
                display_order=kwargs.get('display_order', 0),  # New attribute
                created_at=kwargs.get('created_at'),  # New attribute
                modified_at=kwargs.get('modified_at')   # New attribute
            )
        elif template_type == 'scraping':
            return Template(
                id=kwargs.get('id', ''),
                name=kwargs.get('name', ''),
                description=kwargs.get('description', ''),  # New attribute
                url=kwargs.get('url', ''),
                navigation_goal=kwargs.get('navigation_goal', ''),
                data_extraction_goal=kwargs.get('data_extraction_goal', ''),
                tags=kwargs.get('tags', []),  # New attribute
                version=kwargs.get('version', '1.0'),  # New attribute
                default_tool=kwargs.get('default_tool', ''),  # New attribute
                visibility_options=kwargs.get('visibility_options', {}),  # New attribute
                display_order=kwargs.get('display_order', 0),  # New attribute
                created_at=kwargs.get('created_at'),  # New attribute
                modified_at=kwargs.get('modified_at')   # New attribute
            )
        elif template_type == 'email':
            return Template(
                id=kwargs.get('id', ''),
                name=kwargs.get('name', ''),
                description=kwargs.get('description', ''),  # New attribute
                tags=kwargs.get('tags', []),  # New attribute
                version=kwargs.get('version', '1.0'),  # New attribute
                default_tool=kwargs.get('default_tool', ''),  # New attribute
                visibility_options=kwargs.get('visibility_options', {}),  # New attribute
                display_order=kwargs.get('display_order', 0),  # New attribute
                created_at=kwargs.get('created_at'),  # New attribute
                modified_at=kwargs.get('modified_at')   # New attribute
            )
        elif template_type == 'report':
            return Template(
                id=kwargs.get('id', ''),
                name=kwargs.get('name', ''),
                description=kwargs.get('description', ''),  # New attribute
                tags=kwargs.get('tags', []),  # New attribute
                version=kwargs.get('version', '1.0'),  # New attribute
                default_tool=kwargs.get('default_tool', ''),  # New attribute
                visibility_options=kwargs.get('visibility_options', {}),  # New attribute
                display_order=kwargs.get('display_order', 0),  # New attribute
                created_at=kwargs.get('created_at'),  # New attribute
                modified_at=kwargs.get('modified_at')   # New attribute
            )
        else:
            raise ValueError(f"Unknown template type: {template_type}")