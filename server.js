const express = require('express');
const path = require('path');
// require('dotenv').config();
const app = express(); // create express app

// Serve static files
app.use(express.static(path.join(__dirname, '.')));
app.use('/CSS' , express.static(path.join(__dirname + '/CSS')));
app.use('/images' , express.static(path.join(__dirname + '/images')));

// Serve the index.html
app.get('/', (req, res) =>
  res.sendFile(__dirname + '/index.html'));

/*
fetch('https://api.github.com/users/bmeinert8/events', {
  headers: {
    'Authorization': 'token ' + process.env.GITHUB_TOKEN
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
*/

app.listen(3000, () => console.log('Server is running on port 3000'));