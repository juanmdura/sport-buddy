from google.adk.tools.openapi_tool import OpenAPIToolset

openapi_spec_string = """
{
  "openapi": "3.0.0",
  "info": {
    "title": "Nationalize.io API",
    "description": "Predict the nationality of a name.",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.nationalize.io"
    }
  ],
  "paths": {
    "/": {
      "get": {
        "summary": "Predict nationality by name",
        "parameters": [
          {
            "name": "name",
            "in": "query",
            "required": true,
            "description": "The name to predict the nationality of.",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "count": {
                      "type": "integer",
                      "description": "The number of entries in the dataset for the given name."
                    },
                    "name": {
                      "type": "string",
                      "description": "The name for which the prediction is made."
                    },
                    "country": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "country_id": {
                            "type": "string",
                            "description": "The two-letter country code."
                          },
                          "probability": {
                            "type": "number",
                            "format": "float",
                            "description": "The probability of the name belonging to this country."
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
"""

# --- Create OpenAPIToolset ---
nationality_toolset = OpenAPIToolset(
    spec_str=openapi_spec_string,
    spec_str_type='json',
)