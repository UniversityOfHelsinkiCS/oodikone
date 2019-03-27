const express = require('express')

const app = express()
const port = 4568
const bodyParser = require('body-parser')
const checkSecret = require('./src/middlewares/secret')

app.use(bodyParser.json())
app.use(checkSecret)

app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
