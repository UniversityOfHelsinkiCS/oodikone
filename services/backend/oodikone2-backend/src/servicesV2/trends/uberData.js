const REDIS_KEY_GRADUATED = 'GRADUATED_DATA_V2'
const { getRedisCDS, saveToRedis } = require('./shared')

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


const calculateUber = async query => {
  const data = await getUberData({
    startDate: new Date(query.start_date),
    includeOldAttainments: query.include_old_attainments === 'true'
  })
  const mankeld = mankeliUberData(data)
  return mankeld
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

const refreshUber = async query => {
  const KEY = `${REDIS_KEY_UBER}_OLD_${query.include_old_attainments.toUpperCase()}_${new Date(
    query.start_date
  ).getFullYear()}`
  const data = await calculateUber(query)
  await saveToRedis(data, KEY)
}

module.exports = {
  getUber,
  refreshUber
}
