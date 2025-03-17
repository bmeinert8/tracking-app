export function initializeCodeTime() {
  const timeDisplay = document.querySelector('.js-time-text');
  const startButton = document.querySelector('.js-start-button');
  const stopButton = document.querySelector('.js-stop-button');
  const resetButton = document.querySelector('.js-reset-button');

  //error message in console if an issue incurs with any of the elements in code time.
  if (!timeDisplay || !startButton || !stopButton || !resetButton) {
    console.error('One or more timer elements not found:', {
      timeDisplay,
      startButton,
      stopButton,
      resetButton
    });
    return;
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let intervalId = null;

  // Function to update the display
  function updateDisplay() {
    timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  updateDisplay();
}