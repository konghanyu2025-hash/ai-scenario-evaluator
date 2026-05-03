# Security Policy

## Supported Versions

The latest release branch is supported for security fixes.

## Reporting a Vulnerability

Open a private security advisory on GitHub or contact the maintainers directly.

Do not include real API keys or sensitive evaluation data in public issues.

## API Key Handling

- The web demo only uses keys for the current request.
- Keys are not intentionally persisted by the app.
- Error messages are sanitized before returning to the browser.
- Local CLI and Docker deployments can read keys from environment variables.

For sensitive business data, prefer local Docker or CLI execution.
