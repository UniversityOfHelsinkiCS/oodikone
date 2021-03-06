const { sequelize, forceSyncDatabase } = require('../database/connection')
const { User, AccessGroup, HyGroup, UserElementDetails } = require('../models/index')
const userService = require('./users')
const AccessService = require('./accessgroups')

const default_users = [
  {
    id: 69,
    full_name: 'Saus Maekinen',
    username: 'sasumaki',
    email: 'vittuilu.email@gmail.com',
    language: 'finnish',
  },
  {
    id: 42,
    full_name: 'Pekka Pouta',
    username: 'poutaukko',
    email: 'pekka.pouta@ilmatieteenlaitos.fi',
    language: 'finnish',
  },
  {
    id: 666,
    full_name: 'Sylvester Stallone',
    username: 'rambo666',
    email: 'sylvester@rambo.com',
    language: 'americano',
  },
  {
    id: 665,
    full_name: 'Morgan Freeman',
    username: 'freeman',
    email: 'morgan@freeman.com',
    language: 'americano',
  },
]

const default_accessgroups = [
  {
    id: 1,
    group_code: 'teachers',
    group_info: 'liirum laarum',
  },
  {
    id: 2,
    group_code: 'admin',
    group_info: 'big boss',
  },
]
const default_hygroups = [
  {
    id: 1,
    code: 'test-group',
  },
]

beforeAll(async () => {
  await forceSyncDatabase()
  await User.bulkCreate(default_users)
  await AccessGroup.bulkCreate(default_accessgroups)
  await HyGroup.bulkCreate(default_hygroups)
  const admin_user = await User.findOne({ where: { id: 69 } })
  const admin = await AccessService.byId(2)
  await admin_user.addAccessgroup(admin)
  const hygroup = await HyGroup.findByPk(1)
  await admin_user.addHy_group(hygroup)
  const normal_user = await User.findOne({ where: { id: 665 } })
  await UserElementDetails.upsert({
    userId: normal_user.id,
    elementDetailCode: 'ELEMENT_CS',
  })
  await normal_user.addHy_group(hygroup)
})
afterAll(async () => {
  await forceSyncDatabase()
  await sequelize.close()
})

describe('basic tests', () => {
  test('tests start', async () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  test('database is connected', async () => {
    try {
      await sequelize.authenticate()
    } catch (e) {
      console.log(e)
      expect(1).toBe(0)
    }
    expect(1).toBe(1)
  })
})
describe('user tests', () => {
  test('finds all default users', async () => {
    const users = await userService.findAll()
    expect(users.length).toBe(default_users.length)
  })

  test('finds specific user by id', async () => {
    const user = await userService.byId(69)
    expect(user.full_name).toBe('Saus Maekinen')
  })

  test('finds user by username', async () => {
    const user = await userService.byUsername('rambo666')
    expect(user.full_name).toBe('Sylvester Stallone')
  })

  test('login works if user already exists', async () => {
    const { token, isNew } = await userService.login(
      'poutaukko',
      'Pekka Pouta',
      [],
      [],
      'pekka.pouta@ilmatieteenlaitos.fi'
    )
    expect(token).toBeTruthy()
    expect(isNew).toBe(false)
  })

  test('login creates user if user does not exist', async () => {
    const { token, isNew } = await userService.login('rtz', 'Artour Babaev', [], [], 'rtz@eg.com')
    expect(token).toBeTruthy()
    expect(isNew).toBe(true)
    const users = await userService.findAll()
    expect(users.length).toBe(default_users.length + 1)
    const rtz = await userService.byUsername('rtz')
    expect(rtz.email).toBe('rtz@eg.com')
  })

  test('superlogin fails if not admin', async () => {
    const token = await userService.superlogin('rambo666', 'sasumaki')
    expect(token).toBe(undefined)
  })
  test('superlogin succeeds if admin', async () => {
    const token = await userService.superlogin('sasumaki', 'rambo666')
    expect(token).toBeTruthy()
  })
})

describe('user access right tests', () => {
  test('adding and getting access rights works', async () => {
    const user1 = await userService.byUsername('sasumaki')
    const rights1 = userService.getUserProgrammes(user1)
    expect(rights1.length).toBe(0)

    await userService.addProgrammes(69, ['Element_MATH'])
    const user2 = await userService.byUsername('sasumaki')
    const rights2 = userService.getUserProgrammes(user2)
    expect(rights2[0]).toBe('Element_MATH')
  })
  test('removing and getting access rights works', async () => {
    const user1 = await userService.byUsername('freeman')
    const rights1 = userService.getUserProgrammes(user1)
    expect(rights1.length).toBe(1)

    await userService.removeProgrammes(665, ['ELEMENT_CS'])
    const user2 = await userService.byUsername('freeman')
    const rights2 = userService.getUserProgrammes(user2)
    expect(rights2.length).toBe(0)
  })
  test('Access groups can be added and removed', async () => {
    const id = 666
    const user1 = await userService.byId(id)
    expect(user1.accessgroup.length).toBe(0)

    await userService.modifyRights(id, { teachers: true, admin: true })
    const user2 = await userService.byId(id)
    expect(user2.accessgroup.length).toBe(2)
    const ags = user2.accessgroup.map(ag => ag.group_code)
    expect(ags).toContain('teachers')
    expect(ags).toContain('admin')

    await userService.modifyRights(user1.id, { admin: false })
    const user3 = await userService.byId(id)
    expect(user3.accessgroup.length).toBe(1)
    const ags2 = user3.accessgroup.map(ag => ag.group_code)
    expect(ags2).toContain('teachers')
    expect(ags2).not.toContain('admin')
  })
  test('get accessgroups for user workerinos ', async () => {
    const id = 666
    const user = await userService.byId(id)
    await userService.modifyRights(id, { teachers: true, admin: true })
    const ags = await userService.getUserAccessGroups(user.username)
    expect(ags.length).toBe(2)
  })
})
