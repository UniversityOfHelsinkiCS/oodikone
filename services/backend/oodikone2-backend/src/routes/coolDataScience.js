const router = require('express').Router()
const _ = require('lodash')
const { sequelize } = require('../database/connection')

const {
  withErr,
  mankeliUberData,
  getTargetStudentCounts,
  get3yStudentsWithDrilldownPerYear,
  getStatusStatistics,
  sorters,
  getUberData
} = require('../services/coolDataScience')
const { getAssociations } = require('../services/studyrights')

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

router.get(
  '/uber-data',
  withErr(async (req, res) => {
    const data = await getUberData({
      startDate: new Date(req.query.start_date),
      includeOldAttainments: req.query.include_old_attainments === 'true'
    })
    const mankeld = mankeliUberData(data)
    res.json(mankeld)
  })
)

router.get(
  '/proto-c-data-programme',
  withErr(async (req, res) => {
    const associations = await getAssociations()
    const codes = associations.programmes[req.query.code]
      ? [...associations.programmes[req.query.code].studytracks, req.query.code]
      : []
    const data = await getTargetStudentCounts({
      codes: codes,
      includeOldAttainments: req.query.include_old_attainments === 'true',
      excludeNonEnrolled: req.query.exclude_non_enrolled === 'true'
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
    res.json(programmeDataMankeld)
  })
)

router.get(
  '/proto-c-data',
  withErr(async (req, res) => {
    const associations = await getAssociations()

    const data = await getTargetStudentCounts({
      includeOldAttainments: req.query.include_old_attainments === 'true',
      excludeNonEnrolled: req.query.exclude_non_enrolled === 'true'
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
    const newmankelid = _(programmeData)
      // seems to return the numerical columns as strings, parse them first
      .map(programmeRow => ({
        ...programmeRow,
        programmeTotalStudents: parseInt(programmeRow.programmeTotalStudents, 10),
        students3y: parseInt(programmeRow.students3y, 10),
        // 4y group includes 3y group, make 4y count exclusive:
        students4y: parseInt(programmeRow.students4y, 10) - parseInt(programmeRow.students3y, 10),
        currentlyCancelled: parseInt(programmeRow.currentlyCancelled, 10)
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
            currentlyCancelled
          }) => ({
            code,
            name,
            totalStudents,
            students3y,
            students4y,
            currentlyCancelled,
            studytracks: studytrackToBachelorProgrammes[code]
          })
        )
      }))
      .value()

    res.json(newmankelid)
  })
)

router.get(
  '/3y-students',
  withErr(async (req, res) => {
    const { startDate, sort } = req.query
    const shouldSort = Object.keys(sorters).includes(sort)

    const rawData = await get3yStudentsWithDrilldownPerYear(startDate)
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

router.get(
  '/status',
  withErr(async (req, res) => {
    const { date: unixMillis } = req.query
    const date = new Date(Number(unixMillis))

    if (isNaN(date.getTime()) || date.getTime() > new Date().getTime()) {
      return res.status(400).json({ error: 'Invalid date' })
    }

    // End of day
    date.setHours(23, 59, 59, 999)
    const status = await getStatusStatistics(date.getTime())
    res.json(status)
  })
)

module.exports = router
