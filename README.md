# GPlus Smart Builder Pro

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.3.0-orange.svg)](https://github.com/gplus)

**GPlus Smart Builder Pro** is an intelligent project scaffolding tool that helps you quickly generate and configure full-stack web applications with a flexible, component-based architecture.

## 🌟 Features

- **📦 Component-Based Architecture**: Modular components (Backend, Frontend, Docs, etc.)
- **🎨 Template-Driven Generation**: Jinja2-powered templating system
- **🌍 Multilingual Support**: English (en) and Arabic (ar) interfaces
- **⚙️ Configurable Features**: Enable/disable features per project
- **🚀 Quick Start**: Generate complete projects in seconds
- **🔧 Flexible Configuration**: YAML-based project templates
- **📝 Rich CLI**: Beautiful command-line interface with progress indicators

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Creating a New Project](#creating-a-new-project)
- [Configuration](#configuration)
- [Examples](#examples)
- [Arabic Guide](#arabic-guide-الدليل-بالعربية)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Installation

### Prerequisites

- **Python 3.9+** (tested with Python 3.12)
- **pip** (Python package manager)
- **Git** (for cloning the repository)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Moo-hub/GplusAPP.git
cd GplusAPP
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `typer>=0.9.0` - CLI framework
- `rich>=13.0.0` - Terminal formatting
- `Jinja2>=3.1.2` - Template engine
- `PyYAML>=6.0` - YAML parsing
- `pydantic>=2.0.0` - Data validation
- `python-dotenv>=1.0.0` - Environment management
- `cryptography>=41.0.0` - Security features

### Step 3: Verify Installation

```bash
python app.py --help
```

You should see the CLI help menu with available commands.

## 🚀 Quick Start

Generate your first project in 3 steps:

```bash
# 1. Create a new project
python app.py new MyAwesomeProject

# 2. Navigate to your project
cd MyAwesomeProject

# 3. Start developing!
```

## 📖 Usage

### Basic Commands

```bash
# Show application information
python app.py about

# Create a new project (interactive)
python app.py new MyProject

# Create a new project with specific components
python app.py new MyProject -c BackendFastAPI -c FrontendReact

# Clean up temporary files
python app.py cleanup

# Use Arabic language
python app.py --lang ar about
```

## 📁 Project Structure

```
GplusAPP/
├── app.py                  # Main CLI application
├── gplus_core.py          # Core functionality
├── config.yaml            # Application configuration
├── requirements.txt       # Python dependencies
├── locales/               # Internationalization
│   ├── en.yaml           # English translations
│   └── ar.yaml           # Arabic translations
├── templates/             # Project templates
│   └── project_template.yaml
├── template/              # Component templates
│   ├── backend_fastapi/  # FastAPI backend templates
│   ├── frontend_react/   # React frontend templates
│   ├── docs_mkdocs/      # MkDocs documentation
│   └── shared_components/# Shared utilities
├── logs/                  # Application logs
└── cache/                 # Temporary cache
```

## 🎯 Available Commands

### `about`
Displays detailed information about the application, configuration, and environment.

```bash
python app.py about
```

### `new`
Generates a new project based on templates and user selections.

```bash
python app.py new PROJECT_NAME [OPTIONS]
```

**Options:**
- `-o, --output DIRECTORY` - Output directory (default: current directory)
- `-t, --template-config FILE` - Template configuration file
- `-y, --yes` - Skip confirmation prompts
- `-c, --component TEXT` - Select specific components
- `-f, --feature TEXT` - Enable specific features
- `-v, --value TEXT` - Set configuration values

### `cleanup`
Cleans up temporary directories (logs, cache).

```bash
python app.py cleanup [OPTIONS]
```

**Options:**
- `-y, --yes` - Skip confirmation
- `-a, --all` - Remove all temporary directories

### Global Options

- `--lang, -l LANGUAGE` - Set interface language (en/ar)
- `--debug` - Enable debug mode for verbose logging

## 🏗️ Creating a New Project

### Interactive Mode (Recommended for beginners)

```bash
python app.py new MyProject
```

The tool will interactively ask you to:
1. Choose components (Backend, Frontend, Documentation, etc.)
2. Enable/disable features (Docker, CI/CD, Redis, etc.)
3. Configure values (ports, database names, etc.)
4. Confirm your selections

### CLI Mode (For automation)

```bash
# Create a project with specific components
python app.py new MyWebApp \
  -o ./projects \
  -c BackendFastAPI \
  -c FrontendReact \
  -c DocsMkDocs \
  -f docker=true \
  -f ci_cd=true \
  -v port=8000 \
  -y
```

### Available Components

Based on the template structure:
- **Backend FastAPI** - Python FastAPI backend with SQLAlchemy
- **Frontend React** - React + Vite frontend application
- **Documentation MkDocs** - MkDocs documentation site
- **Shared Components** - Common utilities and helpers

### Available Features

Common features you can enable:
- `docker` - Docker containerization
- `ci_cd` - GitHub Actions CI/CD pipeline
- `redis` - Redis caching
- `websocket` - WebSocket support
- `prometheus` - Prometheus monitoring
- `api_docs` - API documentation (Swagger/OpenAPI)

## ⚙️ Configuration

### Application Configuration (`config.yaml`)

```yaml
app_name: "GPlus Smart Builder Pro"
version: "2.3.0"
author: "GPlus"
default_language: "en"
supported_languages:
  - "en"
  - "ar"
log_level: "INFO"
```

### Project Template (`templates/project_template.yaml`)

Define your own project templates with components, features, and custom configurations.

Example structure:
```yaml
project_type: "webapp"
description: "A full-stack web application template"
global_feature_flags:
  use_docker:
    default: true
    description: "Enable Docker containerization"
components:
  - name: "BackendFastAPI"
    description: "FastAPI backend application"
    template_path: "template/backend_fastapi"
    output_path: "backend/{{ project.slug }}-api"
```

## 💡 Examples

### Example 1: Simple Web API

```bash
python app.py new MyAPI \
  -c BackendFastAPI \
  -f docker=true \
  -f api_docs=true \
  -y
```

### Example 2: Full-Stack Application

```bash
python app.py new FullStackApp \
  -c BackendFastAPI \
  -c FrontendReact \
  -c DocsMkDocs \
  -f docker=true \
  -f ci_cd=true \
  -f redis=true \
  -y
```

### Example 3: Documentation Site

```bash
python app.py new MyDocs \
  -c DocsMkDocs \
  -y
```

### Example 4: Using Arabic Language

```bash
python app.py --lang ar new مشروعي
```

## 🌍 Arabic Guide (الدليل بالعربية)

### ماذا عليا أن أفعل هنا؟

**GPlus Smart Builder Pro** هو أداة ذكية لإنشاء المشاريع البرمجية بسرعة وسهولة.

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/Moo-hub/GplusAPP.git
cd GplusAPP

# تثبيت المتطلبات
pip install -r requirements.txt
```

### الاستخدام الأساسي

```bash
# عرض معلومات البرنامج بالعربية
python app.py --lang ar about

# إنشاء مشروع جديد
python app.py --lang ar new مشروعي

# تنظيف الملفات المؤقتة
python app.py --lang ar cleanup
```

### الأوامر المتاحة

1. **`about`** - عرض معلومات التطبيق
2. **`new`** - إنشاء مشروع جديد
3. **`cleanup`** - تنظيف الملفات المؤقتة

### إنشاء مشروع جديد

```bash
# الطريقة التفاعلية (موصى بها)
python app.py --lang ar new مشروعي

# مع مكونات محددة
python app.py --lang ar new مشروعي \
  -c BackendFastAPI \
  -c FrontendReact \
  -y
```

### المكونات المتاحة

- **Backend FastAPI** - خادم API باستخدام FastAPI
- **Frontend React** - واجهة أمامية بتقنية React
- **Documentation MkDocs** - موقع توثيق MkDocs
- **Shared Components** - مكونات مشتركة

### الميزات المتاحة

- `docker` - الحاويات (Containerization)
- `ci_cd` - التكامل والنشر المستمر
- `redis` - التخزين المؤقت Redis
- `websocket` - دعم WebSocket
- `prometheus` - المراقبة Prometheus
- `api_docs` - توثيق API

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [https://www.gplus.com](https://www.gplus.com)
- **GitHub**: [https://github.com/Moo-hub/GplusAPP](https://github.com/Moo-hub/GplusAPP)
- **Documentation**: Check the `docs/` folder in generated projects

## 📞 Support

If you have questions or need help:

1. Check the documentation in your generated project's `docs/` folder
2. Run `python app.py about` for system information
3. Use `--debug` flag for detailed error messages
4. Open an issue on GitHub

---

**Happy Building! 🚀**

*Built with ❤️ by GPlus Team*
