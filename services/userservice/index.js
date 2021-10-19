const express = require('express')
const Sentry = require('@sentry/node')

const User = require('./src/services/users')
const AccessGroup = require('./src/services/accessgroups')
const { initializeDatabaseConnection } = require('./src/database/connection')
const initializeSentry = require('./src/util/sentry')

initializeDatabaseConnection()
  .then(() => {
    const app = express()
    initializeSentry(app)
    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())
    const port = 4567
    const checkSecret = require('./src/middlewares/secret')

    app.use(express.json())
    app.use(checkSecret)

    app.get('/ping', (req, res) => res.json({ message: 'pong ' }))

    app.get('/findall', async (req, res) => {
      const users = await User.findAll()
      res.json(users.map(User.getUserData))
    })

    app.get('/user/:uid/user_data', async (req, res) => {
      const uid = req.params.uid
      const user = await User.byUsernameMinified(uid)
      const roles = user.accessgroup.map(({ group_code }) => group_code)
      const rights = User.getUserProgrammes(user)
      const faculties = user.faculty.map(({ faculty_code }) => faculty_code)

      res.json({
        email: user.email,
        full_name: user.full_name,
        roles,
        rights,
        faculties,
      })
    })

    app.get('/user/id/:id', async (req, res) => {
      const id = req.params.id
      const user = await User.byId(id)

      console.log(JSON.stringify(user))

      res.json(User.getUserData(user))
    })

    app.post('/login', async (req, res) => {
      const { uid, full_name, hyGroups, affiliations, email, hyPersonSisuId, hasStudyGuidanceGroupAccess } = req.body
      console.log(uid, full_name, 'logging in!')
      const { token, isNew } = await User.login(
        uid,
        full_name,
        hyGroups,
        affiliations,
        email,
        hyPersonSisuId,
        hasStudyGuidanceGroupAccess
      )
      res.status(200).json({ token, isNew })
    })

    app.post('/superlogin', async (req, res) => {
      const { uid, asUser } = req.body
      console.log(`${uid} superlogging as ${asUser}`)
      const token = await User.superlogin(uid, asUser)
      if (token) {
        res.status(200).json(token)
      }
      res.status(400).end()
    })

    app.put('/user/:uid', async (req, res) => {
      const uid = req.params.uid
      const user = await User.byUsername(uid)
      if (!user) {
        return res.status(400).json({ error: 'invalid username given' })
      }
      await User.updateUser(user, req.body)
      const returnedUser = await User.byUsername(uid)
      res.json(User.getUserData(returnedUser))
    })

    app.post('/modifyaccess', async (req, res) => {
      const { username, accessgroups } = req.body
      try {
        await User.modifyRights(username, accessgroups)
        const user = await User.byUsername(username)
        res.status(200).json(User.getUserData(user))
      } catch (e) {
        res.status(400).json({ e })
      }
    })
    app.post('/add_rights', async (req, res) => {
      const { uid, codes } = req.body
      console.log('adding rights to ', uid)
      try {
        await User.addProgrammes(uid, codes)
        const user = await User.byId(uid)
        res.status(200).json({ user: User.getUserData(user) })
      } catch (e) {
        console.log(e)
        res.status(400).json({ e })
      }
    })
    app.post('/remove_rights', async (req, res) => {
      const { uid, codes } = req.body
      console.log('removing rights from ', uid)
      try {
        await User.removeProgrammes(uid, codes)
        const user = await User.byId(uid)
        res.status(200).json({ user: User.getUserData(user) })
      } catch (e) {
        console.log(e)
        res.status(400).json({ e })
      }
    })
    app.post('/set_faculties', async (req, res) => {
      const { uid, faculties } = req.body
      try {
        await User.setFaculties(uid, faculties)
        const user = await User.byId(uid)
        res.status(200).json({ user: User.getUserData(user) })
      } catch (e) {
        console.log(e)
        res.status(400).json({ e })
      }
    })
    app.get('/access_groups', async (req, res) => {
      try {
        const groups = await AccessGroup.findAll()
        res.status(200).json(groups)
      } catch (e) {
        res.status(400).end()
      }
    })

    app.get('/get_roles/:user', async (req, res) => {
      const user = req.params.user
      try {
        const roles = await User.getRoles(user)
        res.status(200).json(roles)
      } catch (e) {
        res.status(400).json({ e })
      }
    })

    const server = app.listen(port, () => console.log(`Userservice listening on port ${port}!`))
    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Process terminated')
      })
    })
  })
  .catch(e => {
    process.exitCode = 1
    console.log(e)
  })
