require('dotenv').config();

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const routes = require('./routes')

const app = express()

app.use(helmet())

app.use(bodyParser.json())

app.use(cors())

app.use(morgan('combined'))

app.use(routes)

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})