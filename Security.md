## Security Practices

### GitHub Token Security Check
- **Date**: March 23, 2025
- **Action**: Searched Git history for the Github Token using 'git log -G"token" --all --source -p'. No results found, confirming the token was never committed.
- **Decision**: Kept the current token since no exposure was detected.
- **Next Steps**:
  - Reminder to rotate the token before public deployment on Azure.
  - Ensure '.env' remains in '.gitignore'.

- **Date**: March 23, 2025
- **Issue**: Live Server (port 5500) is accessible over the network (e.g., 'http://192.168.1.100:5500') despiste setting 'liveServer.settings.host' to '127.0.0.1' and using a 'live-server.json' config file.
- **Risk Assessment**:
  - Only static assests (HTML, CSS, JavaScript) are exposed; no sensitive data (e.g., GitHub token, API data) is accessible becasue the Node.js server (port 3000) is secure.
  - This is a temporary local deployment on a trusted home network, with no immediate risk.
- **Mitigation**:
  - Added a Windows Defender Firewall rule to block incoming connections on port 5500.
- **Decision**: Moved on to the next security step (XSS prevention) since the risk is minimal in this context
- **Next Steps**:
  - Revisit securing Live Server in early May 2025, before deploying to Azure, or if using a less trusted network (e.g., public Wi- Fi).