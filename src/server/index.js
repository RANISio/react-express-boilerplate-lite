const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('./public'));

app.use("/api", (req, res) => {
  res.send("API ENDPOINT");
});

// Launch the server
app.listen(port, (error) => {
  if (error) throw error;
  console.log(`The server is running at http://localhost:${port}/`);
});
