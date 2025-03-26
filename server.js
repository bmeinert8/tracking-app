require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache'); // Import node-cache

const app = express();

// Initialize cache with a TTL of 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 600 });

// Enable CORS to allow requests from your frontend (e.g., Live Server on port 5500)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '.')));
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to validate an ISO 8601 timestamp
function isValidTimestamp(ts) {
  return typeof ts === 'string' && ts.length <= 50 && !isNaN(Date.parse(ts));
}

// Function to sanitize a string (escape HTML characters)
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, ''');
}

// Configure rate limiting for /api/saveLog
const saveLogLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Endpoint to fetch commits
app.get('/api/commits', async (req, res) => {
  const cacheKey = 'commits';
  const cachedCommits = cache.get(cacheKey);
  if (cachedCommits) {
    console.log('Server: Serving commits from cache');
    return res.json(cachedCommits);
  }

  try {
    const reposResponse = await fetch('https://api.github.com/users/bmeinert8/repos?per_page=100', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept-Encoding': 'identity'
      }
    });

    if (!reposResponse.ok) {
      throw new Error(`HTTP error fetching repos! Status: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();
    console.log('Server: Repositories:', repos.map(repo => repo.name));

    const repoPromises = repos.map(repo =>
      fetch(`https://api.github.com/repos/bmeinert8/${repo.name}/commits?sha=${repo.default_branch}&since=2024-03-12&per_page=100`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept-Encoding': 'identity'
        }
      })
      .then(response => {
        if (!response.ok) {
          console.error(`Server: Failed to fetch commits for ${repo.name}/${repo.default_branch}: Status ${response.status}`);
          return [];
        }
        return response.json();
      })
      .catch(error => {
        console.error(`Server: Error fetching commits for ${repo.name}/${repo.default_branch}:`, error);
        return [];
      })
      .then(commits => ({
        repo: repo.name,
        commits
      }))
    );

    const repoCommits = await Promise.all(repoPromises);
    const allCommits = [].concat(...repoCommits.map(repo => repo.commits));

    // Cache the commits
    cache.set(cacheKey, allCommits);
    console.log('Server: Cached commits');
    res.json(allCommits);
  } catch (error) {
    console.error('Server: Error fetching commits:', error);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

// Endpoint to save a log (changed to POST)
app.post('/api/saveLog', saveLogLimiter, async (req, res) => {
  try {
    const userId = 'bmeinert8'; // Hardcoded for now; replace with auth later
    const { timestamp, hours, minutes, seconds } = req.body; // Extract from request body
    const filePath = path.join(__dirname, 'data', 'codeTimeLogs.json');

    // Read existing logs
    let logsData = { userId, logs: [] };
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      logsData = JSON.parse(fileContent);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error; // Ignore if file doesn't exist yet.
    }

    // Validate and parse input
    const hoursNum = parseInt(hours, 10) || 0;
    const minutesNum = parseInt(minutes, 10) || 0;
    const secondsNum = parseInt(seconds, 10) || 0;

    // Validate and sanitize timestamp
    const validatedTimestamp = isValidTimestamp(timestamp) ? sanitizeString(timestamp) : new Date().toISOString();

    // Append new log
    logsData.logs.push({
      timestamp: validatedTimestamp,
      hours: hoursNum,
      minutes: minutesNum,
      seconds: secondsNum
    });

    // Write back to file
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(logsData, null, 2), 'utf8');

    res.status(201).json({ success: true, log: logsData.logs[logsData.logs.length - 1] });
  } catch (error) {
    console.error('Server: Error saving log:', error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// Endpoint to fetch logs
app.get('/api/getLogs', async (req, res) => {
  try {
    const userId = 'bmeinert8';
    const filePath = path.join(__dirname, 'data', 'codeTimeLogs.json');

    let logsData = { userId, logs: [] };
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      logsData = JSON.parse(fileContent);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    res.json(logsData.logs);
  } catch (error) {
    console.error('Server: Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Endpoint to fetch language data
app.get('/api/languages', async (req, res) => {
  try {
    // Fetch the list of repositories
    const reposResponse = await fetch('https://api.github.com/users/bmeinert8/repos?per_page=100', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept-Encoding': 'identity'
      }
    });

    if (!reposResponse.ok) {
      throw new Error(`HTTP error fetching repos! Status: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();
    console.log('Server: Repositories for languages:', repos.map(repo => repo.name));

    // Fetch languages for each repository
    const languagePromises = repos.map(repo => 
      fetch(`https://api.github.com/repos/bmeinert8/${repo.name}/languages`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept-Encoding': 'identity'
        }
      })
      .then(response => {
        if (!response.ok) {
          console.error(`Server: Failed to fetch languages for ${repo.name}: Status ${response.status}`);
          return {};
        }
        return response.json();
      })
      .catch(error => {
        console.error(`Server: Error fetching languages for ${repo.name}:`, error);
        return {};
      })
    );

    const languagesData = await Promise.all(languagePromises);

    // Aggregate language data
    const languageTotals = {};
    languagesData.forEach(languages => {
      for (const [language, bytes] of Object.entries(languages)) {
        languageTotals[language] = (languageTotals[language] || 0) + bytes;
      }
    });

    // Calculate total bytes and percentages
    const totalBytes = Object.values(languageTotals).reduce((sum, bytes) => sum + bytes, 0);
    const languagePercentages = {};
    for (const [language, bytes] of Object.entries(languageTotals)) {
      languagePercentages[language] = (bytes / totalBytes) * 100;
    }

    // Convert to array of objects for easier rendering
    const languageArray = Object.entries(languagePercentages).map(([language, percentage]) => ({
      language,
      percentage: parseFloat(percentage.toFixed(2)) // round to 2 decimal places
    }));

    // Sort by percentage (descending)
    languageArray.sort((a, b) => b.percentage - a.percentage);

    res.json(languageArray);
  } catch (error) {
    console.error('Server: Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

app.listen(3000, '127.0.0.1', () => console.log('Server is running on 127.0.0.1:3000'));