import { createClient } from "redis";

let _client = null;
let _isFallback = false;

const inMemoryData = new Map();
const inMemorySets = new Map();
const inMemoryHashes = new Map();
const inMemoryTimeouts = new Map();

class InMemoryRedisClient {
  constructor() {
    this.isOpen = true;
    this.isReady = true;
  }

  async connect() {
    this.isOpen = true;
    return this;
  }

  async disconnect() {
    this.isOpen = false;
  }

  async quit() {
    this.isOpen = false;
  }

  duplicate() {
    return new InMemoryRedisClient();
  }

  on() {
    return this;
  }

  async get(key) {
    return inMemoryData.has(key) ? inMemoryData.get(key) : null;
  }

  async set(key, value) {
    inMemoryData.set(key, String(value));
    return "OK";
  }

  async del(keys) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    let count = 0;
    for (const k of keyList) {
      if (inMemoryData.delete(k)) count++;
      if (inMemorySets.delete(k)) count++;
      if (inMemoryHashes.delete(k)) count++;
      if (inMemoryTimeouts.has(k)) {
        clearTimeout(inMemoryTimeouts.get(k));
        inMemoryTimeouts.delete(k);
      }
    }
    return count;
  }

  async incr(key) {
    const val = parseInt(inMemoryData.get(key) || "0", 10) + 1;
    inMemoryData.set(key, String(val));
    return val;
  }

  async expire(key, seconds) {
    if (inMemoryTimeouts.has(key)) {
      clearTimeout(inMemoryTimeouts.get(key));
    }
    const timer = setTimeout(() => {
      inMemoryData.delete(key);
      inMemorySets.delete(key);
      inMemoryHashes.delete(key);
      inMemoryTimeouts.delete(key);
    }, seconds * 1000);
    inMemoryTimeouts.set(key, timer);
    return 1;
  }

  async sAdd(key, ...members) {
    if (!inMemorySets.has(key)) {
      inMemorySets.set(key, new Set());
    }
    const set = inMemorySets.get(key);
    let count = 0;
    for (const m of members.flat()) {
      if (!set.has(m)) {
        set.add(m);
        count++;
      }
    }
    return count;
  }

  async sRem(key, ...members) {
    if (!inMemorySets.has(key)) return 0;
    const set = inMemorySets.get(key);
    let count = 0;
    for (const m of members.flat()) {
      if (set.delete(m)) count++;
    }
    return count;
  }

  async sMembers(key) {
    if (!inMemorySets.has(key)) return [];
    return Array.from(inMemorySets.get(key));
  }

  async hSet(key, field, value) {
    if (!inMemoryHashes.has(key)) {
      inMemoryHashes.set(key, new Map());
    }
    const hash = inMemoryHashes.get(key);
    if (typeof field === "object" && field !== null) {
      for (const [k, v] of Object.entries(field)) {
        hash.set(k, String(v));
      }
      return Object.keys(field).length;
    }
    hash.set(field, String(value));
    return 1;
  }

  async hGet(key, field) {
    if (!inMemoryHashes.has(key)) return null;
    const hash = inMemoryHashes.get(key);
    return hash.has(field) ? hash.get(field) : null;
  }

  async hGetAll(key) {
    if (!inMemoryHashes.has(key)) return {};
    const hash = inMemoryHashes.get(key);
    const obj = {};
    for (const [k, v] of hash.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  async hDel(key, field) {
    if (!inMemoryHashes.has(key)) return 0;
    const hash = inMemoryHashes.get(key);
    return hash.delete(field) ? 1 : 0;
  }

  async hLen(key) {
    if (!inMemoryHashes.has(key)) return 0;
    return inMemoryHashes.get(key).size;
  }
}

export const isRedisAvailable = () => !_isFallback && _client?.isOpen;

const buildRealClient = () => {
  return createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    socket: {
      connectTimeout: 1500,
      reconnectStrategy: false,
    },
  });
};

export const connectRedis = async () => {
  if (_client) return;

  const candidate = buildRealClient();
  try {
    await candidate.connect();
    console.log("Redis connected successfully");
    _client = candidate;
    _isFallback = false;
  } catch (err) {
    console.warn(`[redis] Redis not running locally (${err.message}).`);
    console.log("[redis] Using built-in in-memory cache/presence store for local development.");
    _client = new InMemoryRedisClient();
    _isFallback = true;
  }
};

const getClient = () => {
  if (!_client) {
    _client = new InMemoryRedisClient();
    _isFallback = true;
  }
  return _client;
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