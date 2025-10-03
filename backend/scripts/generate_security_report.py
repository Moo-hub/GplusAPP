#!/usr/bin/env python
"""
Security Report Generator for GPlus Recycling App
This script combines and analyzes security audit and penetration testing reports
to generate a comprehensive security assessment report.

Usage:
  python generate_security_report.py --audit-report path/to/audit_report.json --pentest-report path/to/pentest_report.json
"""

import os
import sys
import json
import argparse
import datetime
from pathlib import Path
from typing import Dict, List, Any

# Configure paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
REPORT_DIR = PROJECT_ROOT / "security_reports"


class SecurityReportGenerator:
    def __init__(self, audit_report: Path, pentest_report: Path = None, report_dir: Path = REPORT_DIR):
        """Initialize the security report generator"""
        self.audit_report_path = audit_report
        self.pentest_report_path = pentest_report
        self.report_dir = report_dir
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.combined_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "summary": {
                "vulnerabilities": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0
                },
                "security_issues": []
            },
            "audit_results": {},
            "pentest_results": {}
        }
        
        # Create report directory if it doesn't exist
        if not self.report_dir.exists():
            self.report_dir.mkdir(parents=True)
    
    def generate_report(self):
        """Generate the combined security report"""
        print(f"\n{'=' * 80}")
        print(f"Generating Comprehensive Security Report")
        print(f"{'=' * 80}")
        
        # Load audit report
        self._load_audit_report()
        
        # Load penetration test report if available
        if self.pentest_report_path:
            self._load_pentest_report()
        
        # Generate combined analysis and recommendations
        self._generate_analysis()
        
        # Generate the final report
        self._generate_final_report()
        
        print(f"\n{'=' * 80}")
        print(f"Security Report Generation Completed")
        print(f"Report saved to: {self.report_dir / f'comprehensive_security_report_{self.timestamp}.md'}")
        print(f"{'=' * 80}\n")
    
    def _load_audit_report(self):
        """Load and process the security audit report"""
        try:
            print("  [*] Loading security audit report...")
            
            with open(self.audit_report_path, 'r') as f:
                audit_data = json.load(f)
            
            # Store audit data
            self.combined_data["audit_results"] = audit_data
            
            # Update combined summary
            for severity, count in audit_data.get("summary", {}).get("vulnerabilities", {}).items():
                self.combined_data["summary"]["vulnerabilities"][severity] += count
            
            # Add high-priority issues to combined summary
            for issue in audit_data.get("summary", {}).get("security_issues", []):
                self.combined_data["summary"]["security_issues"].append(f"[AUDIT] {issue}")
            
            print(f"  [✓] Loaded security audit report")
            
        except Exception as e:
            print(f"  [!] Error loading security audit report: {e}")
            sys.exit(1)
    
    def _load_pentest_report(self):
        """Load and process the penetration test report"""
        if not self.pentest_report_path:
            return
            
        try:
            print("  [*] Loading penetration test report...")
            
            with open(self.pentest_report_path, 'r') as f:
                pentest_data = json.load(f)
            
            # Store pentest data
            self.combined_data["pentest_results"] = pentest_data
            
            # Update combined summary
            for severity, count in pentest_data.get("summary", {}).get("vulnerabilities", {}).items():
                self.combined_data["summary"]["vulnerabilities"][severity] += count
            
            # Add high-priority issues to combined summary
            for issue in pentest_data.get("summary", {}).get("security_issues", []):
                self.combined_data["summary"]["security_issues"].append(f"[PENTEST] {issue}")
            
            print(f"  [✓] Loaded penetration test report")
            
        except Exception as e:
            print(f"  [!] Error loading penetration test report: {e}")
    
    def _generate_analysis(self):
        """Generate analysis and recommendations based on combined data"""
        vulns = self.combined_data["summary"]["vulnerabilities"]
        total_issues = sum(vulns.values())
        
        # Get severity distribution
        if total_issues > 0:
            critical_pct = (vulns["critical"] / total_issues) * 100
            high_pct = (vulns["high"] / total_issues) * 100
            medium_pct = (vulns["medium"] / total_issues) * 100
            low_pct = (vulns["low"] / total_issues) * 100
            info_pct = (vulns["info"] / total_issues) * 100
        else:
            critical_pct = high_pct = medium_pct = low_pct = info_pct = 0
        
        # Generate risk assessment
        if vulns["critical"] > 0:
            risk_level = "Critical"
            risk_description = "The application has critical security vulnerabilities that require immediate attention. These issues could lead to unauthorized access, data breaches, or complete system compromise."
        elif vulns["high"] > 0:
            risk_level = "High"
            risk_description = "The application has high-risk security vulnerabilities that should be addressed as soon as possible. These issues could potentially lead to security breaches or data leakage."
        elif vulns["medium"] > 3:
            risk_level = "Moderate to High"
            risk_description = "The application has multiple medium-risk security vulnerabilities. While not immediately critical, these issues collectively represent a significant security risk that should be addressed promptly."
        elif vulns["medium"] > 0:
            risk_level = "Moderate"
            risk_description = "The application has some security vulnerabilities of moderate severity. These issues should be addressed in the near term as part of ongoing security improvements."
        elif vulns["low"] > 5:
            risk_level = "Low to Moderate"
            risk_description = "The application has several low-severity security findings. While individually low risk, the number of issues suggests security areas that need improvement."
        else:
            risk_level = "Low"
            risk_description = "The application has minimal security issues of low severity. Continue with regular security assessments to maintain this security posture."
        
        # Identify top problem areas
        problem_areas = []
        
        # Check dependencies
        if "audit_results" in self.combined_data:
            audit = self.combined_data["audit_results"]
            if "dependency_scan" in audit:
                dep_scan = audit["dependency_scan"]
                python_vulns = len(dep_scan.get("python", {}).get("vulnerabilities", []))
                node_vulns = len(dep_scan.get("node", {}).get("vulnerabilities", []))
                
                if python_vulns + node_vulns > 0:
                    problem_areas.append({
                        "area": "Dependencies",
                        "description": f"Vulnerable dependencies detected ({python_vulns} Python, {node_vulns} Node.js)",
                        "recommendation": "Update dependencies to secure versions and implement a dependency management strategy."
                    })
        
        # Check code security
        if "audit_results" in self.combined_data:
            audit = self.combined_data["audit_results"]
            if "code_scan" in audit:
                code_scan = audit["code_scan"]
                python_vulns = len(code_scan.get("python", {}).get("vulnerabilities", []))
                js_vulns = len(code_scan.get("javascript", {}).get("vulnerabilities", []))
                
                if python_vulns + js_vulns > 0:
                    problem_areas.append({
                        "area": "Code Security",
                        "description": f"Security issues in code detected ({python_vulns} Python, {js_vulns} JavaScript)",
                        "recommendation": "Implement secure coding practices and conduct regular code reviews."
                    })
        
        # Check configuration
        if "audit_results" in self.combined_data:
            audit = self.combined_data["audit_results"]
            if "config_scan" in audit:
                config_scan = audit["config_scan"]
                secret_findings = len(config_scan.get("secrets", {}).get("findings", []))
                setting_findings = len(config_scan.get("security_settings", {}).get("findings", []))
                docker_findings = len(config_scan.get("docker", {}).get("findings", []))
                
                if secret_findings > 0:
                    problem_areas.append({
                        "area": "Secrets Management",
                        "description": f"Hardcoded secrets or sensitive information found ({secret_findings} instances)",
                        "recommendation": "Remove hardcoded secrets and implement secure secrets management."
                    })
                
                if setting_findings + docker_findings > 0:
                    problem_areas.append({
                        "area": "Security Configuration",
                        "description": f"Security configuration issues detected ({setting_findings} application, {docker_findings} Docker)",
                        "recommendation": "Review and update security configurations according to best practices."
                    })
        
        # Check API security
        if "pentest_results" in self.combined_data:
            pentest = self.combined_data["pentest_results"]
            if "api_tests" in pentest:
                api_tests = pentest["api_tests"]
                api_vulns = len(api_tests.get("findings", []))
                
                if api_vulns > 0:
                    problem_areas.append({
                        "area": "API Security",
                        "description": f"API security vulnerabilities detected ({api_vulns} findings)",
                        "recommendation": "Implement input validation, authentication, and authorization for all API endpoints."
                    })
        
        # Check authentication
        if "pentest_results" in self.combined_data:
            pentest = self.combined_data["pentest_results"]
            if "auth_tests" in pentest:
                auth_tests = pentest["auth_tests"]
                auth_vulns = len(auth_tests.get("findings", []))
                
                if auth_vulns > 0:
                    problem_areas.append({
                        "area": "Authentication & Authorization",
                        "description": f"Authentication security issues detected ({auth_vulns} findings)",
                        "recommendation": "Strengthen authentication mechanisms with MFA, secure session management, and proper access controls."
                    })
        
        # Store analysis results
        self.combined_data["analysis"] = {
            "risk_level": risk_level,
            "risk_description": risk_description,
            "severity_distribution": {
                "critical": critical_pct,
                "high": high_pct,
                "medium": medium_pct,
                "low": low_pct,
                "info": info_pct
            },
            "problem_areas": problem_areas
        }
        
        # Generate remediation plan
        self._generate_remediation_plan()
    
    def _generate_remediation_plan(self):
        """Generate a prioritized remediation plan"""
        # Start with critical and high issues
        critical_issues = []
        high_issues = []
        medium_issues = []
        
        # Extract issues from audit results
        if "audit_results" in self.combined_data:
            audit = self.combined_data["audit_results"]
            
            # Dependency issues
            if "dependency_scan" in audit:
                for dep_type in ["python", "node"]:
                    if dep_type in audit["dependency_scan"]:
                        for vuln in audit["dependency_scan"][dep_type].get("vulnerabilities", []):
                            if vuln.get("severity") == "critical":
                                critical_issues.append({
                                    "source": "Dependency Scan",
                                    "details": f"Update {vuln.get('package')} to a secure version ({vuln.get('recommendation')})"
                                })
                            elif vuln.get("severity") == "high":
                                high_issues.append({
                                    "source": "Dependency Scan",
                                    "details": f"Update {vuln.get('package')} to a secure version ({vuln.get('recommendation')})"
                                })
            
            # Code issues
            if "code_scan" in audit:
                for code_type in ["python", "javascript"]:
                    if code_type in audit["code_scan"]:
                        for vuln in audit["code_scan"][code_type].get("vulnerabilities", []):
                            issue_desc = f"Fix {vuln.get('issue_type')} in {vuln.get('file')}:{vuln.get('line')} - {vuln.get('issue_text')}"
                            if vuln.get("severity") == "critical":
                                critical_issues.append({
                                    "source": f"{code_type.capitalize()} Code Scan",
                                    "details": issue_desc
                                })
                            elif vuln.get("severity") == "high":
                                high_issues.append({
                                    "source": f"{code_type.capitalize()} Code Scan",
                                    "details": issue_desc
                                })
                            elif vuln.get("severity") == "medium":
                                medium_issues.append({
                                    "source": f"{code_type.capitalize()} Code Scan",
                                    "details": issue_desc
                                })
            
            # Configuration issues
            if "config_scan" in audit:
                # Secrets
                if "secrets" in audit["config_scan"]:
                    for finding in audit["config_scan"]["secrets"].get("findings", []):
                        if finding.get("severity") == "high":
                            high_issues.append({
                                "source": "Secrets Scan",
                                "details": f"Remove hardcoded {finding.get('secret_type')} from {finding.get('file')}:{finding.get('line')}"
                            })
                        elif finding.get("severity") == "medium":
                            medium_issues.append({
                                "source": "Secrets Scan",
                                "details": f"Remove hardcoded {finding.get('secret_type')} from {finding.get('file')}:{finding.get('line')}"
                            })
                
                # Security settings
                if "security_settings" in audit["config_scan"]:
                    for finding in audit["config_scan"]["security_settings"].get("findings", []):
                        if finding.get("severity") == "high":
                            high_issues.append({
                                "source": "Security Settings",
                                "details": f"{finding.get('message')} in {finding.get('file')}"
                            })
                        elif finding.get("severity") == "medium":
                            medium_issues.append({
                                "source": "Security Settings",
                                "details": f"{finding.get('message')} in {finding.get('file')}"
                            })
        
        # Extract issues from pentest results
        if "pentest_results" in self.combined_data:
            pentest = self.combined_data["pentest_results"]
            
            # API issues
            if "api_tests" in pentest:
                for finding in pentest["api_tests"].get("findings", []):
                    issue_desc = f"{finding.get('title')} at {finding.get('endpoint')} - {finding.get('description')}"
                    if finding.get("severity") == "critical":
                        critical_issues.append({
                            "source": "API Security Test",
                            "details": issue_desc
                        })
                    elif finding.get("severity") == "high":
                        high_issues.append({
                            "source": "API Security Test",
                            "details": issue_desc
                        })
                    elif finding.get("severity") == "medium":
                        medium_issues.append({
                            "source": "API Security Test",
                            "details": issue_desc
                        })
            
            # Web issues
            if "web_tests" in pentest:
                for finding in pentest["web_tests"].get("findings", []):
                    issue_desc = f"{finding.get('title')} at {finding.get('endpoint', 'web application')} - {finding.get('description')}"
                    if finding.get("severity") == "critical":
                        critical_issues.append({
                            "source": "Web Security Test",
                            "details": issue_desc
                        })
                    elif finding.get("severity") == "high":
                        high_issues.append({
                            "source": "Web Security Test",
                            "details": issue_desc
                        })
                    elif finding.get("severity") == "medium":
                        medium_issues.append({
                            "source": "Web Security Test",
                            "details": issue_desc
                        })
            
            # Auth issues
            if "auth_tests" in pentest:
                for finding in pentest["auth_tests"].get("findings", []):
                    issue_desc = f"{finding.get('title')} at {finding.get('endpoint', 'auth system')} - {finding.get('description')}"
                    if finding.get("severity") == "critical":
                        critical_issues.append({
                            "source": "Authentication Test",
                            "details": issue_desc
                        })
                    elif finding.get("severity") == "high":
                        high_issues.append({
                            "source": "Authentication Test",
                            "details": issue_desc
                        })
                    elif finding.get("severity") == "medium":
                        medium_issues.append({
                            "source": "Authentication Test",
                            "details": issue_desc
                        })
        
        # Store the remediation plan
        self.combined_data["remediation_plan"] = {
            "immediate": critical_issues,
            "high_priority": high_issues,
            "medium_priority": medium_issues
        }
    
    def _generate_final_report(self):
        """Generate the final comprehensive security report"""
        report_path = self.report_dir / f"comprehensive_security_report_{self.timestamp}.md"
        vulns = self.combined_data["summary"]["vulnerabilities"]
        analysis = self.combined_data["analysis"]
        plan = self.combined_data["remediation_plan"]
        
        with open(report_path, "w") as f:
            # Header
            f.write("# Comprehensive Security Report\n\n")
            f.write(f"**Date:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Report ID:** SEC-{self.timestamp}\n\n")
            
            # Executive Summary
            f.write("## Executive Summary\n\n")
            f.write(f"**Overall Security Risk Level: {analysis['risk_level']}**\n\n")
            f.write(f"{analysis['risk_description']}\n\n")
            
            f.write("**Vulnerability Summary:**\n")
            f.write(f"- Critical: {vulns['critical']}\n")
            f.write(f"- High: {vulns['high']}\n")
            f.write(f"- Medium: {vulns['medium']}\n")
            f.write(f"- Low: {vulns['low']}\n")
            f.write(f"- Informational: {vulns['info']}\n\n")
            
            # Key Findings
            f.write("## Key Findings\n\n")
            if self.combined_data["summary"]["security_issues"]:
                for issue in self.combined_data["summary"]["security_issues"]:
                    f.write(f"- {issue}\n")
            else:
                f.write("No critical or high severity issues were identified.\n")
            f.write("\n")
            
            # Problem Areas
            f.write("## Problem Areas\n\n")
            if analysis["problem_areas"]:
                for area in analysis["problem_areas"]:
                    f.write(f"### {area['area']}\n\n")
                    f.write(f"{area['description']}\n\n")
                    f.write(f"**Recommendation:** {area['recommendation']}\n\n")
            else:
                f.write("No significant problem areas identified.\n\n")
            
            # Remediation Plan
            f.write("## Remediation Plan\n\n")
            
            f.write("### Immediate Actions (Critical Issues)\n\n")
            if plan["immediate"]:
                for issue in plan["immediate"]:
                    f.write(f"- [{issue['source']}] {issue['details']}\n")
            else:
                f.write("No critical issues requiring immediate action.\n")
            f.write("\n")
            
            f.write("### High Priority (Within 7 Days)\n\n")
            if plan["high_priority"]:
                for issue in plan["high_priority"]:
                    f.write(f"- [{issue['source']}] {issue['details']}\n")
            else:
                f.write("No high priority issues identified.\n")
            f.write("\n")
            
            f.write("### Medium Priority (Within 30 Days)\n\n")
            if plan["medium_priority"]:
                for issue in plan["medium_priority"]:
                    f.write(f"- [{issue['source']}] {issue['details']}\n")
            else:
                f.write("No medium priority issues identified.\n")
            f.write("\n")
            
            # Security Improvements
            f.write("## Security Improvement Recommendations\n\n")
            
            f.write("### Short-Term Improvements\n\n")
            f.write("1. **Address Identified Vulnerabilities**: Fix all critical and high-priority issues identified in this report.\n")
            f.write("2. **Dependency Management**: Implement automated dependency scanning and updates.\n")
            f.write("3. **Secrets Management**: Remove any hardcoded credentials and implement a secure secrets management solution.\n")
            f.write("4. **Security Headers**: Configure proper HTTP security headers for all web interfaces.\n")
            f.write("5. **Input Validation**: Enhance input validation across all user inputs.\n")
            f.write("\n")
            
            f.write("### Long-Term Security Roadmap\n\n")
            f.write("1. **Security Training**: Conduct secure coding training for all developers.\n")
            f.write("2. **Security Testing Integration**: Integrate security testing into the CI/CD pipeline.\n")
            f.write("3. **Authentication Enhancements**: Implement multi-factor authentication for all user accounts.\n")
            f.write("4. **Security Monitoring**: Set up continuous security monitoring and alerting.\n")
            f.write("5. **Regular Security Assessments**: Schedule quarterly security assessments and penetration tests.\n")
            f.write("\n")
            
            # Conclusion
            f.write("## Conclusion\n\n")
            total_issues = sum(vulns.values())
            if total_issues == 0:
                f.write("The security assessment found no vulnerabilities. The application demonstrates a strong security posture. Continue with regular security assessments to maintain this level of security.\n\n")
            else:
                f.write(f"This security assessment identified {total_issues} security findings of varying severity. By addressing these issues according to the remediation plan, the security posture of the application will be significantly improved.\n\n")
                
                if vulns["critical"] > 0 or vulns["high"] > 0:
                    f.write("The presence of critical and/or high severity issues demands immediate attention to prevent potential security breaches. Following the remediation plan will help mitigate these risks and enhance the overall security of the application.\n\n")
                else:
                    f.write("No critical issues were identified, but addressing the findings in this report will help further strengthen the security posture of the application and protect against potential future threats.\n\n")
            
            f.write("Regular security testing and continuous improvement of security practices are recommended to maintain and enhance the security of the application.\n")


