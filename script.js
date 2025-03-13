// Step 2 & 3: Fetch commits from all repositories and process them
fetch('https://api.github.com/users/bmeinert8/repos?per_page=100', {
  headers: {
    'Authorization': 'token #',
    'Accept-Encoding': 'identity' // Request uncompressed response to avoid gzip issues
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error fetching repos! Status: ${response.status}`);
  }
  return response.json();
})
.then(repos => {
  console.log('Repositories:', repos.map(repo => repo.name));
  if (!repos.some(repo => repo.name === 'tracking-app')) {
    console.warn('Warning: tracking-app not found in repo list!');
  }

  const repoPromises = repos.map(repo =>
    fetch(`https://api.github.com/repos/bmeinert8/${repo.name}/branches`, {
      headers: {
        'Authorization': 'token #',
        'Accept-Encoding': 'identity'
      }
    })
    .then(response => {
      if (!response.ok) {
        console.error(`Failed to fetch branches for ${repo.name}: Status ${response.status}`);
        return [];
      }
      return response.json();
    })
    .catch(error => {
      console.error(`Error fetching branches for ${repo.name}:`, error);
      return []; // Continue even if this fetch fails
    })
    .then(branches => {
      console.log(`Branches for ${repo.name}:`, branches.map(branch => branch.name));
      if (repo.name === 'tracking-app' && branches.length === 0) {
        console.warn('Warning: No branches found for tracking-app!');
      }

      const branchPromises = branches.map(branch =>
        fetch(`https://api.github.com/repos/bmeinert8/${repo.name}/commits?sha=${branch.name}&since=2024-03-12&per_page=100`, {
          headers: {
            'Authorization': 'token #',
            'Accept-Encoding': 'identity'
          }
        })
        .then(response => {
          if (!response.ok) {
            console.error(`Failed to fetch commits for ${repo.name}/${branch.name}: Status ${response.status}`);
            return [];
          }
          return response.json();
        })
        .then(commits => {
          if (commits.length > 0) {
            console.log(`Commits for ${repo.name}/${branch.name}:`, commits.map(c => c.commit.author.date));
          } else {
            console.warn(`No commits found for ${repo.name}/${branch.name}`);
          }
          return commits;
        })
        .catch(error => {
          console.error(`Error fetching commits for ${repo.name}/${branch.name}:`, error);
          return []; // Continue even if this fetch fails
        })
      );

      return Promise.all(branchPromises).then(branchCommits => ({
        repo: repo.name,
        commits: [].concat(...branchCommits)
      }));
    })
  );

  return Promise.all(repoPromises);
})
.then(repoCommits => {
  const allCommits = [].concat(...repoCommits.map(repo => repo.commits));
  console.log('All Commits Across Repos:', allCommits);

  const commitCounts = {};
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const seenCommits = new Set();

  allCommits.forEach(commit => {
    if (!seenCommits.has(commit.sha)) {
      seenCommits.add(commit.sha);
      const commitDate = new Date(commit.commit.author.date);
      if (commitDate >= oneYearAgo && commitDate <= today) {
        const dateStr = commitDate.toISOString().split('T')[0];
        commitCounts[dateStr] = (commitCounts[dateStr] || 0) + 1;
      }
    }
  });
  console.log('Commit Counts Across Repos:', commitCounts);

  const commitGrid = document.querySelector('.js-commit-grid');
  for (let i = 0; i < 365; i++) {
    const cell = document.createElement('div');
    cell.classList.add('commit-cell');
    const cellDate = new Date(today);
    cellDate.setDate(today.getDate() - i);
    cell.dataset.date = cellDate.toISOString().split('T')[0];
    commitGrid.appendChild(cell);
  }

  // Step 4: Color the grid cells based on commit counts
  const thresholds = { least: 0, less: 1, medium: 3, more: 6, most: 9 };
  const cells = commitGrid.getElementsByClassName('commit-cell');
  for (let cell of cells) {
    const date = cell.dataset.date;
    const commitCount = commitCounts[date] || 0;
    let classToAdd = 'least';
    if (commitCount >= thresholds.most) classToAdd = 'most';
    else if (commitCount >= thresholds.more) classToAdd = 'more';
    else if (commitCount >= thresholds.medium) classToAdd = 'medium';
    else if (commitCount >= thresholds.less) classToAdd = 'less';
    cell.classList.add(classToAdd);

    // Add hover event listener
    cell.addEventListener('mouseover', () => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = `${date} - ${commitCount} commit${commitCount !== 1 ? 's' : ''}`;
      document.body.appendChild(tooltip);

      // Position the tooltip near the cell
      const rect = cell.getBoundingClientRect();
      tooltip.style.position = 'absolute';
      tooltip.style.left = `${rect.left + window.scrollX + 10}px`;
      tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
      tooltip.style.backgroundColor = '#333';
      tooltip.style.color = '#fff';
      tooltip.style.padding = '5px 10px';
      tooltip.style.borderRadius = '3px';
      tooltip.style.fontSize = '12px';
      tooltip.style.pointerEvents = 'none'; // Prevent tooltip from interfering with hover
    });

    cell.addEventListener('mouseout', () => {
      const tooltip = document.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
    });
  }
})
.catch(error => console.error('Error fetching commits:', error));