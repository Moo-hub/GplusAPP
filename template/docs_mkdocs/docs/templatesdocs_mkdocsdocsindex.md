```markdown
# Welcome to {{ project.name }} Documentation!

This is the official documentation for the **{{ project.name }}** project.

## About this Project

{{ project.description }}

## Getting Started

You can find more information about setting up and running the project in the [Getting Started]({{ 'getting_started.md' if component_features.DocsMkDocs.mermaid_diagrams else '#Getting-Started' }}) section.

## API Reference

For detailed information about the API endpoints, refer to the [API Reference]({{ 'api_reference.md' if component_features.DocsMkDocs.mermaid_diagrams else '#API-Reference' }}) section.

## Contributing

We welcome contributions! Please see our [Contributing Guide]({{ 'contributing.md' if component_features.DocsMkDocs.mermaid_diagrams else '#Contributing' }}) for more details.

---

* **Project Version:** `{{ project.version }}`
* **Author:** `{{ project.author }}`
* **Generated On:** `{{ project.current_year }}`

{% if component_features.DocsMkDocs.mermaid_diagrams %}
## Example Mermaid Diagram

```mermaid
graph TD;
    A[User] --> B(Frontend);
    B --> C{API Gateway};
    C --> D[Backend FastAPI];
    D --> E[Database];
    C --> F[External Service];
