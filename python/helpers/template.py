# template.py

class Template:
    def __init__(self, id, name, description='', http_method='GET', endpoint_url='', headers=None,
                 query_parameters=None, request_body=None, response_mapping=None,
                 error_handling=None, execution_schedule='', url='', navigation_goal='',
                 data_extraction_goal='', advanced_settings=None, tags=None,
                 version='1.0', default_tool='', visibility_options=None,
                 display_order=0, created_at=None, modified_at=None):
        self.id = id
        self.name = name
        self.description = description  # New attribute
        self.http_method = http_method
        self.endpoint_url = endpoint_url
        self.headers = headers or {}
        self.query_parameters = query_parameters or {}
        self.request_body = request_body or {}
        self.response_mapping = response_mapping or {}
        self.error_handling = error_handling or {}
        self.execution_schedule = execution_schedule
        self.url = url
        self.navigation_goal = navigation_goal
        self.data_extraction_goal = data_extraction_goal
        self.advanced_settings = advanced_settings or {}
        self.tags = tags or []
        self.version = version
        self.default_tool = default_tool  # New attribute
        self.visibility_options = visibility_options or {}  # New attribute
        self.display_order = display_order  # New attribute
        self.created_at = created_at  # New attribute
        self.modified_at = modified_at  # New attribute

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,  # Include in dict representation
            "http_method": self.http_method,
            "endpoint_url": self.endpoint_url,
            "headers": self.headers,
            "query_parameters": self.query_parameters,
            "request_body": self.request_body,
            "response_mapping": self.response_mapping,
            "error_handling": self.error_handling,
            "execution_schedule": self.execution_schedule,
            "url": self.url,
            "navigation_goal": self.navigation_goal,
            "data_extraction_goal": self.data_extraction_goal,
            "advanced_settings": self.advanced_settings,
            "tags": self.tags,
            "version": self.version,
            "default_tool": self.default_tool,  # Include in dict representation
            "visibility_options": self.visibility_options,  # Include in dict representation
            "display_order": self.display_order,  # Include in dict representation
            "created_at": str(self.created_at),  # Format as string for JSON serialization
            "modified_at": str(self.modified_at)   # Format as string for JSON serialization
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get('description', ''),  # Capture description from data
            http_method=data.get('http_method', 'GET'),
            endpoint_url=data.get('endpoint_url', ''),
            headers=data.get('headers', {}),
            query_parameters=data.get('query_parameters', {}),
            request_body=data.get('request_body', {}),
            response_mapping=data.get('response_mapping', {}),
            error_handling=data.get('error_handling', {}),
            execution_schedule=data.get('execution_schedule', ''),
            url=data["url"],
            navigation_goal=data["navigation_goal"],
            data_extraction_goal=data["data_extraction_goal"],
            advanced_settings=data.get("advanced_settings", {}),
            tags=data.get("tags", []),
            version=data.get("version", '1.0'),
            default_tool=data.get("default_tool", ''),  # Capture default tool from data
            visibility_options=data.get("visibility_options", {}),  # Capture visibility options from data
            display_order=data.get("display_order", 0),  # Capture display order from data
            created_at=data.get("created_at"),  # Capture creation timestamp from data
            modified_at=data.get("modified_at")   # Capture modification timestamp from data
        )