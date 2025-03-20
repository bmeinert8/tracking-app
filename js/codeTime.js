console.log('Page loaded');
export function initializeCodeTime() {
  const timeDisplay = document.querySelector('.js-time-text');
  const startButton = document.querySelector('.js-start-button');
  const stopButton = document.querySelector('.js-stop-button');
  const resetButton = document.querySelector('.js-reset-button');
  const saveButton = document.querySelector('.js-save-button');

  // Error message in console if an issue occurs with any of the elements in code time.
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

  // Store the chart instance
  let chartInstance = null;

  console.log('Loaded State:', savedState);

  // Function to update the display
  function updateDisplay() {
    timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    saveState(); // Save state on every update.
  }

  // Function to save state
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
    const timeDisplay = document.querySelector('.js-time-text');
    if (!timeDisplay) {
      console.error('Timer display element not found');
      return;
    }
    const [hours, minutes, seconds] = timeDisplay.textContent.split(':').map(Number);
  
    const logData = {
      hours,
      minutes,
      seconds,
      timestamp: new Date().toISOString()
    };
  
    try {
      const response = await fetch('http://localhost:3000/api/saveLog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save log: ${response.status} - ${errorText}`);
      }
  
      console.log('Log saved successfully');
      renderChart();
      resetTimer();
  
      // Show confirmation message
      const confirmationElement = document.querySelector('.js-save-confirmation');
      if (confirmationElement) {
        confirmationElement.style.display = 'block';
        setTimeout(() => {
          confirmationElement.style.display = 'none';
        }, 2000); // Hide after 2 seconds
      }
    } catch (error) {
      console.error('Error saving log:', error);
      // Show error message
      const errorElement = document.querySelector('.js-save-error');
      if (errorElement) {
        errorElement.style.display = 'block';
        setTimeout(() => {
          errorElement.style.display = 'none';
        }, 3000); // Hide after 3 seconds
      }
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
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      logs.forEach(log => {
        if (!log.timestamp) return;
        const logDate = new Date(log.timestamp);
        if (logDate < sevenDaysAgo) return;
        const date = logDate.toISOString().split('T')[0];
        const totalSeconds = (log.hours * 3600) + (log.minutes * 60) + log.seconds;
        dailyTotals[date] = (dailyTotals[date] || 0) + totalSeconds;
      });

      const labels = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        labels.push(`${month}/${day}`);
      }
      labels.reverse();

      const fullLabels = Object.keys(dailyTotals);
      const data = labels.map(label => {
        const fullDate = `${today.getFullYear()}-${String(label.split('/')[0]).padStart(2, '0')}-${String(label.split('/')[1]).padStart(2, '0')}`;
        return (dailyTotals[fullDate] || 0) / 3600;
      });

      // Calculate the total code time
      const totalHours = data.reduce((sum, hours) => sum + hours, 0);
      const totalSeconds = totalHours * 3600;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const totalTimeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Display the total
      const totalElement = document.querySelector('.js-code-time-total');
      if (totalElement) {
        totalElement.textContent = `Code Time Past 7 Days: ${totalTimeString}`;
      } else {
        console.error('Total code time element not found');
      }

      // Calculate the max value from the data
      const maxHours = Math.max(...data, 0.001);
      const roundedMax = Math.ceil(maxHours * 1000) / 1000;
      const midPoint = roundedMax / 2;

      const ctx = document.getElementById('codeTimeChart').getContext('2d');

      // Destroy the existing chart instance if it exists
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      // Create a new chart instance
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Coding Time (Hours)',
            data: data,
            backgroundColor: 'rgba(58, 155, 176, 0.6)',
            borderColor: 'rgba(58, 155, 176, 1)',
            borderWidth: 1,
            barThickness: 20,
            maxBarThickness: 20
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: roundedMax,
              title: {
                display: false
              },
              ticks: {
                callback: value => value.toFixed(3),
                color: '#ffffff',
                font: { size: 10 },
                stepSize: midPoint,
                values: [0, midPoint, roundedMax]
              }
            },
            x: {
              title: {
                display: false
              },
              ticks: {
                color: '#ffffff',
                font: { size: 10 }
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#ffffff',
                font: { size: 12 }
              }
            },
            title: {
              display: false
            }
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
          hours++;
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