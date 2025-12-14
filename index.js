require('dotenv').config()
const express = require("express")

const app = express();

const PORT = 3000;

app.get('/', (req, res)=>{
    res.send("Express setup successful")
})

app.get('/home', (req, res)=>{
    res.send("<h1>Hi There!</h1><p>Welcome to our home page</p>")
})

app.listen(process.env.PORT, ()=>{
    console.log(`running on port ${process.env.PORT}`)
})