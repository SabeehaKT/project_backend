const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes')
const app = express();
const path = require("path");
const port = 3000;

dotenv.config();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const con_string = process.env.CONNECTION_STRING

mongoose.connect(con_string).then(()=>{
    console.log('mongoDB connected successfully');
}).catch((err)=>{
    console.log('mongoDB connection failed due to : ',err);
})



app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
