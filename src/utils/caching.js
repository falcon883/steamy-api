const Redis = require("ioredis");

class RedisCache {
    constructor() {
        this.isConnected = false
        this.redis = new Redis({
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
            password: process.env.REDIS_PASSWORD,
        });

        this.redis.on('connect', () => {
            console.log('Redis: Connected');
            this.isConnected = true
        })

        this.redis.on('error', (e) => {
            this.isConnected = false
            console.log((new Date()) + 'Redis: Disconnected');
            console.log(e);
        });

        this.redis.on('reconnecting', () => {
            this.isConnected = false
            console.log('Redis: Reconnecting');
        })
    }

    /**
     * 
     * @param {string} key Key to identify data
     * @param {string} value Value of given value
     * @param {string|number} expires Time in seconds after which data expires
     */
    async setCache(key, value, expires = 0) {
        try {
            if (!expires) {
                return await this.redis.set(key, value)
            }

            return await this.redis.set(key, value, 'EX', expires)
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * 
     * @param {string} key Key to retrive data
     * @returns Data if key is present or null
     */
    async getCache(key) {
        try {
            return await this.redis.get(key)
        } catch (error) {
            console.log(error);
        }
    }

    async getMultipleCache(keys) {
        try {
            return await this.redis.mget(keys)
        } catch (error) {
            console.log(error);
        }
    }

    async getKeys(pattern) {
        try {
            return await this.redis.keys(pattern)
        } catch (error) {
            console.log(error);
        }
    }

    async getSummaryCache(id) {
        let response = await this.redis.get(`USRSM_${id}`)

        if (response) {
            return { isPresent: true, data: JSON.parse(response) }
        } else {
            return { isPresent: false, data: id }
        }
    }
}

module.exports = RedisCache