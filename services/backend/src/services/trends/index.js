const {
  dbConnections: { sequelize },
} = require('../../database/connection')

// TODO: change getStatus -> getStatusAttainments
const { getStatus, refreshStatus } = require('./statusAttainments')
// TODO: change getGraduatedStatus -> getStatusGraduated
const { getGraduatedStatus, refreshStatusGraduated } = require('./statusGraduated')
const { getProtoC, getProtoCProgramme } = require('./protoC')
const { getUber, refreshUber } = require('./uber')

const STUDYRIGHT_START_DATE = '2017-07-31 21:00:00+00'
const CURRENT_DATE = new Date()

const withErr = handler => (req, res, next) =>
  handler(req, res, next).catch(e => {
    res.status(500).json({ error: { message: e.message, stack: e.stack } })
  })

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
      replacements: { startDate: STUDYRIGHT_START_DATE, currentDate: CURRENT_DATE },
    }
  )
}

module.exports = {
  getGraduatedStatus,
  getProtoC,
  getProtoCProgramme,
  getStatus,
  getUber,
  refreshStatus,
  refreshStatusGraduated,
  refreshUber,
  withErr,
  getStartYears,
}
