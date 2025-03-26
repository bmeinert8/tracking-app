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
  
  initializeInfoButton();
}

function initializeInfoButton() {
  const infoButton = document.querySelector('.js-info-button');
  const modal = document.querySelector('.js-commit-info-modal');
  const closeButton = document.querySelector('.js-commit-info-close');

  if (!infoButton || !modal || !closeButton) {
    console.error('Info button, modal, or close button not found');
    return;
  }

  // Open modal on info button click
  infoButton.addEventListener('click', () => {
    modal.classList.add('is-active');
    infoButton.setAttribute('aria-expanded', 'true');
    closeButton.focus(); // Move focus to the close button for accessibility
  });

  // Close modal on close button click
  closeButton.addEventListener('click', () => {
    modal.classList.remove('is-active');
    infoButton.setAttribute('aria-expanded', 'false');
    infoButton.focus(); // Return focus to the info button
  });

  // Close modal on Escape key press
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      modal.classList.remove('is-active');
      infoButton.setAttribute('aria-expanded', 'false');
      infoButton.focus();
    }
  });
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

  // calculate dynamic threshold
  const commitCountsArray = []
  for (let i = 0; i < 365; i ++) {
    const cellDate = new Date(today);
    cellDate.setDate(today.getDate() - i);
    const dateStr = cellDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    commitCountsArray.push(commitCounts[dateStr] || 0);
  }

  // Sort array to find percentiles
  commitCountsArray.sort((a, b) => a - b);
  const maxCommits = commitCountsArray[commitCountsArray.length - 1];

  // Define percentiles (20th, 40th, 60th, 80th)
  const thresholds = {
    least: 0,
    less: commitCountsArray[Math.floor(0.2 * 365)] || 1, // 20th percentile
    medium: commitCountsArray[Math.floor(0.4 * 365)] || 3, // 40th percentile
    more: commitCountsArray[Math.floor(0.6 * 365)] || 6, // 60th percentile
    most: commitCountsArray[Math.floor(0.8 * 365)] || 9 // 80th percentile 
  };

  // Ensure thresholds are increasing and reasonable
  if (thresholds.less < 1) thresholds.less = 1;
  if (thresholds.medium <= thresholds.less) thresholds.medium = thresholds.less + 1;
  if (thresholds.more <= thresholds.medium) thresholds.more = thresholds.medium + 1;
  if (thresholds.most <= thresholds.more) thresholds.most = thresholds.more + 1;

  console.log('Dynamic Thresholds:', thresholds);

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