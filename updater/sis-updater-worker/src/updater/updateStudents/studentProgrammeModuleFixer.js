const { StudyrightElement, Credit, Course, Transfer } = require('../../db/models')
const { Op } = require('sequelize')
const { selectFromByIds } = require('../../db')

const getCodesToFix = async () => {
  const codes = await StudyrightElement.findAll({
    where: {
      code: {
        [Op.or]: [
          {
            [Op.startsWith]: '2_KH',
          },
          { [Op.startsWith]: '2_MH' },
        ],
      },
    },
    attributes: ['code'],
  })
  return codes.map(({ code }) => code)
}

const cleanTransfers = studentNumbers =>
  Transfer.destroy({
    where: {
      studentnumber: studentNumbers,
      [Op.or]: [
        {
          sourcecode: { [Op.startsWith]: '2_KH' },
        },
        {
          sourcecode: { [Op.startsWith]: '2_MH' },
        },
        {
          targetcode: { [Op.startsWith]: '2_KH' },
        },
        {
          targetcode: { [Op.startsWith]: '2_MH' },
        },
      ],
    },
  })

/**
 * Fix references on duplicate study programmes. Codes like 2_MH* or 2_KH* in
 * study rights and degree programme attainments will be converted to the main code.
 */
const fix = async students => {
  const codes = await getCodesToFix()
  if (!codes || !codes.length) return false
  const studentsToFix = await selectFromByIds('persons', students)
  const studentNumbers = studentsToFix.map(s => s.student_number)

  const [elements, credits, courses] = await Promise.all([
    StudyrightElement.findAll({
      where: {
        code: codes,
        studentnumber: studentNumbers,
      },
    }),
    Credit.findAll({
      where: {
        course_code: codes,
        student_studentnumber: studentNumbers,
      },
    }),
    Course.findAll({
      where: {
        code: codes.map(code => code.replace('2_', '')),
      },
      attributes: ['id', 'code'],
      raw: true,
    }),
  ])

  const duplicateCodeToAcualCourseId = courses.reduce((acc, cur) => {
    acc[`2_${cur.code}`] = cur.id
    return acc
  }, {})

  await Promise.all([
    ...elements.map(element => {
      element.code = element.code.replace('2_', '')
      return element.save()
    }),
    ...credits.map(credit => {
      credit.course_id = duplicateCodeToAcualCourseId[credit.course_code]
      credit.course_code = credit.course_code.replace('2_', '')
      return credit.save()
    }),
    cleanTransfers(studentNumbers),
  ])
  return true
}

module.exports = fix
