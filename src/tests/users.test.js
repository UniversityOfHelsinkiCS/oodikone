const { sequelize, forceSyncDatabase } = require('../database/connection')
const { User, ElementDetails, AccessGroup } = require('../models/index')
const userService = require('../services/users')
const AccessService = require('../services/accessgroups')
const { DB_URL } = require('../conf')

const langify = name => ({
  en: `${name}_en`,
  fi: `${name}_fi`,
  sv: `${name}_sv`
})

const default_users = [
  {
    id: 69,
    full_name: 'Saus Maekinen',
    is_enabled: true,
    username: 'sasumaki',
    email: 'vittuilu.email@gmail.com',
    language: 'finnish',
  },
  {
    id: 42,
    full_name: 'Pekka Pouta',
    is_enabled: false,
    username: 'poutaukko',
    email: 'pekka.pouta@ilmatieteenlaitos.fi',
    language: 'finnish',
    admin: false,
    czar: false
  },
  {
    id: 666,
    full_name: 'Sylvester Stallone',
    is_enabled: false,
    username: 'rambo666',
    email: 'sylvester@rambo.com',
    language: 'americano',
    admin: false,
    czar: true
  },
  {
    id: 665,
    full_name: 'Morgan Freeman',
    is_enabled: true,
    username: 'freeman',
    email: 'morgan@freeman.com',
    language: 'americano',
    admin: false,
    czar: false
  }
]

const default_elementdetails = [
  {
    code: 'Element_BSC',
    type: 10,
    name: langify('Bachelor of Science')
  },
  {
    code: 'Element_MATH',
    type: 20,
    name: langify('Mathematics')
  },
  {
    code: 'ELEMENT_CS',
    type: 20,
    name: langify('Computer Science')
  }

]
const default_accessgroups = [
  {
    id: 1,
    group_code: 'teachers',
    group_info: 'liirum laarum'
  },
  {
    id: 2,
    group_code: 'admin',
    group_info: 'big boss'
  }
]

beforeAll(async () => {
  await forceSyncDatabase()
  await User.bulkCreate(default_users)
  await ElementDetails.bulkCreate(default_elementdetails)
  await AccessGroup.bulkCreate(default_accessgroups)
  const admin_user = await User.findOne({ where: { id: 69 }})
  const admin = await AccessService.byId(2)
  await admin_user.addAccessgroup(admin)
  const normal_user = await User.findOne({ where: { id: 665 }})
  const CS_ED = await ElementDetails.findOne({ where: { code: 'ELEMENT_CS' }})
  await normal_user.addElementdetail(CS_ED)
})
afterAll(async () => {
  await sequelize.close()
})

describe('basic tests', async () => {
  test('tests start', async () => {
    console.log('mayhem begins')
    expect(process.env.NODE_ENV).toBe('test')
  })

  test('database is connected', async () => {
    expect(DB_URL).toBe(process.env.TEST_DB)
    try {
      await sequelize.authenticate()
    } catch (e) {
      console.log(e)
      expect(1).toBe(0)
    }
    expect(1).toBe(1)
  })
})
describe('user tests', async () => {
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
    const { token, isNew } = await userService.login('poutaukko', 'Pekka Pouta', [], [], 'pekka.pouta@ilmatieteenlaitos.fi')
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
    const token  = await userService.superlogin('rambo666', 'sasumaki')
    expect(token).toBe(undefined)
  })
  test('superlogin succeeds if admin', async () => {
    const token = await userService.superlogin('sasumaki', 'rambo666')
    expect(token).toBeTruthy()
  })
})

describe('user access right tests', async () => {
    test('adding and getting access rights works', async () => {
      const rights1 = await userService.getUserElementDetails('sasumaki')
      expect(rights1.length).toBe(0)

      await userService.enableElementDetails(69, ['Element_MATH'])
      const rights2 = await userService.getUserElementDetails('sasumaki')
      expect(rights2[0].type).toBe(20)
    })
    test('removing and getting access rights works', async () => {
      const rights1 = await userService.getUserElementDetails('freeman')
      expect(rights1.length).toBe(1)

      await userService.removeElementDetails(665, ['ELEMENT_CS'])
      const rights2 = await userService.getUserElementDetails('freeman')
      console.log(rights2)
      expect(rights2.length).toBe(0)
    })
    test('enabling user works', async () => {
      const user1 = await userService.byUsername('rambo666')
      expect(user1.is_enabled).toBe(false)
      await userService.updateUser(user1, { is_enabled: true })
      const user2 = await userService.byUsername('rambo666')
      expect(user2.is_enabled).toBe(true)
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
