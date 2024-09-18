import json
import os

class Template:
    def __init__(self, id, name, url, navigation_goal, data_extraction_goal, advanced_settings=None):
        self.id = id
        self.name = name
        self.url = url
        self.navigation_goal = navigation_goal
        self.data_extraction_goal = data_extraction_goal
        self.advanced_settings = advanced_settings or {}

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "navigation_goal": self.navigation_goal,
            "data_extraction_goal": self.data_extraction_goal,
            "advanced_settings": self.advanced_settings
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data["id"],
            name=data["name"],
            url=data["url"],
            navigation_goal=data["navigation_goal"],
            data_extraction_goal=data["data_extraction_goal"],
            advanced_settings=data.get("advanced_settings", {})
        )

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
    templates_data = []
    for i, template in enumerate(templates, start=1):
        template_dict = template.to_dict()
        template_dict['id'] = str(i)
        templates_data.append(template_dict)
    
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