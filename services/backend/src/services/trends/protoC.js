const _ = require('lodash')
const { getRedisCDS, saveToRedis, getTargetStudentCounts } = require('./shared')
const { getAssociations } = require('../studyrights')

const REDIS_KEY_PROTOC = 'PROTOC_DATA_V3.3'
const REDIS_KEY_PROTOC_PROGRAMME = 'PROTOC_PROGRAMME_DATA_V2'

const tryParseInt = (number, defaultValue) => {
  try {
    return parseInt(number, 10)
  } catch (e) {
    return defaultValue
  }
}

const calculateProtoC = async query => {
  const associations = await getAssociations()

  const startYear = tryParseInt(query.startYear, null)
  const endYear = tryParseInt(query.endYear, null)

  const data = await getTargetStudentCounts({
    includeOldAttainments: query.include_old_attainments === 'true',
    excludeNonEnrolled: query.exclude_non_enrolled === 'true',
    startYear,
    endYear,
  })

  const programmeData = data.filter(d => d.programmeType !== 30)
  const studytrackData = data.filter(d => d.programmeType !== 20)

  // mankel through studytracks
  const studytrackMankelid = _(studytrackData)
    // seems to return the numerical columns as strings, parse them first
    .map(programmeRow => ({
      ...programmeRow,
      programmeTotalStudents: parseInt(programmeRow.programmeTotalStudents, 10),
      students3y: parseInt(programmeRow.students3y, 10),
      // 4y group includes 3y group, make 4y count exclusive:
      students4y: parseInt(programmeRow.students4y, 10) - parseInt(programmeRow.students3y, 10),
      currentlyCancelled: parseInt(programmeRow.currentlyCancelled, 10),
    }))
    .value()

  // associate studytracks with bachelor programme
  const studytrackToBachelorProgrammes = Object.keys(associations.programmes).reduce((acc, curr) => {
    if (!curr.includes('KH')) return acc
    const studytracksForProgramme = studytrackMankelid.reduce((acc2, studytrackdata) => {
      if (associations.programmes[curr].studytracks.includes(studytrackdata.programmeCode)) {
        acc2.push({
          code: studytrackdata.programmeCode,
          name: studytrackdata.programmeName,
          totalStudents: studytrackdata.programmeTotalStudents,
          students3y: studytrackdata.students3y,
          students4y: studytrackdata.students4y,
          currentlyCancelled: studytrackdata.currentlyCancelled,
        })
      }
      return acc2
    }, [])
    if (studytracksForProgramme) acc[curr] = studytracksForProgramme
    return acc
  }, {})

  // combine studytracks data to programme data
  const newmankelid = _(programmeData)
    // seems to return the numerical columns as strings, parse them first
    .map(programmeRow => ({
      ...programmeRow,
      programmeTotalStudents: parseInt(programmeRow.programmeTotalStudents, 10),
      students3y: parseInt(programmeRow.students3y, 10),
      // 4y group includes 3y group, make 4y count exclusive:
      students4y: parseInt(programmeRow.students4y, 10) - parseInt(programmeRow.students3y, 10),
      currentlyCancelled: parseInt(programmeRow.currentlyCancelled, 10),
    }))
    .groupBy(r => r.orgCode)
    .mapValues(rows => ({
      // all of these rows have the same orgCode and orgName, just pick it from the first
      code: rows[0].orgCode,
      name: rows[0].orgName,
      totalStudents: _.sumBy(rows, row => row.programmeTotalStudents),
      students3y: _.sumBy(rows, row => row.students3y),
      students4y: _.sumBy(rows, row => row.students4y),
      currentlyCancelled: _.sumBy(rows, row => row.currentlyCancelled),
      programmes: rows.map(
        ({
          programmeCode: code,
          programmeName: name,
          programmeTotalStudents: totalStudents,
          students3y,
          students4y,
          currentlyCancelled,
        }) => ({
          code,
          name,
          totalStudents,
          students3y,
          students4y,
          currentlyCancelled,
          studytracks: studytrackToBachelorProgrammes[code],
        })
      ),
    }))
    .value()
  return newmankelid
}

