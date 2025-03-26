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
  
    // Generate timestamp in EST
    const now = new Date();
    const estOffset = -5 * 60; // EST is UTC-5 (in minutes)
    const estTime = new Date(now.getTime() + estOffset * 60 * 1000);
    const timestamp = estTime.toISOString().replace('Z', '-05:00'); // Indicate EST offset
  
    const logData = {
      hours,
      minutes,
      seconds,
      timestamp
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
  
      const result = await response.json();
      console.log('Log saved successfully:', result);
  
      // Reset the timer and show the confirmation message
      resetTimer();
  
      // Show confirmation message
      const confirmationElement = document.querySelector('.js-save-confirmation');
      if (confirmationElement) {
        confirmationElement.style.display = 'block';
        setTimeout(() => {
          confirmationElement.style.display = 'none';
        }, 2000); // Hide after 2 seconds
      }
  
      // Wait a brief moment to ensure the server has updated the logs file
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
  
      // Now render the chart with the updated data
      await renderChart();
    } catch (error) {
      console.error('Error saving log:', error);
      // Show error message
      const errorElement = document.querySelector('.js-save-error');
      if (errorElement) {
        // Check if the error is due to rate limiting (429)
        if (error.message.includes('429')) {
          errorElement.textContent = 'Too many requests. Please try again later.';
        } else {
          errorElement.textContent = 'Error saving log. Please try again.';
        }
        errorElement.style.display = 'block';
        setTimeout(() => {
          errorElement.style.display = 'none';
          errorElement.textContent = 'Error saving log. Please try again.'; // Reset to default message
        }, 3000); // Hide after 3 seconds
      }
    }
  }

  // Function to convert seconds to hours and minutes with rounding
  function secondsToHoursMinutes(totalSeconds) {
    // Apply rounding based on seconds
    let seconds = totalSeconds % 60;
    let minutes = Math.floor(totalSeconds / 60);
    if (seconds >= 30) {
      minutes += 1; // Round up
    }
    const hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    return { hours, minutes };
  }

  // Function to format time as H:MM
  function formatTime(hours, minutes) {
    // Omit leading zero for single-digit hours
    const hoursStr = hours < 10 ? hours : String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    return `${hoursStr}:${minutesStr}`;
  }

  // Function to render chart
  async function renderChart() {
    try {
      const response = await fetch('http://localhost:3000/api/getLogs');
      if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`);
      }
      const logs = await response.json();
      console.log('Fetched logs:', logs);
  
      const dailyTotals = {};
      const today = new Date();
      // Adjust today to EST
      const estOffset = -5 * 60; // EST is UTC-5
      const todayEST = new Date(today.getTime() + estOffset * 60 * 1000);
      const sevenDaysAgo = new Date(todayEST);
      sevenDaysAgo.setDate(todayEST.getDate() - 6);
  
      logs.forEach(log => {
        if (!log.timestamp) return;
        // Parse the timestamp and convert to EST
        const logDate = new Date(log.timestamp);
        const logDateEST = new Date(logDate.getTime() + estOffset * 60 * 1000);
        if (logDateEST < sevenDaysAgo) return;
        const date = logDateEST.toISOString().split('T')[0];
        const totalSeconds = (log.hours * 3600) + (log.minutes * 60) + log.seconds;
        dailyTotals[date] = (dailyTotals[date] || 0) + totalSeconds;
      });
      console.log('Daily totals:', dailyTotals);
  
      const labels = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(todayEST);
        date.setDate(todayEST.getDate() - i);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        labels.push(`${month}/${day}`);
      }
      labels.reverse();
  
      const fullLabels = Object.keys(dailyTotals);
      const dataInSeconds = labels.map(label => {
        const fullDate = `${todayEST.getFullYear()}-${String(label.split('/')[0]).padStart(2, '0')}-${String(label.split('/')[1]).padStart(2, '0')}`;
        return dailyTotals[fullDate] || 0;
      });

      // Convert data to hours and minutes for display, but keep raw hours for chart scaling
      const dataInHoursMinutes = dataInSeconds.map(seconds => secondsToHoursMinutes(seconds));
      const dataInHours = dataInSeconds.map(seconds => seconds / 3600); // For chart scaling
      console.log('Chart data (hours and minutes):', dataInHoursMinutes);
      console.log('Chart data (hours for scaling):', dataInHours);
  
      // Calculate the total code time
      const totalSeconds = dataInSeconds.reduce((sum, seconds) => sum + seconds, 0);
      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      const totalSecondsRemaining = Math.floor(totalSeconds % 60);
      const totalTimeString = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSecondsRemaining).padStart(2, '0')}`;
      console.log('Total time string:', totalTimeString);
  
      // Display the total
      const totalElement = document.querySelector('.js-code-time-total');
      if (totalElement) {
        totalElement.textContent = `Code Time Past 7 Days: ${totalTimeString}`;
      } else {
        console.error('Total code time element not found');
      }
  
      // Calculate max hours for scaling the y-axis
      const maxHours = Math.max(...dataInHours, 0.001);
      const roundedMaxHours = Math.ceil(maxHours); // Round up to the nearest hour
      const midPointHours = roundedMaxHours / 2;

      // Convert max and midpoint to hours and minutes for display
      const maxTime = secondsToHoursMinutes(roundedMaxHours * 3600);
      const midTime = secondsToHoursMinutes(midPointHours * 3600);
  
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
            label: 'Coding Time',
            data: dataInHours, // Use raw hours for chart scaling
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
              max: roundedMaxHours,
              title: {
                display: false
              },
              ticks: {
                callback: function(value) {
                  const { hours, minutes } = secondsToHoursMinutes(value * 3600);
                  return formatTime(hours, minutes);
                },
                color: '#ffffff',
                font: { size: 10 },
                stepSize: midPointHours,
                values: [0, midPointHours, roundedMaxHours]
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
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const { hours, minutes } = dataInHoursMinutes[index];
                  return `Coding Time: ${formatTime(hours, minutes)}`;
                }
              }
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