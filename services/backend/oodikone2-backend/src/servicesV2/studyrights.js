const {
  dbConnections: { sequelize }
} = require('../databaseV2/connection')
const { Studyright, StudyrightElement, ElementDetail } = require('../modelsV2')
const { getUserElementDetails } = require('./userService')
const { hasEnrolledForSemester } = require('./students')
const { getCurrentSemester } = require('./semesters')
const moment = require('moment')
const { redisClient } = require('./redis')
const _ = require('lodash')
const { Op, col, where, fn } = require('sequelize')

const createStudyright = apiData => Studyright.create(apiData)

const REDIS_KEY = 'STUDYRIGHT_ASSOCIATIONS_V2'

const byStudent = studentNumber => {
  return Studyright.findAll({
    where: {
      student_studentnumber: {
        [Op.eq]: studentNumber
      }
    }
  })
}

const getActiveStudyrightElementsOfCodeBeforeDate = async (code, date) =>
  await StudyrightElement.findAll({
    where: {
      code,
      enddate: {
        [Op.gte]: date
      }
    }
  })

const getActiveStudyrightsFromIdsBeforeDate = async (studyrightIds, date) =>
  await Studyright.findAll({
    where: {
      graduated: 0,
      studyrightid: {
        [Op.in]: studyrightIds
      },
      canceldate: null,
      enddate: {
        [Op.gte]: date
      }
    }
  })

const nonGraduatedStudentsOfElementDetail = async code => {
  const today = new Date()
  const currentSemesterCode = (await getCurrentSemester()).semestercode

  // Get studyrights of target code that haven't ended yet
  const studyrightElements = await getActiveStudyrightElementsOfCodeBeforeDate(code, today)
  const studentToDatesMap = {}

  studyrightElements.forEach(({ startdate, enddate, studentnumber }) => {
    studentToDatesMap[studentnumber] = {
      startdate,
      enddate
    }
  })

  const studyrights = await getActiveStudyrightsFromIdsBeforeDate(studyrightElements.map(sE => sE.studyrightid), today)

  // Filter out students that are in new master's programmes,
  // see if student is currently enrolled and format the result
  // to shape of { year1: [studentnumbers], ... }
  const result = {}
  const studentnumbers = new Set()
  const studentsToBeFiltered = new Set()
  await Promise.all(
    studyrights.map(
      ({ studentStudentnumber: student_studentnumber, studyrightid }) =>
        new Promise(async res => {
          const [enrolled, studentElementDetails] = await Promise.all([
            await hasEnrolledForSemester(student_studentnumber, currentSemesterCode),
            await StudyrightElement.findAll({
              where: {
                studyrightid
              }
            })
          ])

          // If student is in new master's programme,
          // then don't include them in the result
          if (studentElementDetails.find(e => e.code.match(/^M[A-Z]*[0-9]*_[0-9]*$/))) {
            studentsToBeFiltered.add(student_studentnumber)
            return res()
          }

          if (studentnumbers.has(student_studentnumber)) return res()
          const year = moment(studentToDatesMap[student_studentnumber].startdate)
            .tz('Europe/Helsinki')
            .year()
          if (!result[year]) result[year] = []
          studentnumbers.add(student_studentnumber)
          result[year].push({
            studentNumber: student_studentnumber,
            enrolled
          })
          res()
        })
    )
  )

  // Filter out some special cases
  Object.keys(result).forEach(year => {
    result[year] = result[year].filter(({ studentNumber }) => !studentsToBeFiltered.has(studentNumber))
  })

  return [result, [...studentnumbers]]
}

const studentNumbersWithAllStudyRightElements = async (codes, startedAfter, startedBefore) => {
  const studyrights = await StudyrightElement.findAll({
    attributes: ['studentnumber'],
    where: {
      code: {
        [Op.in]: codes
      },
      startdate: {
        [Op.between]: [startedAfter, startedBefore]
      }
    },
    group: [col('studentnumber')],
    having: where(fn('count', fn('distinct', col('code'))), {
      [Op.eq]: codes.length
    })
  })
  return studyrights.map(srelement => srelement.studentnumber)
}

const removeDuplicatesFromValues = obj => {
  Object.keys(obj).forEach(key => {
    obj[key] = _.uniq(obj[key])
  })
  return obj
}

const associationArraysToMapping = associations => {
  const mapping = associations.reduce((mappings, result) => {
    const { associations } = result
    associations.forEach(code => {
      const codes = mappings[code] || []
      mappings[code] = codes.concat(associations)
    })
    return mappings
  }, {})
  return removeDuplicatesFromValues(mapping)
}

const uniqueStudyrightCodeArrays = elementcodes =>
  sequelize.query(
    `
  SELECT
    DISTINCT(array_agg(studyright_elements.code)) AS associations
  FROM
    studyright_elements
  INNER JOIN
    element_details
  ON
    studyright_elements.code = element_details.code
    AND
    element_details.type IN (10, 20)
    AND
    studyright_elements.code IN(:elementcodes)
  GROUP BY
    studyright_elements.studyrightid
  ;
`,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { elementcodes }
    }
  )

