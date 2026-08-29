import {createClient} from "redis";

let _client = null;
let hasLoggedError = false;

const buildClient = () => {
    const client = createClient({
        url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 5) {
                    console.error(
                        "[redis] Could not connect after 5 attempts. Is Redis running? Set REDIS_URL in .env or start a local Redis server."
                    );
                    return new Error("Redis: max reconnect attempts reached");
                }
                return Math.min(retries * 200, 2000);
            },
        },
    });

    client.on("error", (err) => {
        if (!hasLoggedError) {
            console.error("Redis Client Error:", err.message);
            hasLoggedError = true;
        }
    });
    client.on("connect", () => {
        hasLoggedError = false;
        console.log("Redis connected");
    });

    return client;
};

const getClient = () => {
    if (!_client) _client = buildClient();
    return _client;
};

export const connectRedis = async () => {
    const client = getClient();
    if (!client.isOpen) {
        await client.connect();
    }
};

const redisClient = new Proxy(
    {},
    {
        get(_target, prop) {
            const client = getClient();
            const value = client[prop];
            return typeof value === "function" ? value.bind(client) : value;
        },
    }
);

export default redisClient;