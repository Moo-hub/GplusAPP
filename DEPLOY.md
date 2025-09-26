# Secrets & config precedence
1) AWS Secrets Manager
2) Vault (if enabled)
3) .env (development fallback)
Document required keys in .env.example and keep secrets out of VCS.