const allUniqueStudyrightCodeArrays = () =>
  sequelize.query(
    `
  SELECT
    DISTINCT(array_agg(studyright_elements.code)) AS associations
  FROM
    studyright_elements
  INNER JOIN
    element_details
  ON
    studyright_elements.code = element_details.code
  WHERE
    element_details.type IN (10, 20)
  GROUP BY
    studyright_elements.studyrightid
  ;
`,
    {
      type: sequelize.QueryTypes.SELECT
    }
  )

const uniqueStudyrightAssocations = elementcodes => {
  if (elementcodes === undefined) {
    return allUniqueStudyrightCodeArrays()
  } else {
    return uniqueStudyrightCodeArrays(elementcodes)
  }
}

const getAssociatedStudyrights = async elementcodes => {
  const codesByStudyrights = await uniqueStudyrightAssocations(elementcodes)
  return associationArraysToMapping(codesByStudyrights)
}

const formatStudyrightElements = (elements, associations) =>
  elements.map(element => ({
    id: element.code,
    name: element.name,
    enabled: true,
    type: element.type,
    associations: associations && associations[element.code]
  }))

const getAllStudyrightElementsAndAssociations = async () => {
  let studyright_elements = await redisClient.getAsync('studyright_elements')
  if (!studyright_elements) {
    const [associations, studyrightelements] = await Promise.all([getAssociatedStudyrights(), ElementDetail.findAll()])
    await redisClient.setAsync(
      'studyright_elements',
      JSON.stringify(formatStudyrightElements(studyrightelements, associations))
    )
    studyright_elements = await redisClient.getAsync('studyright_elements')
  }
  return JSON.parse(studyright_elements)
}

const getStudyrightElementsAndAssociationsForUser = async username => {
  const studyrightelementcodes = await getUserElementDetails(username)
  if (studyrightelementcodes.length === 0) {
    return []
  }
  const associations = await getAssociatedStudyrights(studyrightelementcodes)
  return formatStudyrightElements(studyrightelementcodes, associations)
}

const getAllDegreesAndProgrammes = async () => {
  const elementDetails = ElementDetail.findAll({
    where: {
      type: {
        [Op.in]: [10, 20]
      }
    }
  })
  return formatStudyrightElements(elementDetails)
}

const getAllProgrammes = async () => {
  const elementDetails = ElementDetail.findAll({
    where: {
      type: {
        [Op.in]: [20]
      }
    }
  })
  return elementDetails
}

const getAllElementDetails = async () => {
  const elementDetails = ElementDetail.findAll()
  return elementDetails
}

const associatedStudyrightElements = async (offset, limit) => {
  const studyrights = await Studyright.findAll({
    attributes: [],
    include: {
      model: StudyrightElement,
      attributes: ['studyrightid', 'startdate', 'enddate'],
      include: {
        model: ElementDetail,
        attributes: ['type', 'name', 'code']
      }
    },
    limit,
    offset
  })
  const groupings = studyrights.map(({ studyright_elements: sres }) =>
    sres.map(sre => ({
      ...sre.element_detail.get(),
      studyrightid: sre.get().studyrightid,
      startdate: sre.get().startdate,
      enddate: sre.get().enddate
    }))
  )
  return groupings
}

const StudyRightType = {
  DEGREE: 10,
  PROGRAMME: 20,
  STUDYTRACK: 30
}

