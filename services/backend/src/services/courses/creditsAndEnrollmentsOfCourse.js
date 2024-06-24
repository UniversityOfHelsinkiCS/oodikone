const { Op } = require('sequelize')

const {
  Credit,
  Student,
  Semester,
  Organization,
  Enrollment,
  SISStudyRight,
  SISStudyRightElement,
} = require('../../models')

const creditsForCourses = async (codes, unification) => {
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
  const studyRights = await SISStudyRight.findAll({
    attributes: ['facultyCode', 'id', 'studentNumber'],
    where: {
      studentNumber: {
        [Op.in]: studentNumbers,
      },
    },
    include: {
      model: Organization,
      attributes: ['name', 'code'],
    },
  })

  const studyRightMap = studyRights.reduce((obj, cur) => {
    obj[cur.id] = cur.toJSON()
    return obj
  }, {})

  const studyRightIds = Object.keys(studyRightMap)

  const studyRightElements = await SISStudyRightElement.findAll({
    attributes: ['code', 'name', 'startDate', 'studyRightId'],
    where: {
      studyRightId: {
        [Op.in]: studyRightIds,
      },
    },
  })

  return studyRightElements.reduce((obj, cur) => {
    const studyRight = studyRightMap[cur.studyRightId]
    const { studentNumber } = studyRight
    if (!obj[studentNumber]) obj[studentNumber] = []
    obj[studentNumber].push({ ...cur.toJSON(), studyRight })
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
