fetch('https://api.github.com/users/bmeinert8/events', {
  headers: {
    'Authorization': 'token 
  }
})
.then(response => response.json())
.then(data => {
  console.log(data); // Log the data to inspect it
})
.catch(error => console.error('Error:', error));

const commitGrid = document.querySelector('.js-commit-grid');
for (let i = 0; i< 365; i++) {
  const cell = document.createElement('div');
  cell.classList.add('commit-cell');
  commitGrid.appendChild(cell);
}