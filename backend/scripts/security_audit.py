#!/usr/bin/env python
"""
Security Audit Tool for GPlus Recycling App
This script performs a comprehensive security audit of the application,
including dependency scanning, code analysis, configuration checks, and
penetration testing.

Usage:
  python security_audit.py --scope [all|dependencies|code|config|pentest]
  python security_audit.py --scope pentest --target http://localhost:8000
"""

import os
import sys
import json
import subprocess
import argparse
import datetime
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# Configure paths
BACKEND_DIR = Path(__file__).parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
REPORT_DIR = PROJECT_ROOT / "security_reports"


class SecurityAuditTool:
    def __init__(self, report_dir: Path = REPORT_DIR):
        """Initialize the security audit tool"""
        self.report_dir = report_dir
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.report_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "summary": {
                "vulnerabilities": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0
                },
                "scanned_files": 0,
                "scanned_dependencies": 0,
                "security_issues": []
            },
            "dependency_scan": {},
            "code_scan": {},
            "config_scan": {}
        }
        
        # Create report directory if it doesn't exist
        if not self.report_dir.exists():
            self.report_dir.mkdir(parents=True)
    
    def run_audit(self, scope: str = "all"):
        """Run the security audit with the specified scope"""
        print(f"\n{'=' * 80}")
        print(f"Starting Security Audit (Scope: {scope})")
        print(f"{'=' * 80}")
        
        if scope in ("all", "dependencies"):
            self._audit_dependencies()
        
        if scope in ("all", "code"):
            self._audit_code()
        
        if scope in ("all", "config"):
            self._audit_configuration()
        
        self._generate_report()
        
        print(f"\n{'=' * 80}")
        print(f"Security Audit Completed")
        print(f"Report saved to: {self.report_dir / f'security_audit_{self.timestamp}.json'}")
        print(f"Summary saved to: {self.report_dir / f'security_audit_{self.timestamp}.md'}")
        print(f"{'=' * 80}\n")
        
        # Print summary
        self._print_summary()
    
    def _audit_dependencies(self):
        """Audit application dependencies for security vulnerabilities"""
        print("\n[+] Auditing Dependencies...")
        
        # Backend Python dependencies
        self._audit_python_dependencies()
        
        # Frontend Node.js dependencies
        self._audit_node_dependencies()
    
    def _audit_python_dependencies(self):
        """Audit Python dependencies using safety"""
        try:
            print("  [*] Scanning Python dependencies...")
            
            # Generate requirements report
            req_path = BACKEND_DIR / "requirements.txt"
            if not req_path.exists():
                print(f"  [!] Warning: requirements.txt not found at {req_path}")
                return
            
            # Try to run safety check (pip install safety)
            try:
                output = subprocess.check_output(
                    ["safety", "check", "-r", str(req_path), "--json"],
                    stderr=subprocess.STDOUT,
                    text=True
                )
                results = json.loads(output)
                
                # Process results
                vulnerabilities = []
                for vuln in results.get("vulnerabilities", []):
                    severity = self._map_severity(vuln.get("severity", ""))
                    self.report_data["summary"]["vulnerabilities"][severity] += 1
                    
                    vulnerability = {
                        "package": vuln.get("package_name"),
                        "installed_version": vuln.get("analyzed_version"),
                        "vulnerable_versions": vuln.get("vulnerable_spec"),
                        "description": vuln.get("advisory"),
                        "severity": severity,
                        "recommendation": f"Update to {vuln.get('closest_safe_version', 'latest version')}"
                    }
                    vulnerabilities.append(vulnerability)
                    
                    # Add to summary issues
                    if severity in ("critical", "high"):
                        self.report_data["summary"]["security_issues"].append(
                            f"[{severity.upper()}] {vuln.get('package_name')}: {vuln.get('advisory')}"
                        )
                
                # Store in report
                self.report_data["dependency_scan"]["python"] = {
                    "dependencies_checked": results.get("scanned_packages", 0),
                    "vulnerabilities": vulnerabilities
                }
                self.report_data["summary"]["scanned_dependencies"] += results.get("scanned_packages", 0)
                
                print(f"  [✓] Scanned {results.get('scanned_packages', 0)} Python packages")
            
            except subprocess.CalledProcessError as e:
                print(f"  [!] Error running safety: {e}")
                if e.output:
                    print(f"  [!] Output: {e.output}")
                print("  [!] Is safety installed? Run: pip install safety")
                
                # Store error in report
                self.report_data["dependency_scan"]["python"] = {
                    "error": f"Failed to run safety: {str(e)}"
                }
            
            except json.JSONDecodeError:
                print("  [!] Error parsing safety output")
                # Store error in report
                self.report_data["dependency_scan"]["python"] = {
                    "error": "Failed to parse safety output"
                }
                
        except Exception as e:
            print(f"  [!] Unexpected error during Python dependency audit: {e}")
            self.report_data["dependency_scan"]["python"] = {
                "error": f"Unexpected error: {str(e)}"
            }
    
    def _audit_node_dependencies(self):
        """Audit Node.js dependencies using npm audit"""
        try:
            print("  [*] Scanning Node.js dependencies...")
            
            # Check if package.json exists
            package_json_path = PROJECT_ROOT / "frontend" / "package.json"
            if not package_json_path.exists():
                print(f"  [!] Warning: package.json not found at {package_json_path}")
                return
            
            # Change directory to frontend
            original_dir = os.getcwd()
            os.chdir(PROJECT_ROOT / "frontend")
            
            try:
                # Run npm audit
                output = subprocess.check_output(
                    ["npm", "audit", "--json"],
                    stderr=subprocess.STDOUT,
                    text=True
                )
                results = json.loads(output)
                
                # Process results
                vulnerabilities = []
                for adv_id, adv in results.get("advisories", {}).items():
                    severity = adv.get("severity", "").lower()
                    self.report_data["summary"]["vulnerabilities"][severity] += 1
                    
                    vulnerability = {
                        "package": adv.get("module_name"),
                        "severity": severity,
                        "title": adv.get("title"),
                        "vulnerable_versions": adv.get("vulnerable_versions"),
                        "recommendation": adv.get("recommendation"),
                        "url": adv.get("url"),
                        "path": adv.get("findings", [{}])[0].get("paths", [])[0] if adv.get("findings") else ""
                    }
                    vulnerabilities.append(vulnerability)
                    
                    # Add to summary issues
                    if severity in ("critical", "high"):
                        self.report_data["summary"]["security_issues"].append(
                            f"[{severity.upper()}] {adv.get('module_name')}: {adv.get('title')}"
                        )
                
                # Store in report
                self.report_data["dependency_scan"]["node"] = {
                    "dependencies_checked": results.get("metadata", {}).get("totalDependencies", 0),
                    "vulnerabilities": vulnerabilities
                }
                self.report_data["summary"]["scanned_dependencies"] += results.get("metadata", {}).get("totalDependencies", 0)
                
                print(f"  [✓] Scanned {results.get('metadata', {}).get('totalDependencies', 0)} Node.js packages")
            
            except subprocess.CalledProcessError as e:
                print(f"  [!] Error running npm audit: {e}")
                if e.output:
                    print(f"  [!] Output: {e.output}")
                    
                # Store error in report
                self.report_data["dependency_scan"]["node"] = {
                    "error": f"Failed to run npm audit: {str(e)}"
                }
            
            except json.JSONDecodeError:
                print("  [!] Error parsing npm audit output")
                # Store error in report
                self.report_data["dependency_scan"]["node"] = {
                    "error": "Failed to parse npm audit output"
                }
            
            finally:
                # Change back to original directory
                os.chdir(original_dir)
                
        except Exception as e:
            print(f"  [!] Unexpected error during Node.js dependency audit: {e}")
            self.report_data["dependency_scan"]["node"] = {
                "error": f"Unexpected error: {str(e)}"
            }
    
    def _audit_code(self):
        """Audit code for security vulnerabilities"""
        print("\n[+] Auditing Code...")
        
        # Backend Python code
        self._audit_python_code()
        
        # Frontend JavaScript code
        self._audit_javascript_code()
    
    def _audit_python_code(self):
        """Audit Python code using bandit"""
        try:
            print("  [*] Scanning Python code...")
            
            # Try to run bandit (pip install bandit)
            try:
                output = subprocess.check_output(
                    ["bandit", "-r", str(BACKEND_DIR / "app"), "-f", "json"],
                    stderr=subprocess.STDOUT,
                    text=True
                )
                results = json.loads(output)
                
                # Process results
                vulnerabilities = []
                for result in results.get("results", []):
                    severity = result.get("issue_severity", "").lower()
                    self.report_data["summary"]["vulnerabilities"][severity] += 1
                    
                    vulnerability = {
                        "file": result.get("filename"),
                        "line": result.get("line_number"),
                        "severity": severity,
                        "confidence": result.get("issue_confidence"),
                        "issue_type": result.get("test_id"),
                        "issue_text": result.get("issue_text"),
                        "code": result.get("code")
                    }
                    vulnerabilities.append(vulnerability)
                    
                    # Add to summary issues
                    if severity in ("critical", "high"):
                        self.report_data["summary"]["security_issues"].append(
                            f"[{severity.upper()}] {result.get('filename')}:{result.get('line_number')} - {result.get('issue_text')}"
                        )
                
                # Store in report
                self.report_data["code_scan"]["python"] = {
                    "files_checked": results.get("metrics", {}).get("_totals", {}).get("loc", 0),
                    "vulnerabilities": vulnerabilities
                }
                self.report_data["summary"]["scanned_files"] += results.get("metrics", {}).get("_totals", {}).get("loc", 0)
                
                print(f"  [✓] Scanned {len(results.get('metrics', {}).keys()) - 1} Python files")
            
            except subprocess.CalledProcessError as e:
                print(f"  [!] Error running bandit: {e}")
                if e.output:
                    print(f"  [!] Output: {e.output}")
                print("  [!] Is bandit installed? Run: pip install bandit")
                
                # Store error in report
                self.report_data["code_scan"]["python"] = {
                    "error": f"Failed to run bandit: {str(e)}"
                }
            
            except json.JSONDecodeError:
                print("  [!] Error parsing bandit output")
                # Store error in report
                self.report_data["code_scan"]["python"] = {
                    "error": "Failed to parse bandit output"
                }
                
        except Exception as e:
            print(f"  [!] Unexpected error during Python code audit: {e}")
            self.report_data["code_scan"]["python"] = {
                "error": f"Unexpected error: {str(e)}"
            }
    
    def _audit_javascript_code(self):
        """Audit JavaScript code using ESLint with security plugin"""
        try:
            print("  [*] Scanning JavaScript code...")
            
            # Check if eslint is available in the frontend directory
            frontend_dir = PROJECT_ROOT / "frontend"
            if not frontend_dir.exists():
                print(f"  [!] Warning: frontend directory not found at {frontend_dir}")
                return
            
            # Create temporary ESLint config with security rules if it doesn't exist
            eslint_config_path = frontend_dir / ".eslintrc-security.js"
            if not eslint_config_path.exists():
                with open(eslint_config_path, "w") as f:
                    f.write("""module.exports = {
  "extends": [
    "eslint:recommended",
    "plugin:security/recommended"
  ],
  "plugins": [
    "security"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-non-literal-require": "warn",
    "security/detect-eval-with-expression": "error"
  }
};
""")
            
            # Change directory to frontend
            original_dir = os.getcwd()
            os.chdir(frontend_dir)
            
            try:
                # Check if eslint and security plugin are installed
                try:
                    subprocess.check_output(
                        ["npx", "eslint", "--version"],
                        stderr=subprocess.STDOUT,
                        text=True
                    )
                except subprocess.CalledProcessError:
                    print("  [!] ESLint not found. Trying to install...")
                    subprocess.check_output(
                        ["npm", "install", "--no-save", "eslint", "eslint-plugin-security"],
                        stderr=subprocess.STDOUT,
                        text=True
                    )
                
                # Run ESLint with security plugin
                cmd = [
                    "npx", "eslint", 
                    "--no-eslintrc",
                    "-c", ".eslintrc-security.js",
                    "--ext", ".js,.jsx", 
                    "--format", "json", 
                    "src"
                ]
                
                output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
                results = json.loads(output)
                
                # Process results
                vulnerabilities = []
                for file_result in results:
                    for message in file_result.get("messages", []):
                        if message.get("ruleId", "").startswith("security/"):
                            severity = self._map_eslint_severity(message.get("severity", 1))
                            self.report_data["summary"]["vulnerabilities"][severity] += 1
                            
                            vulnerability = {
                                "file": file_result.get("filePath").replace(str(PROJECT_ROOT), ""),
                                "line": message.get("line"),
                                "column": message.get("column"),
                                "rule": message.get("ruleId"),
                                "severity": severity,
                                "message": message.get("message")
                            }
                            vulnerabilities.append(vulnerability)
                            
                            # Add to summary issues
                            if severity in ("critical", "high"):
                                self.report_data["summary"]["security_issues"].append(
                                    f"[{severity.upper()}] {vulnerability['file']}:{vulnerability['line']} - {vulnerability['message']}"
                                )
                
                # Store in report
                self.report_data["code_scan"]["javascript"] = {
                    "files_checked": len(results),
                    "vulnerabilities": vulnerabilities
                }
                self.report_data["summary"]["scanned_files"] += len(results)
                
                print(f"  [✓] Scanned {len(results)} JavaScript files")
            
            except subprocess.CalledProcessError as e:
                print(f"  [!] Error running ESLint: {e}")
                if e.output:
                    print(f"  [!] Output: {e.output}")
                
                # Store error in report
                self.report_data["code_scan"]["javascript"] = {
                    "error": f"Failed to run ESLint: {str(e)}"
                }
            
            except json.JSONDecodeError:
                print("  [!] Error parsing ESLint output")
                # Store error in report
                self.report_data["code_scan"]["javascript"] = {
                    "error": "Failed to parse ESLint output"
                }
            
            finally:
                # Remove temporary ESLint config
                if eslint_config_path.exists():
                    eslint_config_path.unlink()
                
                # Change back to original directory
                os.chdir(original_dir)
                
        except Exception as e:
            print(f"  [!] Unexpected error during JavaScript code audit: {e}")
            self.report_data["code_scan"]["javascript"] = {
                "error": f"Unexpected error: {str(e)}"
            }
    
    def _audit_configuration(self):
        """Audit application configuration for security issues"""
        print("\n[+] Auditing Configuration...")
        
        # Check for sensitive information in configuration files
        self._audit_secrets_in_config()
        
        # Check security headers and settings
        self._audit_security_settings()
        
        # Check Docker configuration
        self._audit_docker_config()
    
    def _audit_secrets_in_config(self):
        """Audit configuration files for secrets"""
        try:
            print("  [*] Checking for secrets in configuration files...")
            
            # Define patterns to search for
            secret_patterns = {
                "api_key": r"(api|app)_?(key|secret)",
                "password": r"password|passwd|pwd",
                "token": r"token|jwt|auth",
                "connection_string": r"connection[_\s]string",
                "private_key": r"private[_\s]?key",
                "secret": r"secret"
            }
            
            # Define files to check (relative to project root)
            files_to_check = [
                ".env",
                ".env.example",
                ".env.dev",
                ".env.prod",
                "docker-compose.yml",
                "docker-compose.dev.yml",
                "docker-compose.prod.yml",
                "backend/app/core/config.py",
                "frontend/.env",
                "frontend/.env.development",
                "frontend/.env.production"
            ]
            
            # Track findings
            findings = []
            files_checked = 0
            
            for file_path in files_to_check:
                full_path = PROJECT_ROOT / file_path
                if not full_path.exists():
                    continue
                
                files_checked += 1
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    for secret_type, pattern in secret_patterns.items():
                        matches = re.finditer(rf"({pattern})[=:\s]+[\'\"]?([^\'\"\s]+)[\'\"]?", content, re.IGNORECASE)
                        for match in matches:
                            value = match.group(2)
                            if (len(value) > 8 and 
                                not value.lower().startswith(("http://", "https://")) and
                                "${" not in value):  # Skip environment variables
                                
                                # Check if it looks like a real secret (not a placeholder)
                                if not re.match(r'^(your_|placeholder|example|changeme)', value.lower()):
                                    finding = {
                                        "file": file_path,
                                        "secret_type": secret_type,
                                        "line": content[:match.start()].count('\n') + 1,
                                        "severity": "high" if ".example" not in file_path else "medium"
                                    }
                                    findings.append(finding)
                                    
                                    # Add to summary issues
                                    if finding["severity"] == "high":
                                        self.report_data["summary"]["security_issues"].append(
                                            f"[HIGH] Potential hardcoded secret in {file_path}:{finding['line']} ({secret_type})"
                                        )
                                    
                                    self.report_data["summary"]["vulnerabilities"][finding["severity"]] += 1
            
            # Store in report
            self.report_data["config_scan"]["secrets"] = {
                "files_checked": files_checked,
                "findings": findings
            }
            
            print(f"  [✓] Checked {files_checked} configuration files for secrets")
            if findings:
                print(f"  [!] Found {len(findings)} potential hardcoded secrets")
                
        except Exception as e:
            print(f"  [!] Unexpected error during secrets audit: {e}")
            self.report_data["config_scan"]["secrets"] = {
                "error": f"Unexpected error: {str(e)}"
            }
    
    def _audit_security_settings(self):
        """Audit security settings in the application"""
        try:
            print("  [*] Checking security settings...")
            
            # Define security best practices to check
            security_checks = {
                "cors_settings": {
                    "file": "backend/app/main.py",
                    "pattern": r"CORSMiddleware\([^)]*allow_origins\s*=\s*\[([^\]]*)\]",
                    "message": "Check CORS settings - make sure only trusted origins are allowed",
                    "severity": "medium"
                },
                "jwt_algorithm": {
                    "file": "backend/app/core/config.py",
                    "pattern": r"JWT_ALGORITHM\s*=\s*['\"]([^'\"]+)['\"]",
                    "expected": "HS256|RS256",
                    "message": "JWT algorithm should be HS256 or RS256",
                    "severity": "medium"
                },
                "access_token_expiry": {
                    "file": "backend/app/core/config.py",
                    "pattern": r"ACCESS_TOKEN_EXPIRE_MINUTES\s*=\s*(\d+)",
                    "expected_max": 60,  # 1 hour
                    "message": "Access token expiry should not be too long (recommended < 60 minutes)",
                    "severity": "medium"
                },
                "csrf_protection": {
                    "file": "backend/app/middlewares/security.py",
                    "pattern": r"class\s+CSRFProtection",
                    "message": "CSRF protection should be implemented",
                    "severity": "high"
                },
                "rate_limiting": {
                    "file": "backend/app/middlewares/security.py",
                    "pattern": r"class\s+RateLimiter",
                    "message": "Rate limiting should be implemented",
                    "severity": "medium"
                }
            }
            
            # Track findings
            findings = []
            
            for check_name, check in security_checks.items():
                file_path = PROJECT_ROOT / check["file"]
                if not file_path.exists():
                    findings.append({
                        "check": check_name,
                        "file": check["file"],
                        "message": f"File not found: {check['file']}",
                        "severity": check["severity"]
                    })
                    continue
                
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    # Check pattern
                    match = re.search(check["pattern"], content)
                    if not match:
                        findings.append({
                            "check": check_name,
                            "file": check["file"],
                            "message": check["message"],
                            "severity": check["severity"]
                        })
                        continue
                    
                    # Check expected value if applicable
                    if "expected" in check and match.group(1):
                        if not re.match(check["expected"], match.group(1)):
                            findings.append({
                                "check": check_name,
                                "file": check["file"],
                                "message": f"{check['message']} (found: {match.group(1)})",
                                "severity": check["severity"]
                            })
                    
                    # Check maximum value if applicable
                    if "expected_max" in check and match.group(1):
                        try:
                            value = int(match.group(1))
                            if value > check["expected_max"]:
                                findings.append({
                                    "check": check_name,
                                    "file": check["file"],
                                    "message": f"{check['message']} (found: {value})",
                                    "severity": check["severity"]
                                })
                        except ValueError:
                            pass
            
            # Add findings to report
            for finding in findings:
                self.report_data["summary"]["vulnerabilities"][finding["severity"]] += 1
                
                # Add to summary issues
                if finding["severity"] in ("critical", "high"):
                    self.report_data["summary"]["security_issues"].append(
                        f"[{finding['severity'].upper()}] {finding['message']} in {finding['file']}"
                    )
            
            # Store in report
            self.report_data["config_scan"]["security_settings"] = {
                "checks_performed": len(security_checks),
                "findings": findings
            }
            
            print(f"  [✓] Performed {len(security_checks)} security settings checks")
            if findings:
                print(f"  [!] Found {len(findings)} potential security settings issues")
                
        except Exception as e:
            print(f"  [!] Unexpected error during security settings audit: {e}")
            self.report_data["config_scan"]["security_settings"] = {
                "error": f"Unexpected error: {str(e)}"
            }
    
    def _audit_docker_config(self):
        """Audit Docker configuration for security issues"""
        try:
            print("  [*] Checking Docker configuration...")
            
            # Define Docker security best practices to check
            docker_checks = {
                "root_user": {
                    "file": "Dockerfile",
                    "pattern": r"USER\s+(\w+)",
                    "message": "Docker container should not run as root",
                    "severity": "medium"
                },
                "latest_tag": {
                    "file": "docker-compose.yml",
                    "pattern": r"image:\s*[^:]*:latest",
                    "message": "Avoid using 'latest' tag in production",
                    "severity": "low"
                },
                "privileged_mode": {
                    "file": "docker-compose.yml",
                    "pattern": r"privileged:\s*true",
                    "message": "Avoid running containers in privileged mode",
                    "severity": "high"
                },
                "health_check": {
                    "file": "docker-compose.yml",
                    "pattern": r"healthcheck:",
                    "expected": True,
                    "message": "Include healthchecks for containers",
                    "severity": "low"
                }
            }
            
            # Track findings
            findings = []
            
            for check_name, check in docker_checks.items():
                file_path = PROJECT_ROOT / check["file"]
                if not file_path.exists():
                    # Skip if file not found, Docker might not be used
                    continue
                
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    # Check pattern
                    match = re.search(check["pattern"], content)
                    if "expected" in check:
                        if check["expected"] and not match:
                            findings.append({
                                "check": check_name,
                                "file": check["file"],
                                "message": check["message"],
                                "severity": check["severity"]
                            })
                        elif not check["expected"] and match:
                            findings.append({
                                "check": check_name,
                                "file": check["file"],
                                "message": check["message"],
                                "severity": check["severity"]
                            })
                    else:
                        if match:
                            # For "USER" check, verify it's not root
                            if check_name == "root_user" and match.group(1).lower() != "root":
                                continue
                            
                            findings.append({
                                "check": check_name,
                                "file": check["file"],
                                "message": check["message"],
                                "severity": check["severity"]
                            })
            
            # Add findings to report
            for finding in findings:
                self.report_data["summary"]["vulnerabilities"][finding["severity"]] += 1
                
                # Add to summary issues
                if finding["severity"] in ("critical", "high"):
                    self.report_data["summary"]["security_issues"].append(
                        f"[{finding['severity'].upper()}] {finding['message']} in {finding['file']}"
                    )
            
            # Store in report
            self.report_data["config_scan"]["docker"] = {
                "checks_performed": len(docker_checks),
                "findings": findings
            }
            
            print(f"  [✓] Performed Docker configuration checks")
            if findings:
                print(f"  [!] Found {len(findings)} potential Docker configuration issues")
                
        except Exception as e:
            print(f"  [!] Unexpected error during Docker configuration audit: {e}")
            self.report_data["config_scan"]["docker"] = {
                "error": f"Unexpected error: {str(e)}"
            }
    
    def _generate_report(self):
        """Generate the security audit report"""
        # Save JSON report
        json_report_path = self.report_dir / f"security_audit_{self.timestamp}.json"
        with open(json_report_path, "w") as f:
            json.dump(self.report_data, f, indent=2)
        
        # Generate markdown summary
        self._generate_markdown_summary()
    
    def _generate_markdown_summary(self):
        """Generate a markdown summary of the security audit"""
        summary = self.report_data["summary"]
        vulns = summary["vulnerabilities"]
        
        md_report_path = self.report_dir / f"security_audit_{self.timestamp}.md"
        with open(md_report_path, "w") as f:
            f.write("# Security Audit Report\n\n")
            f.write(f"**Date:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Write summary
            f.write("## Summary\n\n")
            f.write(f"- **Scanned Files:** {summary['scanned_files']}\n")
            f.write(f"- **Scanned Dependencies:** {summary['scanned_dependencies']}\n")
            f.write("- **Vulnerabilities Found:**\n")
            f.write(f"  - Critical: {vulns['critical']}\n")
            f.write(f"  - High: {vulns['high']}\n")
            f.write(f"  - Medium: {vulns['medium']}\n")
            f.write(f"  - Low: {vulns['low']}\n")
            f.write(f"  - Info: {vulns['info']}\n\n")
            
            # Write high-priority issues
            if summary["security_issues"]:
                f.write("## High-Priority Issues\n\n")
                for issue in summary["security_issues"]:
                    f.write(f"- {issue}\n")
                f.write("\n")
            
            # Write dependency scan results
            f.write("## Dependency Scan Results\n\n")
            if "python" in self.report_data["dependency_scan"]:
                python_scan = self.report_data["dependency_scan"]["python"]
                if "error" in python_scan:
                    f.write(f"### Python Dependencies\n\n❌ {python_scan['error']}\n\n")
                else:
                    f.write(f"### Python Dependencies\n\n")
                    f.write(f"Scanned {python_scan.get('dependencies_checked', 0)} packages\n\n")
                    
                    if python_scan.get('vulnerabilities', []):
                        f.write("| Package | Installed Version | Vulnerable Versions | Severity | Description |\n")
                        f.write("|---------|------------------|---------------------|----------|-------------|\n")
                        for vuln in python_scan['vulnerabilities']:
                            f.write(f"| {vuln['package']} | {vuln['installed_version']} | {vuln['vulnerable_versions']} | {vuln['severity'].upper()} | {vuln['description']} |\n")
                    else:
                        f.write("✅ No vulnerabilities found\n")
                    f.write("\n")
            
            if "node" in self.report_data["dependency_scan"]:
                node_scan = self.report_data["dependency_scan"]["node"]
                if "error" in node_scan:
                    f.write(f"### Node.js Dependencies\n\n❌ {node_scan['error']}\n\n")
                else:
                    f.write(f"### Node.js Dependencies\n\n")
                    f.write(f"Scanned {node_scan.get('dependencies_checked', 0)} packages\n\n")
                    
                    if node_scan.get('vulnerabilities', []):
                        f.write("| Package | Severity | Title | Recommendation |\n")
                        f.write("|---------|----------|-------|----------------|\n")
                        for vuln in node_scan['vulnerabilities']:
                            f.write(f"| {vuln['package']} | {vuln['severity'].upper()} | {vuln['title']} | {vuln['recommendation']} |\n")
                    else:
                        f.write("✅ No vulnerabilities found\n")
                    f.write("\n")
            
            # Write code scan results
            f.write("## Code Scan Results\n\n")
            if "python" in self.report_data["code_scan"]:
                python_scan = self.report_data["code_scan"]["python"]
                if "error" in python_scan:
                    f.write(f"### Python Code\n\n❌ {python_scan['error']}\n\n")
                else:
                    f.write(f"### Python Code\n\n")
                    f.write(f"Scanned {python_scan.get('files_checked', 0)} files\n\n")
                    
                    if python_scan.get('vulnerabilities', []):
                        f.write("| File | Line | Severity | Issue | Description |\n")
                        f.write("|------|------|----------|-------|-------------|\n")
                        for vuln in python_scan['vulnerabilities']:
                            f.write(f"| {vuln['file']} | {vuln['line']} | {vuln['severity'].upper()} | {vuln['issue_type']} | {vuln['issue_text']} |\n")
                    else:
                        f.write("✅ No vulnerabilities found\n")
                    f.write("\n")
            
            if "javascript" in self.report_data["code_scan"]:
                js_scan = self.report_data["code_scan"]["javascript"]
                if "error" in js_scan:
                    f.write(f"### JavaScript Code\n\n❌ {js_scan['error']}\n\n")
                else:
                    f.write(f"### JavaScript Code\n\n")
                    f.write(f"Scanned {js_scan.get('files_checked', 0)} files\n\n")
                    
                    if js_scan.get('vulnerabilities', []):
                        f.write("| File | Line | Severity | Rule | Message |\n")
                        f.write("|------|------|----------|------|--------|\n")
                        for vuln in js_scan['vulnerabilities']:
                            f.write(f"| {vuln['file']} | {vuln['line']} | {vuln['severity'].upper()} | {vuln['rule']} | {vuln['message']} |\n")
                    else:
                        f.write("✅ No vulnerabilities found\n")
                    f.write("\n")
            
            # Write configuration scan results
            f.write("## Configuration Scan Results\n\n")
            if "secrets" in self.report_data["config_scan"]:
                secrets_scan = self.report_data["config_scan"]["secrets"]
                if "error" in secrets_scan:
                    f.write(f"### Secrets in Configuration\n\n❌ {secrets_scan['error']}\n\n")
                else:
                    f.write(f"### Secrets in Configuration\n\n")
                    f.write(f"Scanned {secrets_scan.get('files_checked', 0)} files\n\n")
                    
                    if secrets_scan.get('findings', []):
                        f.write("| File | Line | Secret Type | Severity |\n")
                        f.write("|------|------|------------|----------|\n")
                        for finding in secrets_scan['findings']:
                            f.write(f"| {finding['file']} | {finding['line']} | {finding['secret_type']} | {finding['severity'].upper()} |\n")
                    else:
                        f.write("✅ No hardcoded secrets found\n")
                    f.write("\n")
            
            if "security_settings" in self.report_data["config_scan"]:
                settings_scan = self.report_data["config_scan"]["security_settings"]
                if "error" in settings_scan:
                    f.write(f"### Security Settings\n\n❌ {settings_scan['error']}\n\n")
                else:
                    f.write(f"### Security Settings\n\n")
                    f.write(f"Performed {settings_scan.get('checks_performed', 0)} checks\n\n")
                    
                    if settings_scan.get('findings', []):
                        f.write("| Check | File | Message | Severity |\n")
                        f.write("|-------|------|---------|----------|\n")
                        for finding in settings_scan['findings']:
                            f.write(f"| {finding['check']} | {finding['file']} | {finding['message']} | {finding['severity'].upper()} |\n")
                    else:
                        f.write("✅ No security settings issues found\n")
                    f.write("\n")
            
            if "docker" in self.report_data["config_scan"]:
                docker_scan = self.report_data["config_scan"]["docker"]
                if "error" in docker_scan:
                    f.write(f"### Docker Configuration\n\n❌ {docker_scan['error']}\n\n")
                else:
                    f.write(f"### Docker Configuration\n\n")
                    
                    if docker_scan.get('findings', []):
                        f.write("| Check | File | Message | Severity |\n")
                        f.write("|-------|------|---------|----------|\n")
                        for finding in docker_scan['findings']:
                            f.write(f"| {finding['check']} | {finding['file']} | {finding['message']} | {finding['severity'].upper()} |\n")
                    else:
                        f.write("✅ No Docker configuration issues found\n")
                    f.write("\n")
            
            # Write recommendations
            f.write("## Recommendations\n\n")
            f.write("1. **Address High and Critical Issues First**: Focus on fixing high and critical severity issues before proceeding with other findings.\n")
            f.write("2. **Update Dependencies**: Keep dependencies up-to-date to avoid known security vulnerabilities.\n")
            f.write("3. **Review Security Settings**: Ensure proper security configurations for authentication, authorization, and data protection.\n")
            f.write("4. **Secure Docker Configuration**: Follow Docker security best practices, especially for production deployments.\n")
            f.write("5. **Implement Regular Security Audits**: Schedule regular security audits to catch new vulnerabilities.\n")
    
    def _print_summary(self):
        """Print a summary of the security audit results"""
        summary = self.report_data["summary"]
        vulns = summary["vulnerabilities"]
        
        print("\nSecurity Audit Summary:")
        print(f"- Scanned Files: {summary['scanned_files']}")
        print(f"- Scanned Dependencies: {summary['scanned_dependencies']}")
        print("- Vulnerabilities Found:")
        print(f"  - Critical: {vulns['critical']}")
        print(f"  - High: {vulns['high']}")
        print(f"  - Medium: {vulns['medium']}")
        print(f"  - Low: {vulns['low']}")
        print(f"  - Info: {vulns['info']}")
        
        if summary["security_issues"]:
            print("\nHigh-Priority Issues:")
            for issue in summary["security_issues"]:
                print(f"- {issue}")
    
    @staticmethod
    def _map_severity(severity: str) -> str:
        """Map severity strings to standardized values"""
        severity = severity.lower()
        if severity in ("critical", "high", "medium", "low", "info"):
            return severity
        
        if severity in ("severe", "major", "fatal"):
            return "critical"
        elif severity in ("moderate", "warning"):
            return "medium"
        elif severity in ("minor", "info", "informational"):
            return "low"
        
        return "info"  # Default
    
    @staticmethod
    def _map_eslint_severity(severity_num: int) -> str:
        """Map ESLint severity number to standardized values"""
        # ESLint: 0 = off, 1 = warn, 2 = error
        if severity_num == 2:
            return "high"
        elif severity_num == 1:
            return "medium"
        else:
            return "low"


def main():
    """Main entry point for the security audit tool"""
    parser = argparse.ArgumentParser(description="Security Audit Tool for GPlus Recycling App")
    parser.add_argument("--scope", choices=["all", "dependencies", "code", "config", "pentest"], default="all",
                        help="Scope of the security audit")
    parser.add_argument("--report-dir", type=str, default=None,
                        help="Directory to save the audit reports")
    parser.add_argument("--target", type=str, default=None,
                        help="Target URL for penetration testing (e.g., http://localhost:8000)")
    parser.add_argument("--pentest-scope", choices=["all", "api", "web", "auth"], default="all",
                        help="Scope of the penetration testing")
    
    args = parser.parse_args()
    
    # Set up report directory
    report_dir = Path(args.report_dir) if args.report_dir else REPORT_DIR
    
    # Handle penetration testing
    if args.scope == "pentest" or args.scope == "all":
        if args.target:
            try:
                # Import the pentest tool dynamically
                from pentest_tool import PenetrationTestTool
                
                print(f"\n{'=' * 80}")
                print(f"Starting Penetration Testing")
                print(f"{'=' * 80}")
                
                # Run penetration tests
                pentest_tool = PenetrationTestTool(args.target, report_dir=report_dir)
                pentest_tool.run_pentest(scope=args.pentest_scope)
                
            except ImportError:
                print(f"[!] Error: Could not import penetration testing module.")
                print(f"[!] Make sure pentest_tool.py is in the same directory.")
        else:
            if args.scope == "pentest":
                print("[!] Error: Target URL is required for penetration testing.")
                print("[!] Use --target option to specify the target URL (e.g., --target http://localhost:8000)")
                sys.exit(1)
    
    # Run the standard security audit if not only penetration testing
    if args.scope != "pentest":
        audit_tool = SecurityAuditTool(report_dir=report_dir)
        audit_tool.run_audit(scope=args.scope)


if __name__ == "__main__":
    main()