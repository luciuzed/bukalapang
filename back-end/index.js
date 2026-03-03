const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6767;

app.use(cors());
app.use(express.json());
app.get('/api/test', (req, res) => {
  res.json({ message: "test" });
});

app.listen(PORT, () => {
  console.log(`testtttttt`);
});