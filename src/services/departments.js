const Sequelize = require('sequelize')
const { Student, Credit, Studyright, CourseInstance } = require('../models')
const Op = Sequelize.Op

const studyrightsStartedAt = (date) => {
  return Studyright.findAll({
    include: [ 
      {
        model: Student,
        include: [ 
          { 
            model: Credit, 
            include: [ CourseInstance ] 
          } 
        ]
      } 
    ],
    where: { 
      startdate: {
        [Op.eq]: new Date(date)
      }
    }
  })
}

const studentsStartedAtDepartment = (studyrights, department, startDate) => {
  const departmentMatches = (s) => {
    const name = s.highlevelname.toUpperCase()
    return department.toUpperCase().split(' ').every( part => name.indexOf(part)!==-1 )
  }

  return studyrights
    .filter( departmentMatches )
    .map( s => s.student )
    .filter( Student.hasStarted )
    .filter( Student.hasNoPreviousStudies(startDate) )
}

const averageGradesInMonths = (students, start, months) => {

  const studentsAverageCreditsInMonths = (sum, student) => {

    const notRepeatEntry = (set, credit) => {
      const completedCourses = set.map(c => c.courseinstance.course_code)
      if ( completedCourses.includes(credit.courseinstance.course_code) ) {
        return set
      }

      return set.concat(credit)
    } 

    return sum + student.credits
      .filter(Credit.passed)
      .filter(Credit.notUnnecessary)
      .filter(Credit.inTimeRange(start, months))
      .reduce(notRepeatEntry, [])
      .reduce((sum, c) => sum+c.credits, 0)
  }

  return students.reduce(studentsAverageCreditsInMonths, 0.0) / students.length
}

const departments = [
  {
    name: 'Chemistry Bachelor',
    api_name: 'Chemistry'
  },     
  {
    name: 'Computer Science Bachelor',
    api_name: 'Computer Science'
  },
  {
    name: 'Mathematics Bachelor',
    api_name: 'Mathematics'
  },  
  {
    name: 'Physics Bachelor',
    api_name: 'Physics'
  }, 
]

async function averagesInMonths(startDate, months) {
  try {
    const studyrights = await studyrightsStartedAt(startDate)
    
    const result = {}
    departments.forEach( p => {
      const students = studentsStartedAtDepartment(studyrights, p.name, startDate)

      result[p.api_name] = averageGradesInMonths(students, startDate, months)   
    })

    return result
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  } 
  
}

module.exports = {
  averagesInMonths, departments
}