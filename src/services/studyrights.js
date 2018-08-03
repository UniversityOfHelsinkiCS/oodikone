const { Studyright, StudyrightElement, sequelize, ElementDetails } = require('../models')
const { Op, col, where, fn } = sequelize
const { getUserElementDetails } = require('./users')
const _ = require('lodash')

const createStudyright = apiData => Studyright.create(apiData)

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
  ;
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
  ;
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
  const [ associations, studyrightelements ] = await Promise.all([ getAssociatedStudyrights(), ElementDetails.findAll() ])
  return formatStudyrightElements(studyrightelements, associations)
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

module.exports = {
  byStudent,
  createStudyright,
  ofPopulations,
  studentNumbersWithAllStudyRightElements,
  getAssociatedStudyrights,
  getAllStudyrightElementsAndAssociations,
  getStudyrightElementsAndAssociationsForUser,
  getAllDegreesAndProgrammes
}