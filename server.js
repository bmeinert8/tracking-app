const express = require('express');
const path = require('path');
const app = express(); // create express app

app.use(express.static(path.join(__dirname, '.')));
app.use('/CSS' , express.static(path.join(__dirname + '/CSS')));
app.use('/images' , express.static(path.join(__dirname + '/images')));

app.get('/', (req, res) =>
  res.sendFile(__dirname + '/index.html'));

app.listen(3000, () => console.log('Server is running on port 3000'));