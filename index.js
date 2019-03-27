const express = require('express')

const app = express()
const port = 4568
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong'}))

let productivity = {} // TODO: implement DB instead once we know the needed DB structure

app.get('/productivity/:id', (req, res) => {
  const { id } = req.params
  res.json({ [id]: productivity[id] })
})
app.post('/productivity', (req, res) => {
  productivity = { ...productivity, ...req.body.data }
  res.status(200).end()
})

let throughput = {} // TODO: implement DB instead once we know the needed DB structure

app.get('/throughput/:id', (req, res) => {
  const { id } = req.params
  res.json({ [id]: throughput[id] })
})
app.post('/throughput', (req, res) => {
  throughput = { ...throughput, ...req.body.data }
  res.status(200).end()
})

app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
