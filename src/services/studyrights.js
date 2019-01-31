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
  const getSemester = startdate => {
    const month = moment(startdate).month()+1
    if (month >= 1 && month < 8) return 'SPRING'
    return 'FALL'
  }
  const getEnrollmentStartYear = startdate => {
    if (getSemester(startdate) == 'SPRING') return moment(startdate).year() - 1
    return moment(startdate).year()
  }
  const total = await Studyright.count()
  let offset = 0
  const types = new Set([10, 20, 30]) // degree, programme, studytrack
  const isValid = ({ type }) => types.has(type)
  const programmes = {}
  while(offset <= total) {
    console.log(`${offset}/${total}`)
    const elementgroups = await associatedStudyrightElements(offset, chunksize)
    elementgroups
      .forEach(fullgroup => {
        const group = fullgroup.filter(isValid)
        group.filter(isValid).forEach(({ type, code, name, studyrightid, startdate, enddate }) => {
          if (type != 20) {
            return
          }
          programmes[code] = programmes[code] || {
            type: type,
            name: name,
            code: code,
            enrollmentStartYears: {}
          }
          const enrollment = getEnrollmentStartYear(startdate)
          const enrollmentStartYears = programmes[code].enrollmentStartYears
          enrollmentStartYears[enrollment] = enrollmentStartYears[enrollment] || {
            degrees: {},
            studyTracks: {}
          }
          const enrollmentStartYear = enrollmentStartYears[enrollment]
          
          group.filter(e => e.studyrightid === studyrightid).filter(e => e.code !== code).forEach(e => {
            if (e.type == 10) {
              enrollmentStartYear.degrees[e.code] = { type: e.type, name: e.name, code: e.code }
            }
            if (e.type == 30) {
              if (moment(startdate) <= moment(e.startdate) && moment(enddate) >= moment(e.startdate) ||
                moment(e.startdate) <= moment(startdate) && moment(e.enddate) >= moment(startdate)) {
                enrollmentStartYear.studyTracks[e.code] = { type: e.type, name: e.name, code: e.code }
              }
            }
          })
        })
      })
    offset += chunksize
  }
  return programmes
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
  const filtered = {}
  const all = await getAssociations()
  Object.entries(all).forEach(([t, courses]) => {
    const picked = _.pick(courses, codes)
    const type = (filtered[t] = {})
    Object.entries(picked).map(([coursecode, course]) => {
      const associations = {}
      Object.entries(course.associations).forEach(([atype, acourses]) => {
        associations[atype] = _.pick(acourses, codes)
      })
      type[coursecode] = { ...course, associations }
    })
  })
  return filtered
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
  refreshAssociationsInRedis
}