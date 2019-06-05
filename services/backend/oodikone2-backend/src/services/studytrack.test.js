const {
  studytrackToProviderCode,
  getCreditsForProvider,
  productivityStatsFromCredits,
  productivityStatsForProvider,
  findGraduated,
  graduatedStatsFromStudyrights,
  combineStatistics,
  productivityStatsForStudytrack,
  findProgrammeThesisCredits,
  thesisProductivityFromCredits,
  thesisProductivityForStudytrack
} = require('./studytrack')
const { sequelize, ThesisTypeEnums } = require('../models')
const { readFileSync } = require('fs')

const { MASTER, BACHELOR } = ThesisTypeEnums

const provider = '500-M010'
const studytrack = 'MH50_010'

beforeAll(async () => {
  const query = readFileSync('./src/services/studytrack.test.sql', 'utf8')
  await sequelize.query(query)
})

test('Credits for provider should contain passed course credit', async () => {
  const credits = await getCreditsForProvider(provider, '2001-01-01')
  const credit = await credits.find(cr => cr.id === 'CREDIT_01')
  expect(credit).toMatchObject({ id: 'CREDIT_01' })
})

test('Credits for provider should return object in correct format', async () => {
  const credits = await getCreditsForProvider(provider, '2001-01-01')
  const credit = await credits.find(cr => cr.id === 'CREDIT_01')
  expect(credit).toMatchObject({
    credits: 5,
    year: 2016,
    id: 'CREDIT_01'
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

test('productivityStatsFromCredits calculates stats correctly', () => {
  const credits = [
    { year: 2016, credits: 5 },
    { year: 2016, credits: 5 },
    { year: 2016, credits: 5 },
    { year: 2015, credits: 5 },
    { year: 2015, credits: 5 },
    { year: 2015, credits: 10 }
  ]
  const stats = productivityStatsFromCredits(credits)
  expect(stats).toMatchObject({
    2016: { year: 2016, credits: 15 },
    2015: { year: 2015, credits: 20 }
  })
})

test('productivityStats integrates correctly', async () => {
  const stats = await productivityStatsForProvider(provider, '2001-01-01')
  expect(stats).toMatchObject({
    2015: { year: 2015, credits: 40 },
    2016: { year: 2016, credits: 5 }
  })
})

test('findGraduated finds graduated studyright', async () => {
  const studyrights = await findGraduated(studytrack, '2001-01-01')
  const match = studyrights.find(sr => sr.studyrightid === '10')
  expect(match).toBeTruthy()
})

test('findGraduated formats graduated studyrights correctly', async () => {
  const studyrights = await findGraduated(studytrack, '2001-01-01')
  expect(studyrights).toContainEqual({ studyrightid: '10', year: 2016, timeToGraduation: NaN })
})

test('findGraduated does not return studyrights that are not graduated', async () => {
  const studyrights = await findGraduated(studytrack, '2001-01-01')
  const match = studyrights.find(sr => sr.id === '11')
  expect(match).toBeFalsy()
})

test('findGraduated does return graduated studyrights from other studytracks', async () => {
  const studyrights = await findGraduated(studytrack, '2001-01-01')
  const match = studyrights.find(sr => sr.id === '12')
  expect(match).toBeFalsy()
})

test('graduatedStatsFromStudyrights calculates stats correctly', () => {
  const studyrights = [
    { year: 2015 },
    { year: 2015 },
    { year: 2014 }
  ]
  const stats = graduatedStatsFromStudyrights(studyrights)
  expect(stats).toMatchObject({
    2015: { graduated: 2. },
    2014: { graduated: 1. }
  })
})

test('combineStatistics returns correctly formatted array', () => {
  const creditStats = {
    2015: { year: 2015, credits: 40 },
    2016: { year: 2016, credits: 5 },
    2014: { year: 2014, credits: 20 }
  }
  const studyrightStats = {
    2015: { graduated: 2 },
    2016: { graduated: 1 }
  }
  const thesisStats = {
    2014: { mThesis: 1 },
    2015: { mThesis: 2, bThesis: 1 }
  }
  const creditsForMajors = {
    2014: 10,
    2015: 22
  }
  const transferredCredits = {
    2014: 2,
    2015: 4
  }

  const stats = combineStatistics(creditStats, studyrightStats, thesisStats, creditsForMajors, transferredCredits)
  expect(stats).toContainEqual({
    year: 2015,
    mThesis: 2,
    bThesis: 1,
    credits: 40,
    graduated: 2,
    creditsForMajors: 22,
    transferredCredits: 4
  })
  expect(stats).toContainEqual({
    year: 2014,
    mThesis: 1,
    bThesis: 0,
    credits: 20,
    graduated: 0,
    creditsForMajors: 10,
    transferredCredits: 2
  })
  expect(stats).toContainEqual({
    year: 2016,
    mThesis: 0,
    bThesis: 0,
    credits: 5,
    graduated: 1,
    creditsForMajors: 0,
    transferredCredits: 0
  })
})

test('productivityStatsForStudytrack integrates', async () => {
  const stats = await productivityStatsForStudytrack(studytrack, '2001-01-01')
  expect(stats.data).toContainEqual({
    year: 2015,
    graduated: 0,
    bThesis: 0,
    mThesis: 1,
    credits: 40,
    creditsForMajors: 0,
    transferredCredits: 0
  })
  expect(stats.data).toContainEqual({
    year: 2016,
    graduated: 1,
    mThesis: 0,
    bThesis: 0,
    credits: 5,
    creditsForMajors: 0,
    transferredCredits: 0
  })
})

test('findProgrammeThesisCredits returns correct credit', async () => {
  const credits = await findProgrammeThesisCredits(studytrack)
  expect(credits).toBeTruthy()
  expect(credits.length).toBe(1)
  expect(credits.find(c => c.id === 'CREDIT_07')).toBeTruthy()
})

test('findProgrammeThesisCredits format credit correctly', async () => {
  const credits = await findProgrammeThesisCredits(studytrack)
  expect(credits).toContainEqual({
    id: 'CREDIT_07',
    code: 'THESIS_01',
    type: MASTER,
    year: 2015
  })
})

test('thesisProductivityFromCredits', async () => {
  const credits = [
    { type: MASTER, year: 2015 },
    { type: MASTER, year: 2015 },
    { type: BACHELOR, year: 2015 },
    { type: BACHELOR, year: 2014 },
    { type: MASTER, year: 2013 }
  ]
  const stats = thesisProductivityFromCredits(credits)
  expect(stats).toHaveProperty('2015', '2014', '2013')
  expect(stats).toMatchObject({
    '2015': {
      mThesis: 2,
      bThesis: 1
    },
    '2014': {
      mThesis: 0,
      bThesis: 1
    },
    '2013': {
      mThesis: 1,
      bThesis: 0
    }
  })
})

test('thesisProductivityForStudytrack integrates', async () => {
  const stats = await thesisProductivityForStudytrack(studytrack)
  expect(stats).toMatchObject({
    2015: {
      mThesis: 1,
      bThesis: 0
    }
  })
})