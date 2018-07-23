const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const morgan = require('morgan');
const request = require('request');
const app = express()
const port = process.env.PORT || 4000
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
app.use(morgan('combined'))
app.get('/webhook', (req, res) => res.sendStatus(200))
app.listen(port);
console.log('Server is listening on ' + port);