const {
  studytrackToProviderCode,
  getCreditsForProvider,
  isThesis,
  productivityStatsFromCredits,
  productivityStatsForProvider
} = require('./studytrack')
const { sequelize } = require('../models')
const { readFileSync } = require('fs')

const provider = '500-M010'

beforeAll(async () => {
  const query = readFileSync('./src/services/studytrack.test.sql', 'utf8')
  await sequelize.query(query)
})

test('Credits for provider should contain passed course credit', async () => {
  const credits = await getCreditsForProvider(provider)
  const credit = await credits.find(cr => cr.id === 'CREDIT_01')
  expect(credit).toMatchObject({ id: 'CREDIT_01' })
})

test('Credits for provider should return object in correct format', async () => {
  const credits = await getCreditsForProvider(provider)
  const credit = await credits.find(cr => cr.id === 'CREDIT_01')
  expect(credit).toMatchObject({
    credits: 5,
    course: 'COURSE_EN',
    year: 2016,
    id: 'CREDIT_01',
    thesis: false
  })
})

test('Credits for provider should not contain passed credits from other providers', async () => {
  const credits = await getCreditsForProvider(provider)
  const credit = await credits.find(cr => cr.id === 'CREDIT_04')
  expect(credit).toBeFalsy()
})

test('Credits for provider should not contain credit with failed credit typecode 10', async () => {
  const credits = await getCreditsForProvider(provider)
  const credit = await credits.find(cr => cr.id === 'CREDIT_02')
  expect(credit).toBeFalsy()
})

test('Credits for provider should not contain credit for passed study module', async () => {
  const credits = await getCreditsForProvider(provider)
  const credit = await credits.find(cr => cr.id === 'CREDIT_03')
  expect(credit).toBeFalsy()
})

test('KH50_005 track code maps to 500-K005 provider code', () => {
  const track = 'KH50_005'
  const provider = studytrackToProviderCode(track)
  expect(provider).toBe('500-K005')
})

test('MH50_010 track code maps to 500-M010 provider code', () => {
  const track = 'MH50_010'
  const provider = studytrackToProviderCode(track)
  expect(provider).toBe('500-M010')
})

test('isThesis returns true and false correctly', () => {
  expect(isThesis('Bachelors thesis', 30)).toBe(true)
  expect(isThesis('bachelors thesis', 30)).toBe(true)
  expect(isThesis('bachelors thesis seminar', 6)).toBe(false)
  expect(isThesis('Masters Thesis', 30)).toBe(true)
})

test('productivityStatsFromCredits calculates stats correctly', () => {
  const credits = [
    { year: 2016, credits: 5, thesis: false },
    { year: 2016, credits: 5, thesis: false },
    { year: 2016, credits: 5, thesis: true },
    { year: 2015, credits: 5, thesis: true },
    { year: 2015, credits: 5, thesis: true },
    { year: 2015, credits: 10, thesis: false },
  ]
  const stats = productivityStatsFromCredits(credits)
  expect(stats.length).toBe(2)
  expect(stats).toContainEqual({ year: 2016, credits: 15, thesis: 1 })
  expect(stats).toContainEqual({ year: 2015, credits: 20, thesis: 2 })
})

test('productivityStats integrates correctly', async () => {
  const stats = await productivityStatsForProvider(provider)
  expect(stats.length).toBe(2)
  expect(stats).toContainEqual({ year: 2015, thesis: 1, credits: 40 })
  expect(stats).toContainEqual({ year: 2016, thesis: 0, credits: 5 })
})