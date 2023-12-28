const { Op } = require('sequelize')
const {
  Credit,
  Student,
  Semester,
  Studyright,
  Organization,
  StudyrightElement,
  ElementDetail,
  Enrollment,
} = require('../../models')

const creditsForCourses = async (codes, anonymizationSalt, unification) => {
  let is_open = false

  if (unification === 'open') is_open = true

  if (unification === 'unify') {
    is_open = {
      [Op.in]: [false, true],
    }
  }

  return await Credit.findAll({
    include: [
      {
        model: Student,
        attributes: ['studentnumber'],
      },
      {
        model: Semester,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
        where: {
          startdate: {
            [Op.lte]: new Date(),
          },
        },
      },
    ],
    where: {
      course_code: {
        [Op.in]: codes,
      },
      student_studentnumber: {
        [Op.ne]: null,
      },
      [Op.or]: [{ is_open }, { is_open: null }],
    },
    order: [['attainment_date', 'ASC']],
  })
}

const getStudentNumberToSrElementsMap = async studentNumbers => {
  const studyrights = await Studyright.findAll({
    attributes: ['prioritycode', 'faculty_code', 'student_studentnumber', 'studyrightid'],
    where: {
      prioritycode: {
        [Op.eq]: 1,
      },
      student_studentnumber: { [Op.in]: studentNumbers },
    },
    include: {
      model: Organization,
    },
  })

  const studyrightMap = studyrights.reduce((obj, cur) => {
    obj[cur.studyrightid] = cur
    return obj
  }, {})

  const studyrightIds = Object.keys(studyrightMap)

  const studyrightElements = await StudyrightElement.findAll({
    attributes: ['code', 'startdate', 'studentnumber', 'studyrightid'],
    include: [
      {
        model: ElementDetail,
        attributes: ['name', 'type'],
        where: {
          type: {
            [Op.eq]: 20,
          },
        },
      },
    ],
    where: { studyrightid: { [Op.in]: studyrightIds } },
  })

  return studyrightElements.reduce((obj, cur) => {
    if (!obj[cur.studentnumber]) obj[cur.studentnumber] = []
    cur.studyright = studyrightMap[cur.studyrightid]
    obj[cur.studentnumber].push(cur)
    return obj
  }, {})
}

const enrollmentsForCourses = async (codes, unification) => {
  let is_open = false

  if (unification === 'open') is_open = true

  if (unification === 'unify') {
    is_open = {
      [Op.in]: [false, true],
    }
  }

  return await Enrollment.findAll({
    include: [
      {
        model: Student,
        attributes: ['studentnumber'],
      },
      {
        model: Semester,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
        where: {
          startdate: {
            [Op.lte]: new Date(),
          },
        },
      },
    ],
    where: {
      course_code: {
        [Op.in]: codes,
      },
      studentnumber: {
        [Op.ne]: null,
      },
      enrollment_date_time: { [Op.gte]: new Date('2021-05-31') },
      state: ['ENROLLED', 'CONFIRMED'],
      [Op.or]: [{ is_open }, { is_open: null }],
    },
  })
}

module.exports = {
  getStudentNumberToSrElementsMap,
  enrollmentsForCourses,
  creditsForCourses,
}
