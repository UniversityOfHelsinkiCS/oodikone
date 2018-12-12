const express = require('express')
const app = express()
const port = 4567

app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))