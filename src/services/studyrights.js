const { Studyright, StudyrightElement, sequelize, ElementDetails } = require('../models')
const { Op, col, where, fn } = sequelize
const { getUserElementDetails } = require('./userService')
const moment = require('moment')
const { redisClient } = require('./redis')
const _ = require('lodash')

const createStudyright = apiData => Studyright.create(apiData)

const REDIS_KEY = 'STUDYRIGHT_ASSOCIATIONS'

const byStudent = (studentNumber) => {
  return Studyright.findAll({
    where: {
      student_studentnumber: {
        [Op.eq]: studentNumber
      }
    }
  })
}

const ofPopulations = (conf) => {

  const studyrightRules = conf.units.map(sr => ({ [Op.eq]: sr.name }))

  return Studyright.findAll({
    where: {
      highlevelname: {
        [Op.or]: studyrightRules
      },
      prioritycode: {
        [Op.or]: [1, 30]
      },
      studystartdate: {
        [Op.between]: [conf.enrollmentDates.startDate, conf.enrollmentDates.endDate]
      }
    }
  })
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
    group:[
      col('studentnumber')
    ],
    having: where(
      fn('count', fn('distinct', col('code'))),
      {
        [Op.eq]: codes.length
      }
    ),
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

const uniqueStudyrightCodeArrays = elementcodes => sequelize.query(`
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
})

const allUniqueStudyrightCodeArrays = () => sequelize.query(`
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
})

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

const formatStudyrightElements = (elements, associations) => elements.map(element => ({
  id: element.code,
  name: element.name,
  enabled: true,
  type: element.type,
  associations: associations && associations[element.code]
}))

const getAllStudyrightElementsAndAssociations = async () => {
  let studyrightElements = await redisClient.getAsync('studyrightElements')
  if (!studyrightElements) {
    const [ associations, studyrightelements ] = await Promise.all([ getAssociatedStudyrights(),
      ElementDetails.findAll() ])
    await redisClient.setAsync('studyrightElements', JSON.stringify(formatStudyrightElements(studyrightelements,
      associations)))
    studyrightElements = await redisClient.getAsync('studyrightElements')
  }
  return JSON.parse(studyrightElements)
}

const getStudyrightElementsAndAssociationsForUser = async username => {
  const studyrightelements = await getUserElementDetails(username)
  if (studyrightelements.length === 0) {
    return []
  }
  const associations = await getAssociatedStudyrights(studyrightelements.map(element => element.code))
  return formatStudyrightElements(studyrightelements, associations)
}

const getAllDegreesAndProgrammes = async () => {
  const elementDetails = ElementDetails.findAll({
    where: {
      type: {
        [Op.in]: [10, 20]
      }
    }
  })
  return formatStudyrightElements(elementDetails)
}

const getAllProgrammes = async () => {
  const elementDetails = ElementDetails.findAll({
    where: {
      type: {
        [Op.in]: [20]
      }
    }
  })
  return elementDetails
}

