const express = require('express')

const User = require('./src/services/users')

const app = express()
const port = 4567
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.get('/user/:uid', async (req, res) => {
  const uid = req.params.uid
  const user = await User.byUsername(uid)

  console.log(JSON.stringify(user))

  res.json(user)
})

app.post('/user', async (req, res) => {
  console.log('POST') 
  const { username, full_name, email } = req.body
  console.log(username, full_name, email) 

  const user = await User.createUser(username, full_name, email)

  res.json(user)
})

app.put('/user/:uid', async (req, res) => {
  const uid = req.params.uid
  const user = await User.byUsername(uid)
  const { full_name } = req.body
  User.updateUser(user, { full_name } )
  res.json(user)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))