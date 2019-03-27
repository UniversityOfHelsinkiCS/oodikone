const express = require('express')

const app = express()
const port = 4568
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong '}))

let fetching = false
let data = null
app.get('/data', (req, res) => {
  if (fetching) {
    return res.json(data)
  }
  if (!data) {
    data = { data: "datahere" } // recalculate?
  }
  return res.json(data)
})

app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
