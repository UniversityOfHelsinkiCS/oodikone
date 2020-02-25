const router = require('express').Router()
const _ = require('lodash')
const { sequelize } = require('../database/connection')

const STUDYRIGHT_START_DATE = '2017-07-31 21:00:00+00'

router.get('/start-years', async (req, res) => {
  const years = await sequelize.query(
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
        AND transfers.studyrightid IS NULL
    ORDER BY 1
  `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { startDate: STUDYRIGHT_START_DATE }
    }
  )
  res.json(years.map(({ studystartdate }) => studystartdate))
})

const targetCreditsForStartDate = startDate => {
  const year = new Date(startDate)
  switch (year.getFullYear()) {
    case 2017:
      return 180
    case 2018:
      return 120
    case 2019:
      return 60
    default:
      throw new Error('wtf')
  }
}

const get3yStudentsWithDrilldown = _.memoize(async startDate => {
  return await sequelize.query(
    `
    SELECT
        ss.org_code "orgCode",
        ss.org_name "orgName",
        ss.programme_code "programmeCode",
        ss.programme_name "programmeName",
        COUNT(ss.studentnumber) "programmeTotalStudents",
        SUM(
            public.is_in_target(
                CURRENT_TIMESTAMP,
                ss.studystartdate,
                TIMESTAMP '2020-07-31',
                ss.credits,
                :targetCredits
            )
        ) "targetStudents"
    FROM (
        SELECT
            org_code,
            org_name,
            programme_code,
            programme_name,
            studystartdate,
            studentnumber,
            SUM(credits) credits
        FROM (
            SELECT
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
                LEFT JOIN (
                    SELECT
                        student_studentnumber,
                        attainment_date,
                        credits
                    FROM credit
                    WHERE credit.credittypecode IN (4, 9) -- Completed or Transferred
                        AND credit.attainment_date >= :startDate
                ) credit
                    ON credit.student_studentnumber = studyright.student_studentnumber
            WHERE
                studyright.extentcode = 1 -- Bachelor's
                AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                AND studyright.studystartdate = :startDate
                AND element_details.type = 20 -- Programme's name
                AND transfers.studyrightid IS NULL -- Not transferred within faculty
        ) s
        GROUP BY (1,2), (3,4), 5, 6
    ) ss
    GROUP BY (1, 2), (3, 4);
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        startDate: startDate,
        targetCredits: targetCreditsForStartDate(startDate)
      }
    }
  )
})

const getUberData = _.memoize(async startDate => {
  const creditsTarget = targetCreditsForStartDate(startDate)
  const checkpoints = [
    '2017-11-30T13:00:00.000Z',
    '2018-04-01T05:00:00.000Z',
    '2018-07-31T21:00:00.000Z',
    '2018-11-30T13:00:00.000Z',
    '2019-04-01T05:00:00.000Z',
    '2019-07-31T21:00:00.000Z',
    '2019-11-30T13:00:00.000Z',
    new Date().toISOString()
  ]
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
                TIMESTAMP '2020-07-31',
                ss.credits,
                $1
            )
        ) "students3y",
        SUM(
          public.is_in_target(
              cp,
              ss.studystartdate,
              TIMESTAMP '2021-07-31',
              ss.credits,
              $1
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
                    INNER JOIN unnest($2::TIMESTAMP WITH TIME ZONE[])
                        AS checkpoints(checkpoint)
                        ON true
                    LEFT JOIN LATERAL (
                        SELECT
                            student_studentnumber,
                            attainment_date,
                            credits
                        FROM credit
                        WHERE credit.credittypecode IN (4, 9) -- Completed or Transferred
                            AND credit.attainment_date >= $3::TIMESTAMP WITH TIME ZONE
                            AND credit.attainment_date <= checkpoints.checkpoint
                    ) credit
                        ON credit.student_studentnumber = studyright.student_studentnumber
                WHERE
                    studyright.extentcode = 1 -- Bachelor's
                    AND studyright.prioritycode IN (1, 30) -- Primary or Graduated
                    AND studyright.studystartdate = $3::TIMESTAMP WITH TIME ZONE
                    AND element_details.type = 20 -- Programme's name
                    AND transfers.studyrightid IS NULL -- Not transferred within faculty
            ) s
            GROUP BY 1, (2,3), (4,5), 6, 7
        ) ss
    GROUP BY 1, (2, 3), (4, 5);
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      bind: [creditsTarget, checkpoints, startDate]
    }
  )
})

const sorters = {
  target: (a, b) => a.targetStudents - b.targetStudents,
  total: (a, b) => a.totalStudents - b.totalStudents,
  targetRelative: (a, b) => a.targetStudents / a.totalStudents - b.targetStudents / b.totalStudents
}

const withErr = handler => (req, res, next) => handler(req, res, next).catch(e => res.status(500).json({ error: e }))

router.get(
  '/uber-data',
  withErr(async (req, res) => {
    const data = await getUberData(req.query.start_date)

    // mankel data from:
    /* 
      [
        {
          checkpoint: "2017-11-30T13:00:00.000Z",
          orgCode: "H10",
          orgName: "Teologinen tiedekunta",
          programmeCode: "KH10_001",
          programmeName: "Teologian ja uskonnontutkimuksen kandiohjelma",
          programmeTotalStudents: "120",
          students3y: "9"
          students4y: "10"
        },
        ...
      ]
    */
    // into:
    /*
    {
      H10: {
        name: "Teologinen tiedekunta",
        code: "H10",
        // snapshots of faculty level total & target numbers
        snapshots: [
          {
            date: '2017-11-30T13:00:00.000Z',
            totalStudents: 340, // sum of programme total students at this checkpoint
            students3y: 43, // ^^^ of programme 3y target students
            students4y: 55
          },
          ...
        ],
        // snapshots of programme level total & target numbers, grouped by programme
        programmes: [
          {
            code: 'KH10_001',
            name: 'Teologian ja uskonnontutkimuksen kandiohjelma',
            snapshots: [
              {
                date: '2017-11-30T13:00:00.000Z',
                totalStudents: 120,
                students3y: 9,
                students4y: 10
              },
              ...
          },
          ...
        ]
      },
      ...
    }
    */
    const mankeld = _(data)
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
      .mapValues(programmeRows => ({
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
          .keyBy(p => p.code)
          .value()
      }))
      .value()

    res.json(mankeld)
  })
)

router.get(
  '/3y-students',
  withErr(async (req, res) => {
    const { startDate, sort } = req.query
    const shouldSort = Object.keys(sorters).includes(sort)

    const rawData = await get3yStudentsWithDrilldown(startDate)
    const byOrganization = rawData.reduce((acc, val) => {
      const programmeTotalStudents = parseInt(val.programmeTotalStudents, 10)
      const targetStudents = parseInt(val.targetStudents, 10)

      const obj = acc[val.orgCode] || {}
      obj.code = val.orgCode
      obj.name = val.orgName
      obj.programmes = obj.programmes || []
      obj.programmes.push({
        name: val.programmeName,
        totalStudents: programmeTotalStudents,
        targetStudents: targetStudents
      })
      obj.totalStudents = (obj.totalStudents || 0) + programmeTotalStudents
      obj.targetStudents = (obj.targetStudents || 0) + targetStudents
      acc[val.orgCode] = obj
      return acc
    }, {})

    const data = Object.values(byOrganization)
    res.json(
      shouldSort ? data.map(d => ({ ...d, programmes: d.programmes.sort(sorters[sort]) })).sort(sorters[sort]) : data
    )
  })
)

module.exports = router
