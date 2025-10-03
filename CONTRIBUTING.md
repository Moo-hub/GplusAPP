# Contributing to GPlus Smart Builder Pro

Thank you for your interest in contributing to GPlus Smart Builder Pro! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or higher
- Git
- Basic understanding of:
  - Python CLI applications (Typer)
  - Jinja2 templating
  - YAML configuration

### Setting Up Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/Moo-hub/GplusAPP.git
   cd GplusAPP
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Test the installation**
   ```bash
   python app.py --help
   ```

## 🔧 Development Guidelines

### Code Style

- Follow PEP 8 Python style guidelines
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions small and focused

### Project Structure

```
GplusAPP/
├── app.py              # Main CLI application
├── gplus_core.py       # Core functionality
├── config.yaml         # Configuration
├── locales/            # i18n translations
├── templates/          # Project templates
└── template/           # Component templates
```

### Adding New Features

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Update code
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   python app.py about
   python app.py new TestProject -y
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: your feature description"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Adding Translations

We support multiple languages. To add a new language:

1. Create a new YAML file in `locales/` (e.g., `fr.yaml` for French)
2. Copy the structure from `locales/en.yaml`
3. Translate all messages
4. Update `config.yaml` to include the new language in `supported_languages`

Example (`locales/fr.yaml`):
```yaml
app_help_message: "GPlus Smart Builder Pro CLI. Créez des projets intelligemment."
lang_option_help: "Définir la langue de l'interface (ex: 'en', 'ar', 'fr')."
# ... more translations
```

## 🎨 Adding New Components

To add a new component template:

1. Create a new directory in `template/` (e.g., `template/backend_django/`)
2. Add your template files with `.jinja` extension
3. Update `templates/project_template.yaml` to include the component:
   ```yaml
   components:
     - name: "BackendDjango"
       description: "Django backend application"
       template_path: "template/backend_django"
       output_path: "backend/{{ project.slug }}-django"
       files:
         - source: "manage.py.jinja"
       directories:
         - source: "app/"
   ```

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to reproduce**: Exact steps to reproduce the issue
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**:
   - OS (Windows/Linux/macOS)
   - Python version
   - App version (`python app.py about`)
6. **Logs**: Include relevant logs from `logs/` directory

## ✨ Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists or has been requested
2. Clearly describe the feature and its use case
3. Explain why this feature would be useful to the project
4. If possible, provide examples or mockups

## 🧪 Testing

Before submitting a PR:

1. **Test basic commands**
   ```bash
   python app.py about
   python app.py cleanup --yes
   ```

2. **Test project generation**
   ```bash
   python app.py new TestProject -y
   cd TestProject
   # Verify the structure
   ```

3. **Test with different languages**
   ```bash
   python app.py --lang ar about
   ```

## 📚 Documentation

When adding features:

- Update `README.md` if user-facing
- Add inline comments for complex logic
- Update localization files for new messages
- Document new CLI options in `--help` text

## 🤝 Code Review Process

1. All PRs require at least one review
2. Address all review comments
3. Keep PRs focused and small
4. Ensure CI/CD passes (when available)

## 📋 Checklist for Pull Requests

Before submitting a PR, ensure:

- [ ] Code follows PEP 8 style guidelines
- [ ] All new code has docstrings
- [ ] Translations are updated (if applicable)
- [ ] README is updated (if user-facing changes)
- [ ] Changes have been tested manually
- [ ] Commit messages are clear and descriptive
- [ ] No debug code or console.log statements left

## 🎯 Priority Areas

We're currently looking for contributions in:

1. **New component templates** (Flask, Django, Vue.js, Angular, etc.)
2. **Translation improvements** (Arabic, French, Spanish, etc.)
3. **Documentation** (tutorials, examples, guides)
4. **Testing** (unit tests, integration tests)
5. **Bug fixes** (check the issues page)

## 📞 Questions?

If you have questions:

- Check the [README.md](README.md)
- Open a discussion on GitHub
- Check existing issues and PRs

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GPlus Smart Builder Pro! 🚀

*Happy Coding!*
