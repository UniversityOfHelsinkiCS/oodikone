const Sequelize = require('sequelize')
const { Student, Studyright, Credit, CourseInstance, CourseTeacher, Teacher } = require('../models')
const { arrayUnique } = require('../util')
const Op = Sequelize.Op

const courseInstancesInBetween = (courses, fromDate, toDate) => {
  return CourseInstance.findAll({
    where: { 
      [Op.and]: [
        { 
          course_code: {
            [Op.in]: courses
          } 
        },
        {
          coursedate: {
            [Op.between]: [fromDate, toDate]
          }
        }
      ]
    },
    include: [ 
      { 
        model: CourseTeacher 
      }, 
      { 
        model: Credit, 
        include: [ { model: Student, include: [Studyright] } ] 
      }     
    ]
  })
}

const teachersByIds = (ids) => {
  return Teacher.findAll({
    where: {
      id: {
        [Op.in]: ids
      }       
    }  
  })
}

async function statisticsOf(courses, fromDate, toDate, minCourses, minStudents, studyRights) {
  const extractStatsPerTeacherId = (courses) => {
    const hasAskedStudyright = (credit) => {
      if ( studyRights.length==0 ) {
        return true
      }
      const studentsRights = credit.student.studyrights.map(s => s.highlevelname)
      return studyRights.map( s => studentsRights.includes(s) ).find( s => s===true )
    }

    const teachers = {}
    const accountedCredits = {}
    const attendances = {}

    courses.forEach(course => {
      // horrible code to prevent duplicate entries
      const noRepeatedEntry = (credit) => {
        if ( accountedCredits[credit.student_studentnumber]===undefined ) {
          accountedCredits[credit.student_studentnumber] = {}
        }
        if ( accountedCredits[credit.student_studentnumber][course.course_code] ) {
          return false
        }

        accountedCredits[credit.student_studentnumber][course.course_code] = credit
        
        return true
      }

      // even worse code to prevent counting students with twice passed as attendance twice
      const noRepeatedAttendance = (credit) => {
        if ( attendances[credit.student_studentnumber]===undefined ) {
          attendances[credit.student_studentnumber] = {}
        }

        const attendance = attendances[credit.student_studentnumber][course.course_code]
        
        if ( attendance===undefined ) {
          attendances[credit.student_studentnumber][course.course_code] = ''+Credit.passed(credit)
          return true
        }
    
        if ( attendance === 'true' && Credit.passed(credit) ) {
          return false
        } else if ( attendance === 'false' && Credit.passed(credit) ) {
          attendances[credit.student_studentnumber][course.course_code] = ''+Credit.passed(credit)
          return true
        } 

        return true
      }

      const teacher_ids = course.courseteachers.map( t => t.teacher_id ).filter(arrayUnique)

      const creditsWithAskedStudyrights = course.credits.filter(hasAskedStudyright)

      teacher_ids.forEach( teacher_id =>{
        if ( teachers[teacher_id]===undefined ) {
          teachers[teacher_id] = {
            students: 0,
            passed: 0,
            courses: 0,
            points: 0
          } 
        }
  

        const totalCredits = creditsWithAskedStudyrights
          .filter(Credit.passed)
          .filter(noRepeatedEntry)

        const students = creditsWithAskedStudyrights
          .filter(noRepeatedAttendance).length 

        teachers[teacher_id].students += students 
        teachers[teacher_id].courses += 1 
        teachers[teacher_id].passed += totalCredits.length 
        teachers[teacher_id].points += totalCredits.reduce((s,c) => s+c.credits, 0) 
      } )

    })
  
    Object.keys(teachers).forEach( teacher => {
      const data = teachers[teacher]
      if ( data.students<minStudents || data.courses<minCourses ) {
        delete teachers[teacher]
      }
    })

    return teachers
  }

  const format = (stats, teachers) => {
    return Object.keys(stats).map( id => {
      const teacher_stat = stats[id]
      const teacher = teachers.find( t => t.id === id )
      return {
        teacherId: teacher.name,
        credits: teacher_stat.points,
        studentsPassed: teacher_stat.passed,
        studentsTeached: teacher_stat.students,         
        instancesTeached: teacher_stat.courses    
      }
    })
  }

  try {
    const courseStats = await courseInstancesInBetween(courses, fromDate, toDate)
    const teacherStats = extractStatsPerTeacherId(courseStats)

    const teachers = await teachersByIds(Object.keys(teacherStats)) 
    return format(teacherStats, teachers)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  } 
}

const findOrCreateTeacher = async (code, name) => {
  return Teacher.findOne({where: {
    code: code,
    name: name 
  }
  }).then(t => {
    if (t === null) {
      return createTeacher(code, name) 
    } else {
      return t
    }
  })
}

const createTeacher = async (code, name) => {
  const id = await Teacher.max('id') + 1
  return Teacher.build({
    id: id,
    code: code,
    name: name 
  })
}

const createCourseTeacher = async (role, teacher, instance) => {
  const id = await CourseTeacher.max('id') + 1
  return CourseTeacher.build({
    id: id,
    teacherrole: role,
    courseinstance_id: instance.id,
    teacher_id: teacher.id
  })
}

module.exports = {
  statisticsOf, findOrCreateTeacher, createCourseTeacher
}