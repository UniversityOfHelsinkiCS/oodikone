const _ = require('lodash')
const { ElementDetail, Organization } = require('../../modelsV2')
const {
  dbConnections: { sequelize }
} = require('../../databaseV2/connection')
const { getAssociations } = require('../../services/studyrights')

const { getStatus, refreshStatus } = require('./status')
const { getProtoC, refreshProtoC } = require('./protoC')
const { getUber, refreshUber } = require('./uber')
const { getRedisCDS, saveToRedis, getTargetStudentCounts } = require('./shared')

const STUDYRIGHT_START_DATE = '2017-07-31 21:00:00+00'
const CURRENT_DATE = new Date()

const REDIS_KEY_PROTOC_PROGRAMME = 'PROTOC_PROGRAMME_DATA_V2'

const withErr = handler => (req, res, next) =>
  handler(req, res, next).catch(e => {
    console.error(e)
    res.status(500).json({ error: { message: e.message, stack: e.stack } })
  })

const getCurrentStudyYearStartDate = _.memoize(
  async unixMillis =>
    new Date(
      (
        await sequelize.query(
          `
    SELECT startdate FROM SEMESTERS s WHERE yearcode = (SELECT yearcode FROM SEMESTERS WHERE startdate < :a ORDER BY startdate DESC LIMIT 1) ORDER BY startdate LIMIT 1;
    `,
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: { a: new Date(unixMillis) }
          }
        )
      )[0].startdate
    )
)

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const getGraduatedBetween = async (start, end) => {
  return sequelize.query(
    `
    select studyright.faculty_code, s.code, count(distinct(s.code, s.studentnumber)) as sum
    from studyright_elements s
    inner join studyright on s.studyrightid = studyright.studyrightid
    where (s.code ILIKE 'MH%' or s.code ILIKE 'KH%')
    and studyright.graduated = '1'
    and studyright.enddate between :start and :end
    group by s.code, studyright.faculty_code
    order by studyright.faculty_code
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { start, end }
    }
  )
}

const calculateProtoCProgramme = async query => {
  const associations = await getAssociations()
  const codes = associations.programmes[query.code]
    ? [...associations.programmes[query.code].studytracks, query.code]
    : []
  const data = await getTargetStudentCounts({
    codes: codes,
    includeOldAttainments: query.include_old_attainments === 'true',
    excludeNonEnrolled: query.exclude_non_enrolled === 'true'
  })
  const programmeData = data.find(d => d.programmeType === 20)
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
      currentlyCancelled: parseInt(programmeRow.currentlyCancelled, 10)
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
          currentlyCancelled: studytrackdata.currentlyCancelled
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
    studytracks: studytrackToBachelorProgrammes[programmeData.programmeCode]
  }
  return programmeDataMankeld
}


const calculateStatusGraduated = async (unixMillis, showByYear) => {
  const startDate = showByYear === 'true' ? getCurrentYearStartDate() : await getCurrentStudyYearStartDate(unixMillis)

  const startYear = startDate.getFullYear()
  const yearRange = _.range(2017, startYear + 1)
  const Y_TO_MS = 31556952000
  const startTime = startDate.getTime()

  const yearlyRange = diff => ({
    from: new Date(startTime - diff * Y_TO_MS),
    to: new Date(unixMillis - diff * Y_TO_MS)
  })

  const totalRange = diff => ({
    from: new Date(startTime - diff * Y_TO_MS),
    to: new Date(startTime - (diff - 1) * Y_TO_MS)
  })

  const dataArray = yearRange.map(async year => {
    const diff = startYear - year
    const { from, to } = yearlyRange(diff)
    const yearlyData = await getGraduatedBetween(from, to)
    const data = { year, yearlyData }
    return data
  })

  const totalDataArray = yearRange.map(async year => {
    const diff = startYear - year
    const { from, to } = totalRange(diff)

    const yearlyData = await getGraduatedBetween(from, to)
    const data = { year, yearlyData }
    return data
  })

  const promisedData = await Promise.all(dataArray)
  const promisedTotalData = await Promise.all(totalDataArray)

  const elements = await ElementDetail.findAll()
  const orgs = await Organization.findAll()

  // go through acc
  const mankeled = promisedData.reduce((acc, data) => {
    data.yearlyData.forEach(curr => {
      // init faculty
      if (!acc[curr.faculty_code]) {
        const org = orgs.find(o => o.code === curr.faculty_code)
        acc[curr.faculty_code] = { name: org.name, yearly: {}, drill: {} }
      }
      if (!acc[curr.faculty_code]['yearly'][data.year])
        acc[curr.faculty_code]['yearly'][data.year] = { acc: 0, total: 0 }
      // init programme
      if (!acc[curr.faculty_code]['drill'][curr.code]) {
        const element = elements.find(e => e.code === curr.code)

        acc[curr.faculty_code]['drill'][curr.code] = {
          code: curr.code,
          name: element.name,
          current: 0,
          previous: 0,
          yearly: {}
        }
      }
      acc[curr.faculty_code]['drill'][curr.code]['yearly'][data.year] = { acc: Number(curr.sum) }
      acc[curr.faculty_code]['drill'][curr.code]['current'] =
        _.get(acc, [curr.faculty_code, 'drill', curr.code, 'yearly', startYear, 'acc']) || 0
      acc[curr.faculty_code]['drill'][curr.code]['previous'] =
        _.get(acc, [curr.faculty_code, 'drill', curr.code, 'yearly', startYear - 1, 'acc']) || 0

      acc[curr.faculty_code]['yearly'][data.year].acc += Number(curr.sum)
      acc[curr.faculty_code]['current'] = _.get(acc, [curr.faculty_code, 'yearly', startYear, 'acc']) || 0
      acc[curr.faculty_code]['previous'] = _.get(acc, [curr.faculty_code, 'yearly', startYear - 1, 'acc']) || 0
    })
    return acc
  }, {})

  // add totals to mankeled
  promisedTotalData.forEach(data => {
    data.yearlyData.forEach(curr => {
      // if no accumulated init programme
      if (!mankeled[curr.faculty_code]['drill'][curr.code]) {
        const element = elements.find(e => e.code === curr.code)
        mankeled[curr.faculty_code]['drill'][curr.code] = { name: element.name, code: curr.code, yearly: {} }
      }
      // if no year in programme yearly add year
      if (!mankeled[curr.faculty_code]['drill'][curr.code]['yearly'][data.year])
        mankeled[curr.faculty_code]['drill'][curr.code]['yearly'][data.year] = { total: 0, acc: 0 }
      // if no year in yearly total for faculty
      if (!mankeled[curr.faculty_code]['yearly'][data.year])
        mankeled[curr.faculty_code]['yearly'][data.year] = { total: 0, acc: 0 }
      // do not add anything to total if current year. might fuck up in fall :D
      if (data.year !== startYear) {
        mankeled[curr.faculty_code]['yearly'][data.year].total += Number(curr.sum)
        mankeled[curr.faculty_code]['drill'][curr.code]['yearly'][data.year].total = Number(curr.sum)
      }
    })
  })

  return mankeled
}

const getGraduatedStatus = async (unixMillis, showByYear, doRefresh = false) => {
  const KEY = `${REDIS_KEY_GRADUATED}_DATE_${unixMillis}_YEARLY_${showByYear.toUpperCase()}`
  const graduated = await getRedisCDS(KEY)
  if (!graduated || doRefresh) {
    const data = await calculateStatusGraduated(unixMillis, showByYear)
    await saveToRedis(data, KEY, true)
    return data
  }
  return graduated
}

// used for studytrack view
const getProtoCProgramme = async (query, doRefresh = false) => {
  const { include_old_attainments, exclude_non_enrolled, code } = query
  const KEY = `${REDIS_KEY_PROTOC_PROGRAMME}_CODE_${code}_OLD_${include_old_attainments.toUpperCase()}_ENR_${exclude_non_enrolled.toUpperCase()}`
  const protoCProgramme = await getRedisCDS(KEY)

  if (!protoCProgramme || doRefresh) {
    const data = await calculateProtoCProgramme(query)
    await saveToRedis(data, KEY)
    return data
  }
  return protoCProgramme
}

const refreshProtoCProgramme = async query => {
  const { include_old_attainments, exclude_non_enrolled, code } = query

  const KEY = `${REDIS_KEY_PROTOC_PROGRAMME}_CODE_${code}_OLD_${include_old_attainments.toUpperCase()}_ENR_${exclude_non_enrolled.toUpperCase()}`

  const data = await calculateProtoCProgramme(query)
  await saveToRedis(data, KEY)
}

const refreshStatusGraduated = async (unixMillis, showByYear) => {
  const KEY = `${REDIS_KEY_GRADUATED}_DATE_${unixMillis}_YEARLY_${showByYear.toUpperCase()}`
  const data = await calculateStatusGraduated(unixMillis, showByYear)
  await saveToRedis(data, KEY, true)
}

const getStartYears = async () => {
  return await sequelize.query(
    `
    SELECT
        DISTINCT studyright.studystartdate
    FROM organization org
        INNER JOIN studyright
            ON studyright.faculty_code = org.code
        LEFT JOIN transfers
            ON studyright.studyrightid = transfers.studyrightid
    WHERE
        studyright.extentcode = 1
        AND studyright.studystartdate >= :startDate
        AND studyright.studystartdate <= :currentDate
        AND transfers.studyrightid IS NULL
    ORDER BY 1
  `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { startDate: STUDYRIGHT_START_DATE, currentDate: CURRENT_DATE }
    }
  )
}

module.exports = {
  getGraduatedStatus,
  getProtoC,
  getProtoCProgramme,
  getStatus,
  getUber,
  refreshProtoC,
  refreshProtoCProgramme,
  refreshStatus,
  refreshStatusGraduated,
  refreshUber,
  withErr,
  getStartYears,
}
