const _ = require('lodash')
const { ElementDetail, Organization } = require('../../modelsV2')
const {
  dbConnections: { sequelize }
} = require('../../databaseV2/connection')
const { getAssociations } = require('../../services/studyrights')

const { getStatus, refreshStatus } = require('./getStatus')
const { getProtoC, refreshProtoC } = require('./getProtoC')
const { getRedisCDS, saveToRedis, getTargetStudentCounts } = require('./shared')

const STUDYRIGHT_START_DATE = '2017-07-31 21:00:00+00'
const CURRENT_DATE = new Date()

const REDIS_KEY_PROTOC_PROGRAMME = 'PROTOC_PROGRAMME_DATA_V2'
const REDIS_KEY_UBER = 'UBER_DATA_V2'
const REDIS_KEY_GRADUATED = 'GRADUATED_DATA_V2'

const isSameDateIgnoringYear = (a, b) =>
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate() &&
  a.getUTCHours() === b.getUTCHours() &&
  a.getUTCMinutes() === b.getUTCMinutes() &&
  a.getUTCSeconds() === b.getUTCSeconds() &&
  a.getUTCMilliseconds() === b.getUTCMilliseconds()

const makeCheckpoints = startDate => {
  const M_TO_MS = 2.628e6 * 1000
  const FOUR_M_TO_MS = M_TO_MS * 4
  const CHECKPOINT_INTERVAL = FOUR_M_TO_MS

  const now = Date.now()
  let checkpoints = []

  // add start date as first checkpoint but add 1ms since just having the same date
  // would set the credit target to 0
  checkpoints.push(new Date(startDate.getTime() + 1))

  for (let ts = startDate.getTime() + CHECKPOINT_INTERVAL; ts < now; ts += CHECKPOINT_INTERVAL) {
    checkpoints.push(new Date(ts))
  }

  if (checkpoints[checkpoints.length - 1].getTime() > now) {
    // last checkpoint in the future
    checkpoints[checkpoints.length - 1] = new Date()
  } else if (now - checkpoints[checkpoints.length - 1].getTime() > M_TO_MS) {
    // last checkpoint over a month in the past, push "now" in there
    checkpoints.push(new Date())
  }

  // go through all checkpoints excluding first and adjust the ones that are exactly one
  // year from start date
  // do this here in the end so we don't need to copypaste isSameDateIgnoringYear
  // in three places
  for (let i = 1; i < checkpoints.length; i++) {
    if (isSameDateIgnoringYear(startDate, checkpoints[i])) {
      // exactly one year from start date -> set checkpoint to 1ms before so we don't explode in SQL
      checkpoints[i] = new Date(checkpoints[i].getTime() - 1)
    }
  }

  return checkpoints
}

const getUberData = async ({ startDate, includeOldAttainments }) => {
  const checkpoints = makeCheckpoints(startDate)

  return sequelize.query(
    `
      SELECT
          cp "checkpoint",
          ss.org_code "orgCode",
          ss.org_name "orgName",
          ss.programme_code "programmeCode",
          ss.programme_name "programmeName",
          COUNT(ss.studentnumber) "programmeTotalStudents",
          SUM(
              public.is_in_target(
                  cp,
                  ss.studystartdate,
                  public.next_date_occurrence(ss.studystartdate, cp),
                  ss.credits,
                  60 * ceil(EXTRACT(EPOCH FROM (cp - ss.studystartdate) / 365) / 86400)
              )
          ) "students3y",
          SUM(
              public.is_in_target(
                  cp,
                  ss.studystartdate,
                  public.next_date_occurrence(ss.studystartdate, cp),
                  ss.credits,
                  45 * ceil(EXTRACT(EPOCH FROM (cp - ss.studystartdate) / 365) / 86400)
              )
          ) "students4y"
      FROM (
          SELECT
              cp,
              org_code,
              org_name,
              programme_code,
              programme_name,
              studystartdate,
              studentnumber,
              SUM(credits) credits
          FROM (
              SELECT
                  checkpoints.checkpoint cp,
                  org.code org_code,
                  org.name->>'fi' org_name,
                  element_details.code programme_code,
                  element_details.name->>'fi' programme_name,
                  studyright.studystartdate studystartdate,
                  studyright.student_studentnumber studentnumber,
                  credit.credits credits
              FROM
                  organization org
                  INNER JOIN studyright
                      ON org.code = studyright.faculty_code
                  INNER JOIN (
                      -- HACK: fix updater writing duplicates where enddate has changed
                      SELECT DISTINCT ON (studyrightid, startdate, code, studentnumber)
                          *
                      FROM studyright_elements
                  ) s_elements
                      ON studyright.studyrightid = s_elements.studyrightid
                  INNER JOIN element_details
                      ON s_elements.code = element_details.code
                  LEFT JOIN transfers
                      ON studyright.studyrightid = transfers.studyrightid
                  INNER JOIN unnest($1::TIMESTAMP WITH TIME ZONE[])
                      AS checkpoints(checkpoint)
                      ON true
                  LEFT JOIN LATERAL (
                      SELECT
                          student_studentnumber,
                          attainment_date,
                          credits
                      FROM credit
                      WHERE credit.credittypecode IN (4, 9) -- Completed or Transferred
                          AND credit."isStudyModule" = false
                          ${includeOldAttainments ? '' : 'AND credit.attainment_date >= $2::TIMESTAMP WITH TIME ZONE'}
                          AND credit.attainment_date <= checkpoints.checkpoint
                  ) credit
                      ON credit.student_studentnumber = studyright.student_studentnumber
              WHERE
                  studyright.extentcode = 1 -- Bachelor's
                  AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                  AND studyright.studystartdate = $2::TIMESTAMP WITH TIME ZONE
                  AND element_details.type = 20 -- Programme's name
                  AND transfers.studyrightid IS NULL -- Not transferred within faculty
          ) s
          GROUP BY 1, (2,3), (4,5), 6, 7
      ) ss
      GROUP BY 1, (2, 3), (4, 5);
      `,
    {
      type: sequelize.QueryTypes.SELECT,
      bind: [checkpoints, startDate]
    }
  )
}

