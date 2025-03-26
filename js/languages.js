import { escapeHTML } from "./utils.js";

console.log('Languages module loaded');

export function initializeLanguages() {
  // Placeholder for chart instance
  let chartInstance = null;

  // Mapping of known languages to colors (based on CSS variables)
  const languageColorMap = {
    'HTML': 'rgba(227, 93, 25, 0.6)',    // --HTMLColor (red)
    'CSS': 'rgba(91, 0, 181, 0.6)',      // --CSSColor (teal)
    'JavaScript': 'rgba(255, 255, 1, 0.6)', // --JSColor (yellow)
    'Bicep': 'rgba(48, 169, 255, 0.6)',  // --BicepColor (Azure Blue)
    'PowerShell': 'rgba(4, 0, 88, 0.6)',  // --PowerShellColor (dark blue)
    'Python': 'rgba(46, 79, 244, 0.6)'   // --PythonColor (light blue)
  };

  // Load persisted colors for new languages from localStorage
  const persistedColors = JSON.parse(localStorage.getItem('languageColors') || '{}');

  // Function to generate a new color using HSL
  function generateColor(index) {
    // Use HSL to generate a distinct color by varying the hue
    const hue = (index * 137.5) % 360; // Golden angle approximation for even distribution
    return `hsla(${hue}, 70%, 60%, 0.6)`; // 70% saturation, 60% lightness, 0.6 opacity
  }

  // Function to get or assign a color for a language
  function getLanguageColor(language, index) {
    // Check if the language has a predefined color
    if (languageColorMap[language]) {
      return languageColorMap[language];
    }

    // Check if the language has a persisted color
    if (persistedColors[language]) {
      return persistedColors[language];
    }

    // Generate a new color for the language
    const newColor = generateColor(Object.keys(persistedColors).length + index);
    persistedColors[language] = newColor;
    // Save the updated persisted colors to localStorage
    localStorage.setItem('languageColors', JSON.stringify(persistedColors));
    return newColor;
  }

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

      // Assign colors to languages
      const backgroundColors = languages.map((item, index) => {
        const color = getLanguageColor(item.language, index);
        return color;
      });
      const borderColors = backgroundColors.map(color => {
        if (color.startsWith('rgba')) {
          return color.replace('0.6', '1');
        } else if (color.startsWith('hsla')) {
          return color.replace('0.6', '1');
        }
        return color;
      });

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
            borderWidth: 1,
            hoverOffset: 10
          }]
        },
        options: {
          animation: {
            animateScale: true,
            animateRotate: true
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(51, 51, 51, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: 'rgba(233, 69, 96, 1)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value}%`;
                }
              }
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
      const sanitizedLanguage = escapeHTML(item.language);
      const sanitizedPercentage = escapeHTML(item.percentage.toString());
      legendItem.innerHTML = `
        <span class="legend-color" style="background-color: ${colors[index]};"></span>
        <span class="legend-label">${sanitizedLanguage}: ${sanitizedPercentage}%</span>
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
      modal.classList.add('is-active');
      toggleButton.setAttribute('aria-expanded', 'true');
      closeButton.focus();
      document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeButton.addEventListener('click', () => {
      modal.classList.remove('is-active'); // Remove class to hide modal
      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.focus();
      document.body.style.overflow = 'auto';
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-active')) {
        modal.classList.remove('is-active'); // Remove class to hide modal
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.focus();
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Initial render
  renderLanguageChart();
}