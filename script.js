// Step 2 & 3: Fetch commits from the local server and process them
fetch('http://localhost:3000/api/commits')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error fetching commits! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(allCommits => {
    console.log('All Commits Across Repos:', allCommits);

    const commitCounts = {};
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const seenCommits = new Set();

    // Process commits in local timezone
    allCommits.forEach(commit => {
      if (!seenCommits.has(commit.sha)) {
        seenCommits.add(commit.sha);
        const commitDate = new Date(commit.commit.author.date); // UTC date from GitHub
        if (commitDate >= oneYearAgo && commitDate <= today) {
          // Convert UTC date to local timezone (EDT) and extract YYYY-MM-DD
          const dateStr = commitDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // 'en-CA' gives YYYY-MM-DD format
          commitCounts[dateStr] = (commitCounts[dateStr] || 0) + 1;
        }
      }
    });
    console.log('Commit Counts Across Repos:', commitCounts);

    // Calculate total commits in the past 365 days
    const totalCommits = Object.values(commitCounts).reduce((sum, count) => sum + count, 0);
    console.log('Total Commits in Past 365 Days:', totalCommits);

    // Display total commits in the DOM
    const totalCommitsElement = document.querySelector('.js-commit-total');
    totalCommitsElement.innerHTML = `<p>Total Commits in Past 365 Days: ${totalCommits}</p>`;

    const commitGrid = document.querySelector('.js-commit-grid');
    for (let i = 0; i < 365; i++) {
      const cell = document.createElement('div');
      cell.classList.add('commit-cell');
      const cellDate = new Date(today);
      cellDate.setDate(today.getDate() - i);
      // Set cell date in local timezone (EDT) to match commitCounts
      cell.dataset.date = cellDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
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