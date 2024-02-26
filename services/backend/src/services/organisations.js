const { Op } = require('sequelize')
const { Organization } = require('../models')
const { dbConnections } = require('../database/connection')

// Have facultyfetching to work like it worked during oodi-db time
const facultiesInOodi = [
  'H10',
  'H20',
  'H30',
  'H40',
  'H50',
  'H55',
  'H57',
  'H60',
  'H70',
  'H74',
  'H80',
  'H90',
  'H92',
  'H930',
  'H99',
  'Y',
  'Y01',
]

const faculties = () => {
  return Organization.findAll({
    where: {
      code: {
        [Op.in]: facultiesInOodi,
      },
    },
  })
}

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

const isFaculty = facultyCode => facultiesInOodi.includes(facultyCode)

module.exports = {
  faculties,
  isFaculty,
  providersOfFaculty,
}
