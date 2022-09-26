const express = require('express');

const cors = require('cors');
const helmet = require("helmet");
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

module.exports = app;