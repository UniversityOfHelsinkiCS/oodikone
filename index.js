const express = require('express')

const app = express()
const port = 4568
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong'}))

let data = {} // TODO: implement DB instead once we know the needed DB structure

app.get('/data/:id', (req, res) => {
  const { id } = req.params
  res.json({ [id]: data[id] })
})
app.post('/data', (req, res) => {
  data = { ...data, ...req.body.data }
  res.status(200).end()
})

app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
