#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('dotenv').config();

const webSocketServer = require('ws').Server;
const httpsServer = require('https').createServer;
const redisClient = require('redis').createClient;

var app = require('./app');
const fs = require('fs');

/**
 * Get port from environment and store in Express.
*/
var port = normalizePort(8080);

const publisher = redisClient({
    'url': process.env.REDIS_PUBSUB
});
const subscriber = redisClient({
    'url': process.env.REDIS_PUBSUB
});

(async function () {
    try {
        await publisher.connect();
        await subscriber.connect();
    } catch (error) {
        console.log(error.message);
    }
})();

/**
 * Create HTTPS server.
 */
var privateKey = fs.readFileSync('./net/privkey.pem', 'utf8');
var certificate = fs.readFileSync('./net/fullchain.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };
const server = httpsServer(credentials, app);

var wss = new webSocketServer({ server: server });

wss.addListener('connection', (ws) => {
    ws.addListener('open', () => {
        console.log('socket opened');
    });
    ws.addListener('close', () => {
        console.log('socket closed');
    });
    ws.addListener('message', async (data) => {
        try {
            data = typeof data === 'object' && JSON.parse(data);
            if (typeof data === 'object') return messageHandler(ws, data);
        } catch (error) {
            ws.send(`Invalid payload`);
        }
    });
});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

const messageHandler = (ws, data) => {
    switch (data.action) {
        case 'ping':
            ws.send(JSON.stringify({ pong: 1 }));
            break;
        case 'subscribe':
            rSubscribe(ws, data);
            break;
        case 'publish':
            rPublish(data);
            break;
        case 'unsubscribe':
            rUnsubscribe(data);
        default:
            break;
    }
}

const rSubscribe = async (ws, data) => {
    try {
        await subscriber.subscribe(data.channel, (content) => {
            ws.send(content);
        });
    } catch (error) {
        console.error(error.message);
    }
}

const rPublish = async (data) => {
    try {
        await publisher.publish(
            data.channel,
            JSON.stringify(data.message)
        );
    } catch (error) {
        console.error(error.message);
    }
}

const rUnsubscribe = async (data) => {
    try {
        await subscriber.unsubscribe(data.channel);
    } catch (error) {
        console.error(error.message);
    }
}

process.on('warning', e => console.warn(e.stack))

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
