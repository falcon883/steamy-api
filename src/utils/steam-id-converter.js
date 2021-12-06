const bigInt = require("big-integer");


class SteamIDConverter {
    constructor() {
        this.BASE_NUM = bigInt('76561197960265728')
        this.REGEX_STEAMID64 = /^[0-9]{17}$/
        this.REGEX_STEAMID = /^STEAM_[0-5]:[01]:\d+$/
        this.REGEX_STEAMID3 = /^\[U:1:[0-9]+\]$/
    }

    /**
     * Generate a SteamID64 from a SteamID or SteamID3
     * @param {string} steamid 
     * @returns 
     */
    async toSteamID64(steamid) {

        if (!steamid || typeof steamid !== "string") {
            return false;
        } else if (this.isSteamID3(steamid)) {
            steamid = await this.fromSteamID3(steamid);
        } else if (!this.isSteamID(steamid)) {
            throw new TypeError('Parameter must be a SteamID (e.g. STEAM_0:1:912783)');
        }

        let split = steamid.split(':'),
            v = this.BASE_NUM,
            z = split[2],
            y = split[1];

        if (z && y) {
            return v.plus(z * 2).plus(y).toString();
        }

        return false;
    }

    /**
     * Generate a SteamID from a SteamID64 or SteamID3
     * @param {string} steamid64 
     * @returns 
     */
    async toSteamID(steamid64) {
        if (!steamid64 || typeof steamid64 !== 'string') {
            return false;
        }
        else if (this.isSteamID3(steamid64)) {
            return await this.fromSteamID3(steamid64);
        }
        else if (!this.isSteamID64(steamid64)) {
            throw new TypeError('Parameter must be a SteamID64 (e.g. 76561190000000000)');
        }

        let v = this.BASE_NUM,
            w = bigInt(steamid64),
            y = w.mod(2).toString();

        w = w.minus(y).minus(v);

        if (w < 1) {
            return false;
        }
        return 'STEAM_0:' + y + ':' + w.divide(2).toString();
    }

    /**
     * Generate a SteamID3 from a SteamID or SteamID64
     * @param {string} steamid 
     * @returns 
     */
    async toSteamID3(steamid) {
        if (!steamid || typeof steamid !== 'string') {
            return false;
        }
        else if (!this.isSteamID(steamid)) {
            steamid = await this.toSteamID(steamid);
        }

        let split = steamid.split(":");

        return '[U:1:' + (parseInt(split[1]) + parseInt(split[2]) * 2) + ']';
    }

    /**
     * Generate a SteamID from a SteamID3.
     * @param {string} steamid3 
     * @returns 
     */
    async fromSteamID3(steamid3) {
        let split = steamid3.split(':');
        let last = split[2].substring(0, split[2].length - 1);

        return 'STEAM_0:' + (last % 2) + ':' + Math.floor(last / 2);
    }


    /**
     * Check if the SteamID format is correct
     * @param {string} id SteamID
     * @returns {boolean} true if given string is SteamID else false 
     */
    isSteamID(id) {
        if (!id || typeof id !== 'string') {
            return false;
        }
        return this.REGEX_STEAMID.test(id);
    }

    /**
     * Check if the SteamID format is correct
     * @param {string} id SteamID
     * @returns {boolean} true if given string is SteamID64 else false 
     */
    isSteamID64(id) {
        if (!id || typeof id !== 'string') {
            return false;
        }
        return this.REGEX_STEAMID64.test(id);
    }

    /**
     * Check if the SteamID format is correct
     * @param {string} id SteamID
     * @returns {boolean} true if given string is SteamID3 else false 
     */
    isSteamID3(id) {
        if (!id || typeof id !== 'string') {
            return false;
        }
        return this.REGEX_STEAMID3.test(id);
    }

    /**
     * Generate steam community profile url
     * @param {string} steamid64 SteamID
     * @returns {string} Steam community profile url
     */
    async profileURL(steamid64) {
        if (!this.isSteamID64(steamid64)) {
            steamid64 = await this.toSteamID64(steamid64);
        }
        return 'http://steamcommunity.com/profiles/' + steamid64;
    }
}

module.exports = SteamIDConverter