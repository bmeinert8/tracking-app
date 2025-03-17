export function initializeCommits() {
  fetch('http://localhost:3000/api/commits')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error fetching commits! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(allCommits => processCommits(allCommits))
    .catch(error => console.error('Error fetching commits:', error));
}

function processCommits(allCommits) {
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
        const dateStr = commitDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        commitCounts[dateStr] = (commitCounts[dateStr] || 0) + 1;
      }
    }
  });
  console.log('Commit Counts Across Repos:', commitCounts);

  displayTotalCommits(commitCounts);
  buildCommitGrid(today, commitCounts);
}

function displayTotalCommits(commitCounts) {
  const totalCommits = Object.values(commitCounts).reduce((sum, count) => sum + count, 0);
  console.log('Total Commits in Past 365 Days:', totalCommits);
  const totalCommitsElement = document.querySelector('.js-commit-total');
  totalCommitsElement.innerHTML = `<p>Total Commits in Past 365 Days: ${totalCommits.toLocaleString()}</p>`;
}

function buildCommitGrid(today, commitCounts) {
  const commitGrid = document.querySelector('.js-commit-grid');
  for (let i = 0; i < 365; i++) {
    const cell = document.createElement('div');
    cell.classList.add('commit-cell');
    const cellDate = new Date(today);
    cellDate.setDate(today.getDate() - i);
    cell.dataset.date = cellDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    commitGrid.appendChild(cell);
  }

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

    cell.addEventListener('mouseover', () => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = `${date} - ${commitCount} commit${commitCount !== 1 ? 's' : ''}`;
      document.body.appendChild(tooltip);

      const rect = cell.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX + 10}px`;
      tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
    });

    cell.addEventListener('mouseout', () => {
      const tooltip = document.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
    });
  }
}