const calculateAssociationsFromDb = async (chunksize = 100000) => {
  // bottlenecked by Studyright.findAll in associatedStudyrightElements()
  const getSemester = momentstartdate => {
    if (momentstartdate < moment(`${momentstartdate.utc().year()}-07-31 21:00:00+00`)) return 'SPRING'
    return 'FALL'
  }
  const getEnrollmentStartYear = momentstartdate => {
    if (getSemester(momentstartdate) == 'SPRING') return momentstartdate.utc(2).year() - 1
    return momentstartdate.year()
  }
  const total = await Studyright.count()
  let offset = 0
  const types = new Set([StudyRightType.DEGREE, StudyRightType.PROGRAMME, StudyRightType.STUDYTRACK])
  const isValid = ({ type }) => types.has(type)
  const associations = { programmes: {}, degrees: {}, studyTracks: {} }
  while (offset <= total) {
    console.log(`${offset}/${total}`)
    const elementgroups = await associatedStudyrightElements(offset, chunksize)
    elementgroups.forEach(fullgroup => {
      const group = fullgroup.filter(isValid)
      group.forEach(({ type, code, name, studyrightid, startdate, enddate }) => {
        if (type === StudyRightType.DEGREE) {
          associations.degrees[code] = associations.degrees[code] || {
            type,
            name,
            code,
            programmes: {}
          }
        } else if (type === StudyRightType.STUDYTRACK) {
          associations.studyTracks[code] = associations.studyTracks[code] || {
            type,
            name,
            code,
            programmes: {}
          }
        } else if (type === StudyRightType.PROGRAMME) {
          associations.programmes[code] = associations.programmes[code] || {
            type: type,
            name: name,
            code: code,
            enrollmentStartYears: {},
            studytracks: []
          }
          const momentstartdate = moment(startdate)
          const enrollment = momentstartdate.isValid() ? getEnrollmentStartYear(momentstartdate) : null
          const enrollmentStartYears = associations.programmes[code].enrollmentStartYears
          enrollmentStartYears[enrollment] = enrollmentStartYears[enrollment] || {
            degrees: {},
            studyTracks: {}
          }
          const enrollmentStartYear = enrollmentStartYears[enrollment]

          group
            .filter(e => e.studyrightid === studyrightid && e.code !== code)
            .forEach(e => {
              if (e.type === StudyRightType.DEGREE) {
                enrollmentStartYear.degrees[e.code] = {
                  type: e.type,
                  name: e.name,
                  code: e.code
                }
                associations.degrees[e.code] = associations.degrees[e.code] || {
                  type: e.type,
                  name: e.name,
                  code: e.code,
                  programmes: {}
                }
                associations.degrees[e.code].programmes[code] = {
                  type: type,
                  name: name,
                  code: code
                }
              } else if (e.type === StudyRightType.STUDYTRACK) {
                const momentenddate = moment(enddate)
                const estartdate = moment(e.startdate)
                const eenddate = moment(e.enddate)
                // check that programme and studytrack time ranges overlap
                if (
                  (momentstartdate <= estartdate && momentenddate >= estartdate) ||
                  (momentstartdate <= eenddate && momentenddate >= eenddate) ||
                  (estartdate <= momentstartdate && eenddate >= momentstartdate) ||
                  (estartdate <= momentenddate && eenddate >= momentenddate)
                ) {
                  enrollmentStartYear.studyTracks[e.code] = {
                    type: e.type,
                    name: e.name,
                    code: e.code
                  }
                  if (!associations.programmes[code].studytracks.includes(e.code))
                    associations.programmes[code].studytracks.push(e.code)
                }
                associations.studyTracks[e.code] = associations.studyTracks[e.code] || {
                  type: e.type,
                  name: e.name,
                  code: e.code,
                  programmes: {}
                }
                associations.studyTracks[e.code].programmes[code] = {
                  type: type,
                  name: name,
                  code: code
                }
              }
            })
        }
      })
    })
    offset += chunksize
  }
  return associations
}

const saveAssociationsToRedis = async associations => {
  await redisClient.setAsync(REDIS_KEY, JSON.stringify(associations))
}

const getAssociationsFromRedis = async () => {
  const raw = await redisClient.getAsync(REDIS_KEY)
  return raw && JSON.parse(raw)
}

const refreshAssociationsInRedis = async () => {
  const associations = await calculateAssociationsFromDb()
  await saveAssociationsToRedis(associations)
}

const getAssociations = async (doRefresh = false) => {
  const studyrights = await getAssociationsFromRedis()
  if (!studyrights || doRefresh) {
    const associations = await calculateAssociationsFromDb()
    await saveAssociationsToRedis(associations)
    return associations
  } else {
    return studyrights
  }
}

const getFilteredAssociations = async codes => {
  console.log(codes)
  const associations = await getAssociations()
  associations.programmes = _.pick(associations.programmes, codes)

  const degrees = []
  const studyTracks = []
  Object.keys(associations.programmes).forEach(k => {
    Object.keys(associations.programmes[k].enrollmentStartYears).forEach(year => {
      const yearData = associations.programmes[k].enrollmentStartYears[year]
      degrees.push(...Object.keys(yearData.degrees))
      studyTracks.push(...Object.keys(yearData.studyTracks))
    })
  })
  associations.degrees = _.pick(associations.degrees, degrees)
  Object.keys(associations.degrees).forEach(k => {
    associations.degrees[k].programmes = _.pick(associations.degrees[k].programmes, codes)
  })
  associations.studyTracks = _.pick(associations.studyTracks, studyTracks)
  Object.keys(associations.studyTracks).forEach(k => {
    associations.studyTracks[k].programmes = _.pick(associations.studyTracks[k].programmes, codes)
  })
  return associations
}

const getUserAssociations = async userid => {
  const codes = await getUserElementDetails(userid)
  const associations = await getFilteredAssociations(codes)
  return associations
}

module.exports = {
  byStudent,
  createStudyright,
  studentNumbersWithAllStudyRightElements,
  getAssociatedStudyrights,
  getAllStudyrightElementsAndAssociations,
  getStudyrightElementsAndAssociationsForUser,
  getAllDegreesAndProgrammes,
  getAssociations,
  getFilteredAssociations,
  getUserAssociations,
  refreshAssociationsInRedis,
  getAllProgrammes,
  getAllElementDetails,
  nonGraduatedStudentsOfElementDetail
}