const withErr = handler => (req, res, next) =>
  handler(req, res, next).catch(e => {
    console.error(e)
    res.status(500).json({ error: { message: e.message, stack: e.stack } })
  })

const mankeliUberData = data =>
  _(data)
    // First, gather programme snapshots grouped by programme
    .map(programmeRow => ({
      ...programmeRow,
      programmeTotalStudents: parseInt(programmeRow.programmeTotalStudents, 10),
      students3y: parseInt(programmeRow.students3y, 10),
      // 4y group includes 3y group, make the 4y group exclusive
      students4y: parseInt(programmeRow.students4y, 10) - parseInt(programmeRow.students3y, 10)
    }))
    .groupBy(row => row.programmeCode)
    .map(programmeRows => ({
      ..._.pick(programmeRows[0], 'orgCode', 'orgName', 'programmeCode', 'programmeName'),
      snapshots: _(programmeRows)
        .map(({ checkpoint: date, programmeTotalStudents: totalStudents, students3y, students4y }) => ({
          date,
          totalStudents,
          students3y,
          students4y
        }))
        .sort((a, b) => a.date - b.date)
        .value()
    }))
    // Then, group all programmes under the correct organization
    .groupBy(p => p.orgCode)
    .map(programmeRows => ({
      name: programmeRows[0].orgName,
      code: programmeRows[0].orgCode,
      // Calculate snapshots for this organization by summing
      // the total & target values from each programme, grouped by the snapshot date
      snapshots: _(programmeRows)
        .flatMap(row => row.snapshots)
        .groupBy(snapshot => snapshot.date)
        .map(snapshots => ({
          date: snapshots[0].date,
          totalStudents: _.sumBy(snapshots, s => s.totalStudents),
          students3y: _.sumBy(snapshots, s => s.students3y),
          students4y: _.sumBy(snapshots, s => s.students4y)
        }))
        .sort((a, b) => a.date - b.date)
        .value(),
      /**
       * type ProgrammeCode = string
       * programmes: Map<ProgrammeCode, Programme>
       */
      programmes: _(programmeRows)
        .map(({ programmeCode: code, programmeName: name, snapshots }) => ({
          code,
          name,
          snapshots
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .value()
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .value()

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

const getTotalCreditsOfCoursesBetween = async (a, b, alias = 'sum', alias2 = 'sum2') => {
  return sequelize.query(
    `
    SELECT SUM(cr.credits) AS ` +
    alias + // HAX, alias doesn't come from user so no sql injection
      `,COUNT(DISTINCT(cr.student_studentnumber)) AS ` +
      alias2 +
      `, o.code AS organizationcode, co.code, co.id, co.name FROM credit cr
      INNER JOIN course co ON cr.course_code = co.code
      INNER JOIN course_providers cp ON cp.coursecode = co.id
      INNER JOIN organization o ON o.id = cp.organizationcode
    WHERE
      cr.attainment_date BETWEEN :a AND :b
      AND (cr."isStudyModule" = false OR cr."isStudyModule" IS NULL)
      AND cr.credittypecode IN (4, 9)
    GROUP BY co.id, o.code
    -- HAVING SUM(cr.credits) > 0
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { a, b }
    }
  )
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

const calculateUber = async query => {
  const data = await getUberData({
    startDate: new Date(query.start_date),
    includeOldAttainments: query.include_old_attainments === 'true'
  })
  const mankeld = mankeliUberData(data)
  return mankeld
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

const getUber = async (query, doRefresh = false) => {
  // redis keys for different queries
  const KEY = `${REDIS_KEY_UBER}_OLD_${query.include_old_attainments.toUpperCase()}_${new Date(
    query.start_date
  ).getFullYear()}`

  const uber = await getRedisCDS(KEY)
  if (!uber || doRefresh) {
    const data = await calculateUber(query)
    await saveToRedis(data, KEY)
    return data
  }
  return uber
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

const refreshUber = async query => {
  const KEY = `${REDIS_KEY_UBER}_OLD_${query.include_old_attainments.toUpperCase()}_${new Date(
    query.start_date
  ).getFullYear()}`
  const data = await calculateUber(query)
  await saveToRedis(data, KEY)
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
  withErr,
  mankeliUberData,
  getTargetStudentCounts,
  getUberData,
  calculateProtoCProgramme,
  getProtoCProgramme,
  getStatus,
  getProtoC,
  getUber,
  refreshProtoC,
  refreshStatus,
  refreshUber,
  refreshProtoCProgramme,
  refreshStatusGraduated,
  getStartYears,
  getGraduatedStatus
}
