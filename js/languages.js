console.log('Languages module loaded');

export function initializeLanguages() {
  // Placeholder for chart instance
  let chartInstance = null;

  // Function to fetch and render the language chart
  async function renderLanguageChart() {
    try {
      const response = await fetch('http://localhost:3000/api/languages');
      if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`);
      }
      const languages = await response.json();
      console.log('Fetched languages:', languages);

      // Prepare data for the pie chart
      const labels = languages.map(item => item.language);
      const data = languages.map(item => item.percentage);
      const backgroundColors = languages.map((item, index) => {
        const colors = [
          'rgba(231, 61, 4, 0.6)', // HTMLColor (orange)
          'rgba(66, 0, 181, 0.6)', // CSSColor (purple)
          'rgba(229, 191, 0, 0.6)', // JSColor (yellow)
          'rgba(48, 169, 255, 0.6)', //BicepColor (Azure Blue)
          'rgba(20, 70, 103, 0.6)', // PowerShellColor (blue, new color)
          'rgba(55, 120, 191, 0.6)' // PythonColor (blue)
        ];
        return colors[index % colors.length];
      });
      const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));

      const canvas = document.getElementById('languageChart');
      if (!canvas) {
        console.error('Language chart canvas not found');
        return;
      }
      const ctx = canvas.getContext('2d');

      // Destroy the existing chart instance if it exists
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      // Create a new Chart instance
      chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }]
        },
        options: {
          plugins: {
            legend: {
              display: false // Custom legend
            }
          }
        }
      });

      // Render the legend into the modal
      renderLegend(languages, backgroundColors);

      // Set up the modal toggle functionality
      setupModalToggle();
    } catch (error) {
      console.error('Error rendering language chart:', error);
    }
  }

  // Function to render the custom legend
  function renderLegend(languages, colors) {
    const legendContainer = document.querySelector('.js-language-legend');
    if (!legendContainer) {
      console.error('Legend container not found');
      return;
    }

    // Clear existing legend
    legendContainer.innerHTML = '';

    // Create legend items
    languages.forEach((item, index) => {
      const legendItem = document.createElement('div');
      legendItem.classList.add('legend-item');
      legendItem.innerHTML = `
        <span class="legend-color" style="background-color: ${colors[index]};"></span>
        <span class="legend-label">${item.language}: ${item.percentage}%</span>
      `;
      legendContainer.appendChild(legendItem);
    });
  }

  // Function to set up the modal toggle
  function setupModalToggle() {
    const toggleButton = document.querySelector('.js-language-key-toggle');
    const modal = document.querySelector('.js-language-key-modal');
    const closeButton = document.querySelector('.js-language-key-close');

    if (!toggleButton || !modal || !closeButton) {
      console.error('Modal elements not found');
      return;
    }

    // Open modal
    toggleButton.addEventListener('click', () => {
      modal.style.display = 'block';
      toggleButton.setAttribute('aria-expanded', 'true');
      closeButton.focus(); // Focus on close button for accessibility
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });

    // Close modal
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.focus(); // Return focus to toggle button
      document.body.style.overflow = 'auto';
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.focus();
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Initial render
  renderLanguageChart();
}