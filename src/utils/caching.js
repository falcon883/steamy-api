const Redis = require("ioredis");
const logger = require('./logger')

class RedisCache {
    constructor() {
        this.isConnected = false
        this.redis = new Redis({
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
            // password: process.env.REDIS_PASSWORD, # uncomment if redis password is set
        });

        this.redis.on('connect', () => {
            logger.info('Redis: Connected');
            this.isConnected = true
        })

        this.redis.on('error', (e) => {
            this.isConnected = false
            logger.error(e);
        });

        this.redis.on('reconnecting', () => {
            this.isConnected = false
            logger.warn('Redis: Reconnecting');
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
            logger.error(error)
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
            logger.error(error)
        }
    }

    async getMultipleCache(keys) {
        try {
            return await this.redis.mget(keys)
        } catch (error) {
            logger.error(error)
        }
    }

    async getKeys(pattern) {
        try {
            return await this.redis.keys(pattern)
        } catch (error) {
            logger.error(error)
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