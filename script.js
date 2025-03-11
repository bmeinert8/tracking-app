//Step 2: Fetch and log GitHub API Data
//This section makes and API call to GitHub to get the user's recent events.
//logs the response for inspection, and populates the commit grid.
//The goal is to confirm we have commit data to work with.

fetch('https://api.github.com/users/bmeinert8/events', {
  // Fetch data from GitHub API for user 'bmeinert8'
  // 'events' endpoint returns recent public events (up to 30 by default)
  headers: {
    'Authorization': 'token #'
    // Authorization header with Personal Access Token (PAT) for aithenticated access
    // REMOVE
  }
})
.then(response => {
  // Handle the HTTP response from the API
  if (!response.ok) {
    // Check if the response status is not OK (e.g., 404, 403)
    //If not, throw an error with the status code for debugging.
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  // If response is OK, parse the JSON data and pass it ot the next .then()
  return response.json();
})
.then(data => {
  // Parse the JSON data from the API response.
  console.log('Full GitHub API Response:', data);
  // Log the full response array.
  console.log('First 3 Events:', data.slice(0, 3));
  // log the first 3 events in the array.
  const pushEvents = data.filter(event => event.type === 'PushEvent');
  // filter the response array to only include PushEvents and save it to a new array.
  console.log('PushEvents:', pushEvents);
  // log the new array of PushEvents.
  if (pushEvents.length > 0) {
    // Check if there are any PushEvents to process.
    console.log('First PushEvent:', pushEvents[0]);
    // log the first PushEvent object to inspect its details.
    console.log('Commits in First PushEvent:', pushEvents[0].payload.commits);
    // log the commits array within the first PushEvent
    console.log('Date of First PushEvent:', pushEvents[0].created_at);
    // log the creation date of the first PushEvent
  } else {
    console.log('No PushEvents found in the response.');
    // log a message if no PushEvents were found.
  }

  // Populate the commit grid with 365 cells.
  const commitGrid = document.querySelector('.js-commit-grid');
  //select the commit grid element by its class name.
  for (let i = 0; i< 365; i++) {
    // Loop 365 times to create a cell for each day of the year.
    const cell = document.createElement('div');
    // Create a new div element for each cell.
    cell.classList.add('commit-cell');
    // Add the 'commit-cell' class to each cell for stylization..
    commitGrid.appendChild(cell);
    // Append each cell to the commit grid.
  }
})
.catch(error => console.error('Error fetching GitHub data:', error));
// Catch any errors and log them to the console for debugging.

