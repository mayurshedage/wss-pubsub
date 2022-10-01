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

app.get("/api/:n", function (req, res) {
    let n = parseInt(req.params.n);
    let count = 0;

    if (n > 500000) n = 500000;

    for (let i = 0; i <= n; i++) {
        count += i;
    }

    res.send(`Final count is ${count}`);
});

module.exports = app;