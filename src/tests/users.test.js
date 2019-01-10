const { sequelize, forceSyncDatabase } = require('../database/connection')
const { User, ElementDetails } = require('../models/index')
const userService = require('../services/users')
const elementService = require('../services/studyelements')
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
    admin: true,
    czar: true
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
  
beforeAll(async () => {
  await forceSyncDatabase()
  await User.bulkCreate(default_users)
  await ElementDetails.bulkCreate(default_elementdetails)
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
    const { token, isNew } = await userService.login('poutaukko', 'Pekka Pouta', 'pekka.pouta@ilmatieteenlaitos.fi')
    expect(token).toBeTruthy()
    expect(isNew).toBe(false)
  })
  
  test('login creates user if user does not exist', async () => {
    const { token, isNew } = await userService.login('rtz', 'Artour Babaev', 'rtz@eg.com')
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
    test('enabling user works', async () => {
      const user1 = await userService.byUsername('rambo666')
      expect(user1.is_enabled).toBe(false)
      await userService.updateUser(user1, { is_enabled: true })
      const user2 = await userService.byUsername('rambo666')
      expect(user2.is_enabled).toBe(true)
    })
})
