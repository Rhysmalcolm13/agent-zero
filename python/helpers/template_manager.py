# template_manager.py

import json
import os
from python.helpers.template import Template

def get_templates_file_path():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates.json')

def load_templates():
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
    template_file = get_templates_file_path()
    templates_data = [template.to_dict() for template in templates]
    
    with open(template_file, 'w') as f:
        json.dump(templates_data, f, indent=2)

def delete_template(template_id):
    templates = load_templates()
    templates = [t for t in templates if t.id != template_id]
    save_templates(templates)
    return {"ok": True, "message": "Template deleted successfully"}

def get_next_template_id(templates):
    if not templates:
        return "1"
    return str(int(max(int(t.id) for t in templates)) + 1)