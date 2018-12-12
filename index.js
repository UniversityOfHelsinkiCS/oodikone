const express = require('express')
const app = express()
const port = 3000

app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))