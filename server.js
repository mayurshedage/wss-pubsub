#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('dotenv').config();

const createWSS = require('ws').Server;
const httpsServer = require('https').createServer;
const { WSListener } = require('./listener');

const app = require('./app');
const fs = require('fs');

/**
 * Get port from environment and store in Express.
*/
const port = normalizePort(process.env.SOCKET_PORT);

const cluster = require('cluster');
const numCores = require('os').cpus().length;

const privateKey = fs.readFileSync('./prod/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./prod/fullchain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

// if (cluster.isMaster) {} else {}
/**
 * Create HTTPS server.
 */

const sslServer = httpsServer(credentials, app);
const webSocketServer = new createWSS({ server: sslServer });

WSListener(webSocketServer);

/**
 * Listen on provided port, on all network interfaces.
 */
sslServer.listen(port);
sslServer.on('error', onError);
sslServer.on('listening', onListening);

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
    var addr = sslServer.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
