require('dotenv').config();

fetch('https://api.github.com/users/bmeinert8/events', {
  headers: {
    'Authorization': 'token ' + process.env.GITHUB_TOKEN
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));