const { Op } = require('sequelize')

const { dbConnections } = require('../database/connection')
const { Organization } = require('../models')

const facultyParentIds = ['hy-org-2024-03-27-1', 'hy-org-2024-03-27-5']

const faculties = () =>
  Organization.findAll({
    attributes: ['id', 'code', 'name'],
    where: {
      parent_id: {
        [Op.in]: facultyParentIds,
      },
    },
  })

const providersOfFaculty = async facultyCode => {
  const [result] = await dbConnections.sequelize.query(
    `SELECT childOrg.code
     FROM organization parentOrg
     INNER JOIN organization childOrg 
     ON childOrg.parent_id = parentOrg.id
     WHERE parentOrg.code = ?`,
    { replacements: [facultyCode] }
  )
  return result.map(({ code }) => code)
}

const isFaculty = async facultyCode => (await faculties()).some(faculty => faculty.code === facultyCode)

module.exports = {
  faculties,
  isFaculty,
  providersOfFaculty,
}
