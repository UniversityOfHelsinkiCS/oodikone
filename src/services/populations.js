const Sequelize = require('sequelize')
const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../models')
const { formatStudent } = require('../services/students')
const { byId } = require('../services/units')
const Op = Sequelize.Op

const enrolmentDates = () => {
  const query = 'SELECT DISTINCT s.dateOfUniversityEnrollment as date FROM Student s'
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT }
  )
}

const studyRightLike = (searchTerm) => {
  const query = `
    SELECT DISTINCT highLevelName 
      FROM StudyRight  
      WHERE LOWER(highLevelName) 
      LIKE LOWER ?`
  return sequelize.query(query,
    {
      replacements: ['%' + searchTerm + '%'],
      type: sequelize.QueryTypes.SELECT,
      model: Studyright
    })
}

const byCriteria = (conf) => {
  const terms = []

  if (conf.minBirthDate || conf.maxBirthDate) {
    const minBirthDate = conf.minBirthDate || '1900-01-01'
    const maxBirthDate = conf.maxBirthDate || `${new Date().getFullYear()}-01-01`
    terms.push({
      birthdate: {
        [Op.between]: [minBirthDate, maxBirthDate]
      }
    })
  }

  if (conf.sex && ['male', 'female'].includes(conf.sex)) {
    terms.push({
      sex: {
        [Op.eq]: conf.sex
      }
    })
  }

  if (conf.matriculationExamination && ['true', 'false'].includes(conf.matriculationExamination)) {
    terms.push({
      matriculationexamination: {
        [Op.eq]: conf.matriculationExamination === 'true' ? '1' : '0'
      }
    })
  }

  if (conf.studentNumbers && conf.studentNumbers.length > 0) {
    terms.push({
      studentnumber: {
        [Op.in]: conf.studentNumbers
      }
    })
  }

  let tagWithConstraint = {
    model: TagStudent
  }

  if (conf.tags && conf.tags.length > 0) {
    const tagRules = conf.tags.map(tag => ({ [Op.eq]: tag['text'] }))

    tagWithConstraint.where = {
      tags_tagname: {
        [Op.or]: tagRules
      }
    }
  }

  let studyrightWithConstraint = {
    model: Studyright
  }
  if (conf.studyRights && conf.studyRights.length > 0) {
    const studyrightRules = conf.studyRights.map(sr => ({ [Op.eq]: sr.name }))
    studyrightWithConstraint.where = {
      highlevelname: {
        [Op.or]: studyrightRules
      },
      prioritycode: {
        [Op.or]: [1, 30]
      },
      studystartdate: {
        [Op.between]: [conf.enrollmentDates[0], conf.enrollmentDates[1]]
      }
    }
  }

  return Student.findAll({
    include: [
      {
        model: Credit,
        include: [
          {
            model: CourseInstance,
            include: [Course],
            where: { // Only course instances that are from between the dates selected
              coursedate: {
                [Op.gte]: conf.enrollmentDates[0]
              }
            }
          }
        ],
      },
      tagWithConstraint,
      studyrightWithConstraint
    ],
    where: {
      [Op.and]: terms
    }
  })

}

const bySelectedCourses = (courses) => (student) => {
  if (courses.length === 0) {
    return true
  } else {
    const passedCourses = student.credits.filter(Credit.passed).map(c => c.courseinstance.course_code)
    return courses.every(c => passedCourses.includes(c))
  }
}

const notAmongExcludes = (conf) => (student) => {
  if (conf.excludeStudentsThatHaveNotStartedStudies &&
    student.credits.length === 0) {
    return false
  }

  if (conf.excludeStudentsWithZeroCredits &&
    student.creditcount === 0) {  // if (conf.enrollmentDates && conf.enrollmentDates.length > 0) {
    // const enrollmentDateCriterias =
    //   conf.enrollmentDates.map(enrollmentDate => (
    //     { // for some reason Op.eq does not work...
    //       studystartdate: {
    //         [Op.between]: [enrollmentDate, enrollmentDate]
    //       }
    //     })
    //   )

    // terms.push({
    //   [Op.or]: enrollmentDateCriterias
    // })
    // } {
    return false
  }

  if (conf.excludeStudentsWithPreviousStudies &&
    Student.hasNoPreviousStudies(student.dateofuniversityenrollment)(student)) {
    return false
  }

  if (conf.excludedTags && conf.excludedTags.length > 0) {
    const noExcludedTags = student.tag_students.every(tag =>
      conf.excludedTags.includes(tag.tags_tagname) === false
    )
    if (!noExcludedTags) {
      return false
    }
  }

  if (conf.excludedStudentNumbers &&
    conf.excludedStudentNumbers.includes(student.studentnumber)) {
    return false
  }

  return true
}

const restrictToMonths = (months) => (student) => {
  if (months === undefined || months === null || months.length === 0) {
    return student
  }

  const withinTimerange = Credit.inTimeRange(student.dateofuniversityenrollment, months)
  const creditsWithinTimelimit = student.credits.filter(withinTimerange)

  return {
    studentnumber: student.studentnumber,
    tag_students: student.tag_students,
    dateofuniversityenrollment: student.dateofuniversityenrollment,
    creditcount: student.creditcount,
    credits: creditsWithinTimelimit
  }
}

const studyrightsByKeyword = async (searchTerm) => {
  const result = await studyRightLike(searchTerm)

  return result.map(s => s.highlevelname)
}

const universityEnrolmentDates = async () => {
  const [result] = await enrolmentDates()

  return result.map(r => r.date).filter(d => d).sort()
}

const statisticsOf = async (conf) => {
  const students = (await byCriteria(conf))
    .filter(bySelectedCourses(conf.courses))
    .filter(notAmongExcludes(conf))
    .map(restrictToMonths(conf.monthsToStudy))

  return students.map(formatStudent)
}

const semesterStart = {
  SPRING: '01-01',
  FALL: '07-01'
}

const semesterEnd = {
  SPRING: '06-30',
  FALL: '12-31'
}

const semesterStatisticsFor = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  const startDate = `${query.year}-${semesterStart[query.semester]}`
  const endDate = `${query.year}-${semesterEnd[query.semester]}`
  try {
    const studyRights = await Promise.all(query.studyRights.map(async r => byId(r)))
    const conf = {
      enrollmentDates: [startDate, endDate],
      studyRights: studyRights
    }

    const students = await byCriteria(conf).map(restrictToMonths(query.months))  // Months are hard-coded
    return students.map(formatStudent)
  } catch (e) {
    return { error: `No such study rights: ${query.studyRights}` }
  }
}

module.exports = {
  studyrightsByKeyword, universityEnrolmentDates, statisticsOf, semesterStatisticsFor
}