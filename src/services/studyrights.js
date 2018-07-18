const { Studyright, StudyrightElement, sequelize } = require('../models')
const { Op, col, where, fn } = sequelize
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

const getAssociatedStudyrights = async () => {
  const raw = `
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
  `
  const [ queryResult ] = await sequelize.query(raw, sequelize.QueryTypes.SELECT)
  const results = queryResult.reduce((mappings, result) => {
    const { associations } = result
    associations.forEach(code => {
      const codes = mappings[code] || []
      mappings[code] = codes.concat(associations)
    })
    return mappings
  }, {})
  Object.keys(results).forEach(code => {
    results[code] = _.uniq(results[code])
  })
  return results
}

module.exports = {
  byStudent, createStudyright, ofPopulations, studentNumbersWithAllStudyRightElements, getAssociatedStudyrights
}