const calculateProtoCProgramme = async query => {
  const associations = await getAssociations()
  const codes = associations.programmes[query.code]
    ? [...associations.programmes[query.code].studytracks, query.code]
    : []

  const startYear = tryParseInt(query.startYear, null)
  const endYear = tryParseInt(query.endYear, null)

  const data = await getTargetStudentCounts({
    codes,
    includeOldAttainments: query.include_old_attainments === 'true',
    excludeNonEnrolled: query.exclude_non_enrolled === 'true',
    startYear,
    endYear,
  })

  const programmeData = data.find(d => d.programmeType === 20)
  const studytrackData = data.filter(d => d.programmeType !== 20)

  if (!programmeData) return {}

  // mankel through studytracks if studyrightdata available
  const studytrackMankelid = _(studytrackData)
    // seems to return the numerical columns as strings, parse them first
    .map(programmeRow => ({
      ...programmeRow,
      programmeTotalStudents: parseInt(programmeRow.programmeTotalStudents, 10),
      students3y: parseInt(programmeRow.students3y, 10),
      // 4y group includes 3y group, make 4y count exclusive:
      students4y: parseInt(programmeRow.students4y, 10) - parseInt(programmeRow.students3y, 10),
      currentlyCancelled: parseInt(programmeRow.currentlyCancelled, 10),
    }))
    .value()

  // associate studytracks with bachelor programme
  const studytrackToBachelorProgrammes = Object.keys(associations.programmes).reduce((acc, curr) => {
    if (!curr.includes('KH')) return acc
    const studytracksForProgramme = studytrackMankelid.reduce((acc2, studytrackdata) => {
      if (studytrackdata && associations.programmes[curr].studytracks.includes(studytrackdata.programmeCode)) {
        acc2.push({
          code: studytrackdata.programmeCode,
          name: studytrackdata.programmeName,
          totalStudents: studytrackdata.programmeTotalStudents,
          students3y: studytrackdata.students3y,
          students4y: studytrackdata.students4y,
          currentlyCancelled: studytrackdata.currentlyCancelled,
        })
      }
      return acc2
    }, [])
    if (studytracksForProgramme) acc[curr] = studytracksForProgramme
    return acc
  }, {})

  // combine studytracks data to programme data

  const programmeDataMankeld = {
    code: programmeData.programmeCode,
    name: programmeData.programmeName,
    totalStudents: parseInt(programmeData.programmeTotalStudents, 10),
    students3y: parseInt(programmeData.students3y, 10),
    // 4y group includes 3y group, make 4y count exclusive:
    students4y: parseInt(programmeData.students4y, 10) - parseInt(programmeData.students3y, 10),
    currentlyCancelled: parseInt(programmeData.currentlyCancelled, 10),
    studytracks: studytrackToBachelorProgrammes[programmeData.programmeCode],
  }
  return programmeDataMankeld
}

const getProtoC = async (query, doRefresh = false) => {
  const { include_old_attainments, exclude_non_enrolled, startYear, endYear } = query

  // redis keys for different queries
  const KEY = `${REDIS_KEY_PROTOC}_OLD_${include_old_attainments.toUpperCase()}_ENR_${exclude_non_enrolled.toUpperCase()}_FROM_${startYear}_TO_${endYear}`
  const protoC = await getRedisCDS(KEY)
  if (!protoC || doRefresh) {
    const data = await calculateProtoC(query)
    await saveToRedis(data, KEY)
    return data
  }
  return protoC
}

// used for studytrack view
const getProtoCProgramme = async (query, doRefresh = false) => {
  const { include_old_attainments, exclude_non_enrolled, code, startYear, endYear } = query
  const KEY = `${REDIS_KEY_PROTOC_PROGRAMME}_CODE_${code}_OLD_${include_old_attainments.toUpperCase()}_ENR_${exclude_non_enrolled.toUpperCase()}_FROM_${startYear}_TO_${endYear}`
  const protoCProgramme = await getRedisCDS(KEY)

  if (!protoCProgramme || doRefresh) {
    const data = await calculateProtoCProgramme(query)
    await saveToRedis(data, KEY)
    return data
  }
  return protoCProgramme
}

module.exports = {
  getProtoC,
  getProtoCProgramme,
}
