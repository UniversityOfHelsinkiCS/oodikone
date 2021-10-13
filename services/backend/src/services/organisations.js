const Sequelize = require('sequelize')
const { Organization, ProgrammeModule } = require('../models')
const Op = Sequelize.Op
const { dbConnections } = require('../database/connection')

// temp refactoring faculty <-> userservice mappings away from userservice
const facultiesAndProgrammesInUserService = [
  ['H10', 'MH10_001'],
  ['H10', 'MH40_011'],
  ['H10', 'KH10_001'],
  ['H20', 'KH20_001'],
  ['H20', 'MH20_001'],
  ['H20', 'MH20_002'],
  ['H30', 'KH30_001'],
  ['H30', 'KH30_002'],
  ['H30', 'MH30_002'],
  ['H30', 'MH30_003'],
  ['H30', 'MH30_004'],
  ['H30', 'MH30_005'],
  ['H30', 'MH30_001'],
  ['H40', 'KH40_001'],
  ['H40', 'KH40_002'],
  ['H40', 'KH40_003'],
  ['H40', 'KH40_004'],
  ['H40', 'KH40_005'],
  ['H40', 'KH40_006'],
  ['H40', 'MH40_001'],
  ['H40', 'MH40_002'],
  ['H40', 'MH40_003'],
  ['H40', 'MH40_004'],
  ['H40', 'MH40_005'],
  ['H40', 'MH40_006'],
  ['H40', 'MH40_007'],
  ['H40', 'MH40_008'],
  ['H40', 'MH40_009'],
  ['H40', 'MH40_010'],
  ['H40', 'MH40_011'],
  ['H40', 'MH40_012'],
  ['H40', 'MH40_013'],
  ['H40', 'MH40_014'],
  ['H40', 'MH40_015'],
  ['H40', 'MH70_001'],
  ['H40', 'MH70_006'],
  ['H50', 'KH50_001'],
  ['H50', 'KH50_002'],
  ['H50', 'KH50_003'],
  ['H50', 'KH50_004'],
  ['H50', 'KH50_005'],
  ['H50', 'KH50_006'],
  ['H50', 'KH50_007'],
  ['H50', 'MH50_001'],
  ['H50', 'MH50_002'],
  ['H50', 'MH50_003'],
  ['H50', 'MH50_004'],
  ['H50', 'MH50_005'],
  ['H50', 'MH50_006'],
  ['H50', 'MH50_007'],
  ['H50', 'MH50_008'],
  ['H50', 'MH50_009'],
  ['H50', 'MH50_010'],
  ['H50', 'MH50_011'],
  ['H50', 'MH50_012'],
  ['H50', 'MH50_013'],
  ['H55', 'KH55_001'],
  ['H55', 'MH55_001'],
  ['H57', 'KH57_001'],
  ['H57', 'KH57_002'],
  ['H57', 'KH57_003'],
  ['H57', 'MH50_002'],
  ['H57', 'MH50_013'],
  ['H57', 'MH57_001'],
  ['H57', 'MH57_002'],
  ['H57', 'MH57_003'],
  ['H57', 'MH57_004'],
  ['H57', 'MH57_005'],
  ['H57', 'MH80_007'],
  ['H60', 'KH60_001'],
  ['H60', 'MH60_001'],
  ['H70', 'KH40_001'],
  ['H70', 'KH50_001'],
  ['H70', 'KH70_001'],
  ['H70', 'KH70_002'],
  ['H70', 'KH70_003'],
  ['H70', 'KH70_004'],
  ['H70', 'MH50_001'],
  ['H70', 'MH57_005'],
  ['H70', 'MH70_001'],
  ['H70', 'MH70_002'],
  ['H70', 'MH70_003'],
  ['H70', 'MH70_004'],
  ['H70', 'MH70_005'],
  ['H70', 'MH70_006'],
  ['H70', 'MH70_007'],
  ['H70', 'MH70_008'],
  ['H70', 'MH70_009'],
  ['H70', 'MH70_010'],
  ['H74', 'KH74_001'],
  ['H80', 'KH57_002'],
  ['H80', 'KH80_001'],
  ['H80', 'KH80_002'],
  ['H80', 'KH80_003'],
  ['H80', 'KH80_004'],
  ['H80', 'MH57_002'],
  ['H80', 'MH57_003'],
  ['H80', 'MH57_005'],
  ['H80', 'MH80_001'],
  ['H80', 'MH80_002'],
  ['H80', 'MH80_003'],
  ['H80', 'MH80_004'],
  ['H80', 'MH80_005'],
  ['H80', 'MH80_006'],
  ['H80', 'MH80_007'],
  ['H90', 'KH90_001'],
  ['H30', '447000'],
  ['H30', '447001'],
  ['H30', '447002'],
  ['H60', 'EDUK730'],
  ['H60', 'K-MUUT-ERIL'],
  ['H60', 'ED400'],
  ['H60', 'ED200'],
  ['H60', 'ED700'],
  ['H60', 'ED100'],
  ['H60', 'ED300'],
  ['H60', 'ED600'],
  ['H60', '8009'],
  ['H60', '8118'],
  ['H60', '8600'],
  ['H60', 'DUK-PED'],
  ['H60', '65'],
  ['H60', '1102'],
  ['H60', '20018'],
  ['H60', '8601'],
  ['H60', '9290'],
  ['H60', '8172'],
  ['H60', '83600'],
  ['H60', 'DUM-PED'],
  ['H60', 'ED500'],
  ['H60', '83601'],
  ['H60', '0130'],
  ['H60', '20005-e'],
  ['H60', '1040'],
  ['H60', '8703'],
  ['H60', '0005'],
  ['H60', '7900'],
  ['H60', '0152 '],
  ['H90', 'MH90_001'],
]

const facultiesAndProgrammesForTrends = facultiesAndProgrammesInUserService.map(f => ({
  faculty_code: f[0],
  programme_code: f[1],
}))

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

const degreeProgrammeCodesOfFaculty = async facultyCode =>
  (
    await ProgrammeModule.findAll({
      attributes: ['code'],
      include: {
        model: Organization,
        where: {
          code: facultyCode,
        },
      },
    })
  ).map(({ code }) => code)

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
  degreeProgrammeCodesOfFaculty,
  isFaculty,
  providersOfFaculty,
  facultiesAndProgrammesForTrends,
}
