## Security Practices

### GitHub Token Security Check
- **Date**: March 23, 2025
- **Action**: Searched Git history for the Github Token using 'git log -G"token" --all --source -p'. No results found, confirming the token was never committed.
- **Decision**: Kept the current token since no exposure was detected.
- **Next Steps**:
  - Reminder to rotate the token before public deployment on Azure.
  - Ensure `.env` remains in `.gitignore`.

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

- **Date**: March 24, 2025
- **Action**: Added `escapeHTML` function in `utils.js` to sanitize data before rendering to the DOM.
- **Implementation**:
  - Applied `escapeHTML` to language names and percentages in `languages.js` (modal legend).
  - Reviewed `codeTime.js` and `commits.js` -no sanitization needed as no user-controlled data is rendered.
- **Testing**:
  - Tested with mock data containing `<script>alert('hacked')</script>` and `<b>HTML</b>`.
  - Confirmed that data renders as plain text, with no script execution or HTML rendering.
- **Next Steps**:
  - Apply sanitization to commit messages if added to the UI (e.g., in the commits page).

- **Date**: March 23, 2025
- **Actions**: Ran `npm audit` to identify vulnerabilites in dependencies.
- **Findings**: No vulnerabilities found.
- **Updates**:
  - Updated `express` to 4.21.2.
  - Updated `node-fetch` to 2.7.0.
  - Updated `cors` to 2.8.5.
  - Updated `dotenv` to 16.4.7.
  - Updated `chart.js` via CDN
- **Testing**:
  - Confirmed that the app works as expected after updates.

- **Date**: March 26, 2025
- **Action**: Timestamp Validation and Sanitization in `/api/saveLog`
- **Change**:
  - Added `isValidTimestamp()` function to validate that the `timestamp` in `/api/saveLog` requests is a valid ISO 8601 string and is under 50 characters.
  - Added `sanitizeString()` function to escape HTML characters in the `timestamp`, preventing potential XSS if the data is rendered in the DOM later.
  - If the `timestamp` is invalid, a new server-generated timestamp is used.
- **Files Modified**:
  - `server.js`
- **Impact**:
  - Prevents malformed or malicious timestamps from corrupting `codeTimeLogs.json` or causing issues on the frontend.
  - Adds a defense-in-depth layer by escaping HTML characters.

- **Date**: March 26, 2025
- **Action**: 2. Rate Limiting for `/api/saveLog`
- **Change**:
  - Added rate limiting to the `/api/saveLog` endpoint using `express-rate-limit`.
  - Configured to allow 100 requests per IP every 15 minutes.
  - Returns a 429 (Too Many Requests) status with a message if the limit is exceeded.
  - Updated `codeTime.js` to display a specific error message ("Too many requests. Please try again later.") for 429 errors.
- **Files Modified**:
  - `server.js`
  - `codeTime.js`
- **Impact**:
  - Protects the server from abuse (e.g., DoS attacks or excessive requests) that could fill up the disk or overload the server with file I/O.
  - Improves user experience by providing a clear error message when the rate limit is hit.
- **Dependencies Added**:
  - `express-rate-limit`