const associatedStudyrightElements = async (offset, limit) => {
  const studyrights = await Studyright.findAll({
    attributes: [],
    include: {
      model: StudyrightElement,
      attributes: ['studyrightid', 'startdate', 'enddate'],
      include: {
        model: ElementDetails,
        attributes: ['type', 'name', 'code'],
      },
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

const calculateAssociationsFromDb = async (chunksize=100000) => {
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
  const types = new Set([10, 20, 30]) // degree, programme, studytrack
  const isValid = ({ type }) => types.has(type)
  const associations = { programmes: {},  degrees: {},  studyTracks: {}}
  while(offset <= total) {
    console.log(`${offset}/${total}`)
    const elementgroups = await associatedStudyrightElements(offset, chunksize)
    elementgroups
      .forEach(fullgroup => {
        const group = fullgroup.filter(isValid)
        group.forEach(({ type, code, name, studyrightid, startdate, enddate }) => {
          if (type === 10) {
            associations.degrees[code] = associations.degrees[code] || {
              type, name, code, programmes: {}
            }
          }
          if (type === 30) {
            associations.studyTracks[code] = associations.studyTracks[code] || {
              type, name, code, programmes: {}
            }
          }
          if (type === 20) {
            associations.programmes[code] = associations.programmes[code] || {
              type: type,
              name: name,
              code: code,
              enrollmentStartYears: {}
            }
            const momentstartdate = moment(startdate)
            const enrollment = getEnrollmentStartYear(momentstartdate)
            const enrollmentStartYears = associations.programmes[code].enrollmentStartYears
            enrollmentStartYears[enrollment] = enrollmentStartYears[enrollment] || {
              degrees: {},
              studyTracks: {}
            }
            const enrollmentStartYear = enrollmentStartYears[enrollment]

            group.filter(e => e.studyrightid === studyrightid && e.code !== code).forEach(e => {
              if (e.type == 10) {
                enrollmentStartYear.degrees[e.code] = {
                  type: e.type, name: e.name, code: e.code
                }
                associations.degrees[e.code] = associations.degrees[e.code] || {
                  type: e.type, name: e.name, code: e.code, programmes: {}
                }
                associations.degrees[e.code].programmes[code] = {
                  type: type,
                  name: name,
                  code: code,
                }
              }
              if (e.type == 30) {
                const momentenddate = moment(enddate)
                const estartdate = moment(e.startdate)
                const eenddate = moment(e.enddate)
                // check that programme and studytrack time ranges overlap
                if ((momentstartdate <= estartdate && momentenddate >= estartdate) ||
                    (momentstartdate <= eenddate && momentenddate >= eenddate) ||
                    (estartdate <= momentstartdate && eenddate >= momentstartdate) ||
                    (estartdate <= momentenddate && eenddate >= momentenddate)) {
                  enrollmentStartYear.studyTracks[e.code] = {
                    type: e.type, name: e.name, code: e.code
                  }
                }
                associations.studyTracks[e.code] = associations.studyTracks[e.code] || {
                  type: e.type, name: e.name, code: e.code, programmes: {}
                }
                associations.studyTracks[e.code].programmes[code] = {
                  type: type,
                  name: name,
                  code: code,
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

const getAssociations = async (doRefresh=false) => {
  const studyrights = await getAssociationsFromRedis()
  if (!studyrights || doRefresh) {
    const associations = await calculateAssociationsFromDb()
    await saveAssociationsToRedis(associations)
    return associations
  } else {
    return studyrights
  }
}

const getFilteredAssociations = async (codes) => {
  console.log(codes)
  const associations = await getAssociations()
  associations.programmes = _.pick(associations.programmes, codes)
  Object.keys(associations.programmes).forEach(k => {
    Object.keys(associations.programmes[k].enrollmentStartYears).forEach(year => {
      const yearData = associations.programmes[k].enrollmentStartYears[year]
      yearData.degrees = _.pick(yearData.degrees, codes)
      yearData.studyTracks = _.pick(yearData.studyTracks, codes)
    })
  })
  associations.degrees = _.pick(associations.degrees, codes)
  Object.keys(associations.degrees).forEach(k => {
    associations.degrees[k].programmes = _.pick(associations.degrees[k].programmes, codes)
  })
  associations.studyTracks = _.pick(associations.studyTracks, codes)
  Object.keys(associations.studyTracks).forEach(k => {
    associations.studyTracks[k].programmes = _.pick(associations.studyTracks[k].programmes, codes)
  })
  return associations
}

const getUserAssociations = async (userid) => {
  const elements = await getUserElementDetails(userid)
  const codes = elements.map(e => e.code)
  const associations = await getFilteredAssociations(codes)
  return associations
}


module.exports = {
  byStudent,
  createStudyright,
  ofPopulations,
  studentNumbersWithAllStudyRightElements,
  getAssociatedStudyrights,
  getAllStudyrightElementsAndAssociations,
  getStudyrightElementsAndAssociationsForUser,
  getAllDegreesAndProgrammes,
  getAssociations,
  getFilteredAssociations,
  getUserAssociations,
  refreshAssociationsInRedis,
  getAllProgrammes
}