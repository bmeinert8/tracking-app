require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch'); // This should now work with node-fetch@2

const app = express(); // create express app

// Enable CORS to allow requests from your frontend (e.g., Live Server on port 5500)
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, '.')));
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to fetch commits
app.get('/api/commits', async (req, res) => {
  try {
    const reposResponse = await fetch('https://api.github.com/users/bmeinert8/repos?per_page=100', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept-Encoding': 'identity' // Avoid gzip decoding issues
      }
    });

    if (!reposResponse.ok) {
      throw new Error(`HTTP error fetching repos! Status: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();
    console.log('Server: Repositories:', repos.map(repo => repo.name));

    const repoPromises = repos.map(repo =>
      fetch(`https://api.github.com/repos/bmeinert8/${repo.name}/branches`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept-Encoding': 'identity'
        }
      })
      .then(response => {
        if (!response.ok) {
          console.error(`Server: Failed to fetch branches for ${repo.name}: Status ${response.status}`);
          return [];
        }
        return response.json();
      })
      .catch(error => {
        console.error(`Server: Error fetching branches for ${repo.name}:`, error);
        return [];
      })
      .then(branches => {
        const branchPromises = branches.map(branch =>
          fetch(`https://api.github.com/repos/bmeinert8/${repo.name}/commits?sha=${branch.name}&since=2024-03-12&per_page=100`, {
            headers: {
              'Authorization': `token ${process.env.GITHUB_TOKEN}`,
              'Accept-Encoding': 'identity'
            }
          })
          .then(response => {
            if (!response.ok) {
              console.error(`Server: Failed to fetch commits for ${repo.name}/${branch.name}: Status ${response.status}`);
              return [];
            }
            return response.json();
          })
          .catch(error => {
            console.error(`Server: Error fetching commits for ${repo.name}/${branch.name}:`, error);
            return [];
          })
        );
        return Promise.all(branchPromises).then(branchCommits => ({
          repo: repo.name,
          commits: [].concat(...branchCommits)
        }));
      })
    );

    const repoCommits = await Promise.all(repoPromises);
    const allCommits = [].concat(...repoCommits.map(repo => repo.commits));

    res.json(allCommits);
  } catch (error) {
    console.error('Server: Error fetching commits:', error);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

app.listen(3000, () => console.log('Server is running on port 3000'));