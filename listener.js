require('dotenv').config();

const redisClient = require('redis').createClient;

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

const messageListener = (ws, data) => {
    switch (data.action) {
        case 'ping':
            ws.send(JSON.stringify({ pong: new Date().toJSON() }));
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

module.exports = { messageListener };