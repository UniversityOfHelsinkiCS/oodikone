const express = require('express')
const app = express()
const port = process.env.PORT
const bodyParser = require('body-parser')
const { scheduleStudentsByArray } = require('./schedule_students')
app.use(bodyParser.json())


app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.post('/update', async (req, res) => {
  const msg = await scheduleStudentsByArray(req.body)
  res.json({ message: msg })
})
app.listen(port, () => console.log(`listening on port ${port}!`))
module.exports = { app }