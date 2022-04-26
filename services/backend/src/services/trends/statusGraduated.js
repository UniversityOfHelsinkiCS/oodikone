const _ = require('lodash')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { getRedisCDS, saveToRedis } = require('./shared')
const { ElementDetail, Organization } = require('../../models')
const REDIS_KEY_GRADUATED = 'GRADUATED_DATA_V2'

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
            replacements: { a: new Date(unixMillis) },
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
      replacements: { start, end },
    }
  )
}

const calculateStatusGraduated = async (unixMillis, showByYear) => {
  const startDate = showByYear === 'true' ? getCurrentYearStartDate() : await getCurrentStudyYearStartDate(unixMillis)

  const startYear = startDate.getFullYear()
  const yearRange = _.range(2017, startYear + 1)
  const Y_TO_MS = 31556952000
  const startTime = startDate.getTime()

  const yearlyRange = diff => ({
    from: new Date(startTime - diff * Y_TO_MS),
    to: showByYear === 'true' ? new Date(startTime - (diff - 1) * Y_TO_MS) : new Date(unixMillis - diff * Y_TO_MS),
  })

  const totalRange = diff => ({
    from: new Date(startTime - diff * Y_TO_MS),
    to: new Date(startTime - (diff - 1) * Y_TO_MS),
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
        if (org) {
          acc[curr.faculty_code] = { name: org.name, yearly: {}, drill: {} }
        }
      }
      if (!acc[curr.faculty_code]?.['yearly'][data.year])
        acc[curr.faculty_code]['yearly'][data.year] = { acc: 0, total: 0 }
      // init programme
      if (!acc[curr.faculty_code]['drill'][curr.code]) {
        const element = elements.find(e => e.code === curr.code)

        acc[curr.faculty_code]['drill'][curr.code] = {
          code: curr.code,
          name: element.name,
          current: 0,
          previous: 0,
          yearly: {},
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
      // if no accumulated init faculty
      if (!mankeled[curr.faculty_code]) {
        const org = orgs.find(o => o.code === curr.faculty_code)
        mankeled[curr.faculty_code] = { name: org.name, yearly: {}, drill: {} }
      }
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

const refreshStatusGraduated = async (unixMillis, showByYear) => {
  const KEY = `${REDIS_KEY_GRADUATED}_DATE_${unixMillis}_YEARLY_${showByYear.toUpperCase()}`
  const data = await calculateStatusGraduated(unixMillis, showByYear)
  await saveToRedis(data, KEY, true)
}

module.exports = {
  getGraduatedStatus,
  refreshStatusGraduated,
}