def main():
    """Main entry point for the security report generator"""
    parser = argparse.ArgumentParser(description="Security Report Generator for GPlus Recycling App")
    parser.add_argument("--audit-report", type=str, required=True,
                        help="Path to the security audit report JSON file")
    parser.add_argument("--pentest-report", type=str,
                        help="Path to the penetration test report JSON file")
    parser.add_argument("--report-dir", type=str, default=None,
                        help="Directory to save the generated report")
    
    args = parser.parse_args()
    
    # Set up report directory
    report_dir = Path(args.report_dir) if args.report_dir else REPORT_DIR
    
    # Check if audit report exists
    audit_report_path = Path(args.audit_report)
    if not audit_report_path.exists():
        print(f"[!] Error: Audit report not found at {audit_report_path}")
        sys.exit(1)
    
    # Check if pentest report exists (if specified)
    pentest_report_path = None
    if args.pentest_report:
        pentest_report_path = Path(args.pentest_report)
        if not pentest_report_path.exists():
            print(f"[!] Warning: Penetration test report not found at {pentest_report_path}")
            pentest_report_path = None
    
    # Generate the report
    report_generator = SecurityReportGenerator(
        audit_report=audit_report_path,
        pentest_report=pentest_report_path,
        report_dir=report_dir
    )
    report_generator.generate_report()


if __name__ == "__main__":
    main()