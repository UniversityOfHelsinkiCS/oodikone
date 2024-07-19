import { Op, QueryTypes } from 'sequelize'

import { facultyCodes } from '../config/organizationConstants'
import { dbConnections } from '../database/connection'
import { Organization } from '../models'

export const getOrganizations = () => {
  return Organization.findAll({
    where: {
      code: {
        [Op.in]: facultyCodes,
      },
    },
  })
}

export const getProvidersOfFaculty = async (facultyCode: string) => {
  const results: Array<{ code: string }> = await dbConnections.sequelize.query(
    `SELECT childOrg.code
     FROM organization parentOrg
     INNER JOIN organization childOrg 
     ON childOrg.parent_id = parentOrg.id
     WHERE parentOrg.code = ?`,
    {
      replacements: [facultyCode],
      type: QueryTypes.SELECT,
    }
  )
  return results.map(({ code }) => code)
}

export const isFaculty = (facultyCode: string) => facultyCodes.includes(facultyCode)
