const axios = require('axios').default;
const SteamIDConverter = require('./steam-id-converter')
const steamLocations = require('../assets/steam_countries_data.json')
const RedisCache = require('./caching')

const STEAM_API_KEY = process.env.STEAM_API_KEY
const CACHE_EXPIRY_1HR = 3600

class Steam extends SteamIDConverter {
    constructor() {
        super()
        this.REGEX_STEAMID_STRUCTURE = /(^[0-9]{17}$|^STEAM_[0-5]:[01]:\d+$|^\[U:1:[0-9]+\]$)/
        this.cache = new RedisCache()
    }

    async getReadableLocation(countryCode, stateCode = '', cityID = '') {
        try {
            let country = "",
                state = "",
                city = ""

            if (!steamLocations || !steamLocations.hasOwnProperty('IN')) {
                return { status_code: 401, error_code: 'E000', error_message: 'Unknown error occurred' }
            }

            if (countryCode && steamLocations.hasOwnProperty(countryCode)) {
                country = steamLocations[countryCode]

                if (stateCode && country.states.hasOwnProperty(stateCode)) {
                    state = country.states[stateCode]

                    if (cityID && state.cities.hasOwnProperty(cityID)) {
                        city = state.cities[cityID]
                    }
                }

                return {
                    country: {
                        code: countryCode,
                        name: country.countryName ? country.countryName : "",
                    },
                    state: {
                        code: stateCode,
                        name: state.stateName ? state.stateName : "",
                    },
                    city: {
                        code: cityID,
                        name: city.cityName ? city.cityName : "",
                    },
                }
            }

            return { status_code: 404, error_code: 'E013', error_message: 'No match found for given location' }
        } catch (error) {
            console.log(error);
            return { status_code: 401, error_code: 'E011', error_message: 'Error retrieving location' }
        }
    }

    /**
     * 
     * @param {string} steamID64 
     * @returns 
     */
    async getUserSummary(steamID64) {
        try {

            if (!steamID64 || !steamID64.trim().length) {
                return { status_code: 401, error_code: 'E012', error_message: 'SteamID\'s are required.' }
            }

            let steamIDs = steamID64.split(',').filter(id => id && this.REGEX_STEAMID64.test(id)).map(id => this.cache.getSummaryCache(id.trim()))

            if (steamIDs.length > 100) {
                steamIDs = steamIDs.slice(0, 100)
            } else if (!steamIDs.length) {
                return { status_code: 401, error_code: 'E012', error_message: 'Given SteamID\'s doesn\'t match any format' }
            }

            let cachedResponses = await Promise.all(steamIDs)
            let idsToQuery = cachedResponses.filter(resp => !resp.isPresent).map(resp => resp.data)

            if (idsToQuery && !idsToQuery.length) {
                return { response: { players: cachedResponses.filter(resp => resp.isPresent).map(resp => resp.data) } }
            }


            let response = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamID64}&format=json`)
            let data = response.data

            if (typeof data === 'object' && data.response) {
                for (const player of data.response.players) {
                    if (player.loccountrycode) {
                        let loc = await this.getReadableLocation(player.loccountrycode, player.locstatecode, player.loccityid)
                        player.readablelocation = loc
                    }

                    await this.cache.setCache(`USRSM_${player.steamid}`, JSON.stringify(player), CACHE_EXPIRY_1HR)
                }

                if (cachedResponses && cachedResponses.length) {
                    data.response.players.concat(cachedResponses.filter(resp => resp.isPresent).map(resp => resp.data))
                }
            }

            return data
        } catch (error) {
            console.log(error);
            return { status_code: 401, error_code: 'E011', error_message: 'Error retrieving user\'s summary' }
        }
    }

    async getUserFriendList(steamID64) {
        try {
            let cachedResponse = await this.cache.getCache(`USRFL_${steamID64}`)

            if (cachedResponse) {
                return JSON.parse(cachedResponse)
            }

            let response = await axios.get(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${STEAM_API_KEY}&steamid=${steamID64}&relationship=friend&format=json`)
            await this.cache.setCache(`USRFL_${steamID64}`, JSON.stringify(response.data), CACHE_EXPIRY_1HR)

