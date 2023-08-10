const {
  dbConnections: { sequelize },
} = require('../database/connection')
const { Studyright, StudyrightElement, ElementDetail, Transfer } = require('../models')
const moment = require('moment')
const { redisClient } = require('../services/redis')
const _ = require('lodash')
const { Op, col, where, fn } = require('sequelize')
const REDIS_KEY = 'STUDYRIGHT_ASSOCIATIONS_V2'

const byStudent = studentNumber => {
  return Studyright.findAll({
    where: {
      student_studentnumber: {
        [Op.eq]: studentNumber,
      },
    },
  })
}

const studentNumbersWithAllStudyRightElements = async (codes, startedAfter, startedBefore) => {
  const studyrights = await StudyrightElement.findAll({
    attributes: ['studentnumber'],
    where: {
      code: {
        [Op.in]: codes,
      },
      startdate: {
        [Op.between]: [startedAfter, startedBefore],
      },
    },
    group: [col('studentnumber')],
    having: where(fn('count', fn('distinct', col('code'))), {
      [Op.eq]: codes.length,
    }),
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
      replacements: { elementcodes },
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
      type: sequelize.QueryTypes.SELECT,
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
    associations: associations && associations[element.code],
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

const getAllProgrammes = async () => {
  const elementDetails = ElementDetail.findAll({
    where: {
      type: {
        [Op.in]: [20],
      },
    },
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
        attributes: ['type', 'name', 'code'],
      },
    },
    order: [['studyrightid', 'DESC']],
    // ^Use order when chunking with offset & limit,
    // otherwise results are random and there will be misses
    limit,
    offset,
  })
  const groupings = studyrights.map(({ studyright_elements: sres }) =>
    sres.map(sre => ({
      ...sre.element_detail.get(),
      studyrightid: sre.get().studyrightid,
      startdate: sre.get().startdate,
      enddate: sre.get().enddate,
    }))
  )
  return groupings
}

const StudyRightType = {
  PROGRAMME: 20,
  STUDYTRACK: 30,
}

const calculateAssociationsFromDb = async (chunksize = 100000) => {
  const transfers = await Transfer.findAll({
    attributes: ['studyrightid'],
  })
  const transferedStudyrightIds = transfers.map(transfer => transfer.studyrightid)
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
  const types = new Set([StudyRightType.PROGRAMME, StudyRightType.STUDYTRACK])
  const isValid = ({ type }) => types.has(type)
  const associations = { programmes: {}, studyTracks: {} }
  while (offset <= total) {
    const elementgroups = await associatedStudyrightElements(offset, chunksize)
    elementgroups.forEach(fullgroup => {
      const group = fullgroup.filter(isValid)
      group.forEach(({ type, code, name, studyrightid, startdate, enddate }) => {
        if (type === StudyRightType.STUDYTRACK) {
          associations.studyTracks[code] = associations.studyTracks[code] || {
            type,
            name,
            code,
            programmes: {},
          }
        } else if (type === StudyRightType.PROGRAMME) {
          associations.programmes[code] = associations.programmes[code] || {
            type: type,
            name: name,
            code: code,
            enrollmentStartYears: {},
            studytracks: [],
          }
          const momentstartdate = moment(startdate)
          const enrollment = momentstartdate.isValid() ? getEnrollmentStartYear(momentstartdate) : null
          const enrollmentStartYears = associations.programmes[code].enrollmentStartYears
          if (!enrollmentStartYears[enrollment])
            enrollmentStartYears[enrollment] = {
              studyTracks: {},
            }
          const enrollmentStartYear = enrollmentStartYears[enrollment]

          group
            .filter(e => e.studyrightid === studyrightid && e.code !== code)
            .forEach(e => {
              if (e.type === StudyRightType.STUDYTRACK) {
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
                    code: e.code,
                  }
                  if (
                    !associations.programmes[code].studytracks.includes(e.code) &&
                    !transferedStudyrightIds.includes(e.studyrightid)
                  ) {
                    associations.programmes[code].studytracks.push(e.code)
                  }
                }
                associations.studyTracks[e.code] = associations.studyTracks[e.code] || {
                  type: e.type,
                  name: e.name,
                  code: e.code,
                  programmes: {},
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
  const associations = await getAssociations()
  associations.programmes = _.pick(associations.programmes, codes)

  const studyTracks = []
  Object.keys(associations.programmes).forEach(k => {
    Object.keys(associations.programmes[k].enrollmentStartYears).forEach(year => {
      const yearData = associations.programmes[k].enrollmentStartYears[year]
      studyTracks.push(...Object.keys(yearData.studyTracks))
    })
  })
  associations.studyTracks = _.pick(associations.studyTracks, studyTracks)
  Object.keys(associations.studyTracks).forEach(k => {
    associations.studyTracks[k].programmes = _.pick(associations.studyTracks[k].programmes, codes)
  })
  return associations
}

module.exports = {
  byStudent,
  studentNumbersWithAllStudyRightElements,
  getAssociatedStudyrights,
  getAllStudyrightElementsAndAssociations,
  getAssociations,
  getFilteredAssociations,
  refreshAssociationsInRedis,
  getAllProgrammes,
  getAllElementDetails,
}
