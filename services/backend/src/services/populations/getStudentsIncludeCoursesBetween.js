const { Op } = require('sequelize')
const { Tag, TagStudent } = require('../../models/models_kone')
const {
  Studyplan,
  Course,
  Credit,
  Enrollment,
  Student,
  Transfer,
  Studyright,
  StudyrightElement,
  ElementDetail,
  SemesterEnrollment,
  Semester,
  StudyrightExtent,
} = require('../../models')
const moment = require('moment')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')

const getStudentsIncludeCoursesBetween = async (studentnumbers, startDate, endDate, studyright, tag) => {
  const studentTags = await TagStudent.findAll({
    attributes: ['tag_id', 'studentnumber'],
    include: [
      {
        model: Tag,
        attributes: ['tag_id', 'tagname', 'personal_user_id'],
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  const { studentnumbersWithTag, studentNumberToTags } = studentTags.reduce(
    (acc, t) => {
      acc.studentNumberToTags[t.studentnumber] = acc.studentNumberToTags[t.studentnumber] || []
      acc.studentNumberToTags[t.studentnumber].push(t)
      if (tag && t.tag_id === tag.tag_id) {
        acc.studentnumbersWithTag.push(t.studentnumber)
      }
      return acc
    },
    { studentnumbersWithTag: [], studentNumberToTags: {} }
  )
  if (tag) studentnumbers = studentnumbersWithTag

  const attainmentDateFrom = tag ? moment(startDate).year(tag.year) : startDate
  const studyPlans = await Studyplan.findAll({
    where: { studentnumber: studentnumbers },
    attributes: ['included_courses'],
    raw: true,
  })
  const studyPlanCourses = Array.from(new Set([...studyPlans.map(plan => plan.included_courses)].flat()))

  const creditsOfStudentOther = {
    [Op.or]: [
      {
        attainment_date: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
      },
      {
        course_code: studyPlanCourses,
      },
    ],
    student_studentnumber: {
      [Op.in]: studentnumbers,
    },
  }

  // takes into accout possible progress tests taken earlier than the start date
  const creditsOfStudentLaakis = {
    student_studentnumber: {
      [Op.in]: studentnumbers,
    },
    [Op.or]: [
      {
        attainment_date: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
      },
      {
        course_code: {
          [Op.in]: ['375063', '339101'].concat(studyPlanCourses),
        },
      },
    ],
  }

  const creditsOfStudent = ['320001', 'MH30_001'].includes(studyright[0])
    ? creditsOfStudentLaakis
    : creditsOfStudentOther

  if (studentnumbers.length === 0)
    return { students: [], enrollments: [], credits: [], extents: [], semesters: [], elementdetails: [], courses: [] }

  const [courses, enrollments, students, credits, extents, semesters, elementdetails] = await Promise.all([
    Course.findAll({
      attributes: [sequelize.literal('DISTINCT ON("code") code'), 'name', 'coursetypecode'],
      include: [
        {
          model: Credit,
          attributes: [],
          where: creditsOfStudent,
        },
      ],
      raw: true,
    }),
    Enrollment.findAll({
      attributes: ['course_code', 'state', 'enrollment_date_time', 'studentnumber', 'semestercode'],
      where: {
        enrollment_date_time: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
        studentnumber: {
          [Op.in]: studentnumbers,
        },
        state: ['ENROLLED', 'CONFIRMED'],
      },
      raw: true,
    }),
    Student.findAll({
      attributes: [
        'firstnames',
        'lastname',
        'studentnumber',
        'home_country_en',
        'dateofuniversityenrollment',
        'creditcount',
        'abbreviatedname',
        'email',
        'secondary_email',
        'phone_number',
        'updatedAt',
        'gender_code',
        'birthdate',
        'sis_person_id',
      ],
      include: [
        {
          model: Transfer,
          attributes: ['transferdate', 'sourcecode', 'targetcode'],
          separate: true,
        },
        {
          model: Studyright,
          attributes: [
            'studyrightid',
            'startdate',
            'enddate',
            'extentcode',
            'graduated',
            'active',
            'prioritycode',
            'faculty_code',
            'studystartdate',
            'admission_type',
            'cancelled',
            'is_ba_ma',
          ],
          separate: true,
          include: [
            {
              model: StudyrightElement,
              required: true,
              attributes: ['id', 'startdate', 'enddate', 'studyrightid', 'code'],
              include: {
                model: ElementDetail,
              },
            },
          ],
        },
        {
          model: SemesterEnrollment,
          attributes: ['enrollmenttype', 'semestercode', 'enrollment_date'],
          separate: true,
          include: {
            model: Semester,
            attributes: [],
            required: true,
          },
        },
        {
          model: Studyplan,
          attributes: ['included_courses', 'programme_code', 'completed_credits', 'studyrightid'],
          separate: true,
        },
      ],
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
    }),
    Credit.findAll({
      attributes: [
        'grade',
        'credits',
        'credittypecode',
        'attainment_date',
        'isStudyModule',
        'student_studentnumber',
        'course_code',
        'language',
      ],
      where: creditsOfStudent,
      raw: true,
    }),
    StudyrightExtent.findAll({
      attributes: [
        sequelize.literal('DISTINCT ON("studyright_extent"."extentcode") "studyright_extent"."extentcode"'),
        'name',
      ],
      include: [
        {
          model: Studyright,
          attributes: [],
          required: true,
          where: {
            student_studentnumber: {
              [Op.in]: studentnumbers,
            },
            prioritycode: {
              [Op.not]: 6,
            },
          },
        },
      ],
      raw: true,
    }),
    Semester.findAll({
      attributes: [
        sequelize.literal('DISTINCT ON("semester"."semestercode") "semester"."semestercode"'),
        'name',
        'startdate',
        'enddate',
      ],
      include: {
        model: SemesterEnrollment,
        attributes: [],
        required: true,
        where: {
          studentnumber: {
            [Op.in]: studentnumbers,
          },
        },
      },
      where: {
        startdate: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true,
    }),
    sequelize.query(
      `
SELECT DISTINCT ON (code) code, name, type FROM element_details WHERE
EXISTS (SELECT 1 FROM transfers WHERE studentnumber IN (:studentnumbers) AND (code = sourcecode OR code = targetcode)) OR
EXISTS (SELECT 1 FROM studyright_elements WHERE studentnumber IN (:studentnumbers))`,
      {
        replacements: { studentnumbers },
        type: sequelize.QueryTypes.SELECT,
      }
    ),
  ])

  students.forEach(student => {
    student.tags = studentNumberToTags[student.studentnumber] || []
  })

  return { students, enrollments, credits, extents, semesters, elementdetails, courses }
}

module.exports = {
  getStudentsIncludeCoursesBetween,
}