            return response.data
        } catch (error) {
            console.log(error);
            return { status_code: 401, error_code: 'E011', error_message: 'Error retrieving user\'s friend list' }
        }
    }

    async getUserOwnedGames(steamID64) {
        try {
            let cachedResponse = await this.cache.getCache(`USROG_${steamID64}`)

            if (cachedResponse) {
                return JSON.parse(cachedResponse)
            }

            let response = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamID64}&format=json`)
            await this.cache.setCache(`USROG_${steamID64}`, JSON.stringify(response.data), CACHE_EXPIRY_1HR)

            return response.data
        } catch (error) {
            console.log(error);
            return { status_code: 401, error_code: 'E011', error_message: 'Error retrieving user\'s owned games' }
        }
    }

    async getUserRecentPlayedGames(steamID64) {
        try {
            let cachedResponse = await this.cache.getCache(`USR_RPG_${steamID64}`)

            if (cachedResponse) {
                return JSON.parse(cachedResponse)
            }

            let response = await axios.get(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamID64}&format=json`)
            await this.cache.setCache(`USR_RPG_${steamID64}`, JSON.stringify(response.data), CACHE_EXPIRY_1HR)

            return response.data
        } catch (error) {
            console.log(error);
            return { status_code: 401, error_code: 'E011', error_message: 'Error retrieving user\'s recent played games' }
        }
    }

    async getUserSteamIDFromUrl(vanityUrlUsername) {
        try {
            let cachedResponse = await this.cache.getCache(vanityUrlUsername)

            if (cachedResponse) {
                return JSON.parse(cachedResponse)
            }

            let response = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityUrlUsername}`)

            if (response.data.response.success === 1) {
                await this.cache.setCache(vanityUrlUsername, JSON.stringify(response.data), CACHE_EXPIRY_1HR)
            }

            return response.data
        } catch (error) {
            console.log(error);
            return { status_code: 401, error_code: 'E011', error_message: 'Error retrieving user\'s steam id' }
        }
    }

    async convertSteamID(steamID) {

        const resp = (steamID64, steamID, steamID3) => {
            return {
                steamID64: steamID64,
                steamID: steamID,
                steamID3: steamID3
            }
        }

        try {
            if (steamID && !this.REGEX_STEAMID_STRUCTURE.test(steamID)) {
                let id = await this.getUserSteamIDFromUrl(steamID)

                if (id.response.success === 1) {
                    steamID = id.response.steamid
                } else {
                    return { status_code: 404, error_code: 'E013', error_message: 'No match found for given custom steam username' }
                }
            }

            if (this.isSteamID64(steamID)) {
                let cachedResponse = await this.cache.getCache(`CONVERT_${steamID}`)

                if (cachedResponse) {
                    return JSON.parse(cachedResponse)
                } else {
                    let r = resp(steamID, await this.toSteamID(steamID), await this.toSteamID3(steamID))
                    this.cache.setCache(`CONVERT_${steamID}`, JSON.stringify(r))

                    return r
                }
            } else if (this.isSteamID(steamID)) {
                let id64 = await this.toSteamID64(steamID)
                let cachedResponse = await this.cache.getCache(`CONVERT_${id64}`)

                if (cachedResponse) {
                    return JSON.parse(cachedResponse)
                } else {
                    let r = resp(id64, steamID, await this.toSteamID3(steamID))
                    this.cache.setCache(`CONVERT_${id64}`, JSON.stringify(r))

                    return r
                }
            } else if (this.isSteamID3(steamID)) {
                let id64 = await this.toSteamID64(steamID)
                let cachedResponse = await this.cache.getCache(`CONVERT_${id64}`)

                if (cachedResponse) {
                    return JSON.parse(cachedResponse)
                } else {
                    let r = resp(id64, await this.toSteamID(steamID), steamID)
                    this.cache.setCache(`CONVERT_${id64}`, JSON.stringify(r))

                    return r
                }
            } else {
                return { status_code: 401, error_code: 'E012', error_message: 'Given SteamID doesn\'t match any format' }
            }
        } catch (error) {
            console.log(error);
            return { status_code: 401, error_code: 'E000', error_message: 'Unknown error occurred' }
        }
    }
}

module.exports = Steam