// requiring needed packages from node
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
let ejs = require('ejs');

const app = express();
app.use(express.static('public'));
const port = 3000; // server port 

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crypto',
  password: '23040106',
  port: 5432,
});

// Fetch data from the API and store it in the database
async function fetchApiDataAndStoreInDataBase() {
  try {
    const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
    const crypto = response.data;

    const client = await pool.connect();

    // Delete existing data from the table before inserting new data
    await client.query('DELETE FROM crypto');

     // Get the top 10 results from API
     const top10Results = Object.values(crypto).slice(0, 10);
     
    // Insert new data into the table
    for (const crypt of top10Results) {
      const { name, last, buy, sell, volume, base_unit } = crypt;
      await client.query(
        'INSERT INTO crypto (name, last, buy, sell, volume, base_unit) VALUES ($1, $2, $3, $4, $5, $6)',
        [name, last, buy, sell, volume, base_unit]
      );
    }
    client.release();
    console.log('Data stored in the database successfully.');
  } catch (error) {
    console.error('Error storing data in the database:', error);
  }
}

// Fetch and store data from the API every 10 seconds
setInterval(fetchApiDataAndStoreInDataBase, 10000);

// Route to retrieve stored data from the database
// we retrive stored data to homepage 
app.get('/data', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM crypto');
    const crypto = result.rows;
    // console.log(crypto);
    client.release();
    res.json(crypto);
  } catch (error) {
    console.error('Error retrieving data from the database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
//homepage route
app.get("/", (req,res) =>{
  res.sendFile(__dirname + "/homepage.html");
});
/**
 * before visiting `http://localhost:3000/`
 * make sure to run server.js
 * using command `node server.js` is terminal 
 */
app.listen(port, () => {
  console.log(`Server running at http://localhost:3000/ `)
});
