const Sequelize = require('sequelize')
const moment = require('moment')
const { Student, Credit, Studyright, sequelize } = require('./models')
const Op = Sequelize.Op;

const studyrightsStartedAt = (date) => {
  return Studyright.findAll({
    limit : 200,
    include: [ { 
      model: Student,
       include: [ Credit ]
    } ],
    where: { 
      startdate: {
        [Op.eq]: new Date(date)
      }
    }
  })
}

const studentsStartedAtDepartment = (studyrights, dep, startDate) => {
  const hasNoPreviousStudies = (s) => {

    return true
  }

  const hasStarted = (s) => {
    return s.credits.length>0
  } 

  return studyrights
          .filter( s => s.highlevelname === dep )
          .map( s => s.student )
          .filter( hasStarted )
          .filter( hasNoPreviousStudies )
}



async function main() {
  try {
    const BSC_CS = 'Bachelor of Science, Computer Science'
    const BSC_MATH = 'Bachelor of Science, Mathematics'
   
    const startDate = '2005-08-01'

    const studyrights = await studyrightsStartedAt(startDate)
    
    const cs = studentsStartedAtDepartment(studyrights, BSC_CS, moment(startDate))

    cs.forEach( s => console.log(s.studentnumber))

    //console.log(studyrights.map(s=>s.student.studentnumber))

  } catch (e) {
    console.log(e)
  } 
  sequelize.close()
}

main()