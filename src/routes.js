const express = require('express')
const Steam = require('./utils/steam')

const router = express.Router()
const steam = new Steam()

/**
 * SteamAPI routes
 */

router.get('/user/:steamID64', async (req, res) => {
    let userSummary = await steam.getUserSummary(req.params.steamID64)
    
    res.status(userSummary.status_code ? userSummary.status_code : 200)
    res.json(userSummary);
})

router.get('/user/friends/:steamID64', async (req, res) => {
    let userFriends = await steam.getUserFriendList(req.params.steamID64)
    
    res.status(userFriends.status_code ? userFriends.status_code : 200)
    res.json(userFriends);
})

router.get('/user/games/:steamID64', async (req, res) => {
    let userGames = await steam.getUserOwnedGames(req.params.steamID64)
    
    res.status(userGames.status_code ? userGames.status_code : 200)
    res.json(userGames);
})

router.get('/user/gamesplayed/:steamID64', async (req, res) => {
    let userRecentPlayedGames = await steam.getUserRecentPlayedGames(req.params.steamID64)
    
    res.status(userRecentPlayedGames.status_code ? userRecentPlayedGames.status_code : 200)
    res.json(userRecentPlayedGames);
})

/**
 * SteamID Converter Routes
 */

router.get('/steamid/:steamid', async (req, res) => {
    let steamIDs = await Promise.all(req.params.steamid.split(',').map((id) => steam.convertSteamID(id)))
    
    res.status(steamIDs.status_code ? steamIDs.status_code : 200)
    res.json(steamIDs)
})

module.exports = router