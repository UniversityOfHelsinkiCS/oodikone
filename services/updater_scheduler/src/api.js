const express = require('express')
const app = express()
const port = process.env.PORT
const bodyParser = require('body-parser')

app.use(bodyParser.json())


app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.listen(port, () => console.log(`listening on port ${port}!`))
module.exports = { app }