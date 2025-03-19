console.log('Page loaded');
export function initializeCodeTime() {
  const timeDisplay = document.querySelector('.js-time-text');
  const startButton = document.querySelector('.js-start-button');
  const stopButton = document.querySelector('.js-stop-button');
  const resetButton = document.querySelector('.js-reset-button');
  const saveButton = document.querySelector('.js-save-button');

  //error message in console if an issue incurs with any of the elements in code time.
  if (!timeDisplay || !startButton || !stopButton || !resetButton) {
    console.error('One or more timer elements not found:', {
      timeDisplay,
      startButton,
      stopButton,
      resetButton,
      saveButton
    });
    return;
  }

  // Load saved state from localStorage
  const savedState = JSON.parse(localStorage.getItem('codeTimeState') || '{}');
  let hours = savedState.hours || 0;
  let minutes = savedState.minutes || 0;
  let seconds = savedState.seconds || 0;
  let intervalId = null;
  let isRunning = savedState.isRunning || false;

  console.log('Loaded State:',savedState);

  // Function to update the display
  function updateDisplay() {
    timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    saveState(); // Save state on every update.
  }

  // Function to save State
  function saveState() {
    const state = {
      hours,
      minutes,
      seconds,
      isRunning: !!intervalId // Convert intervalId to boolean (true if running)
    };
    localStorage.setItem('codeTimeState', JSON.stringify(state));
  }

  async function saveLog() {
    console.log('Save button clicked');
    const timestamp = new Date().toISOString();
    const params = new URLSearchParams({
      timestamp,
      hours: hours.toString(),
      minutes: minutes.toString(),
      seconds: seconds.toString()
    });
    try {
      const response = await fetch(`http://localhost:3000/api/saveLog?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (result.success) {
        console.log('Saved Log:', result.log);
        // await renderChart(); // Uncomment later when graph is added
      } else {
        console.error('Failed to save log:', result.error);
      }
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  // Function to render chart
  async function renderChart() {
    try {
      const response = await fetch('http://localhost:3000/api/getLogs');
      if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`);
      }
      const logs = await response.json();
  
      const dailyTotals = {};
      logs.forEach(log => {
        if (!log.timestamp) return;
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        const totalSeconds = (log.hours * 3600) + (log.minutes * 60) + log.seconds;
        dailyTotals[date] = (dailyTotals[date] || 0) + totalSeconds;
      });
  
      const labels = Object.keys(dailyTotals);
      const data = Object.values(dailyTotals).map(seconds => seconds / 3600);
  
      // Define ctx here
      const ctx = document.getElementById('codeTimeChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Coding Time (Hours)',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Hours' },
              ticks: { stepSize: 0.02, callback: value => value.toFixed(3) }
            },
            x: { title: { display: true, text: 'Date' } }
          },
          plugins: {
            legend: { labels: { color: '#ffffff' } },
            title: { display: true, text: 'Daily Coding Time', color: '#ffffff' }
          }
        }
      });
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }
  // Function to start the timer
  function startTimer() {
    if (!intervalId) {
      intervalId = setInterval(() => {
        seconds++;
        if (seconds === 60) {
          seconds = 0;
          minutes++;
        }
        if (minutes === 60) {
          minutes = 0;
          hours++
        }
        updateDisplay();
      }, 1000);
    }
  }

  // Function to stop the timer
  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      isRunning = false;
      saveState();
    }
  }

  // Function to reset the code timer
  function resetTimer() {
    stopTimer();
    hours = 0;
    minutes = 0;
    seconds = 0;
    updateDisplay();
  }

  // Resume timer if it was running
  if (isRunning && !intervalId) {
    startTimer();
  }

  updateDisplay();

  startButton.addEventListener('click', startTimer);
  stopButton.addEventListener('click', stopTimer);
  resetButton.addEventListener('click', resetTimer);
  saveButton.addEventListener('click', saveLog);

  renderChart(); // Initial render
}