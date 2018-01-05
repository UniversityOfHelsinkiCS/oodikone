const Sequelize = require('sequelize')
const { Studyright } = require('../models')
const Op = Sequelize.Op


const createStudyright = (array) => {
  return Studyright.create({
    //     canceldate: { type: Sequelize.DATE },
    //     cancelorganisation: { type: Sequelize.STRING },
    //     enddate: { type: Sequelize.DATE },
    //     extentcode: { type: Sequelize.INTEGER },
    //     givendate: { type: Sequelize.DATE },
    //     graduated: { type: Sequelize.INTEGER },
    //     highlevelname: { type: Sequelize.STRING },
    //     prioritycode: { type: Sequelize.INTEGER },
    //     startdate: { type: Sequelize.DATE },
    //     studystartdate: { type: Sequelize.DATE },
    //     organization_code: { type: Sequelize.STRING },
    //     student_studentnumber: { type: Sequelize.STRING },
  }).then(result => {
    console.log('Created new studyright' + array[0])
    return
  }).catch(e => {
    console.log('Error creating studyright ' + array[0])
    return
  })
}

const byStudent = (studentNumber) => {
  return StudyRight.findAll({
    where: {
      student_studentnumber: {
        [Op.eq]: studentNumber
      }
    }
  })
}

// const Studyright = sequelize.define('studyright', 
//   {
//     studyrightid: { 
//       primaryKey: true,
//       type: Sequelize.BIGINT 
//     },
//     canceldate: { type: Sequelize.DATE },
//     cancelorganisation: { type: Sequelize.STRING },
//     enddate: { type: Sequelize.DATE },
//     extentcode: { type: Sequelize.INTEGER },
//     givendate: { type: Sequelize.DATE },
//     graduated: { type: Sequelize.INTEGER },
//     highlevelname: { type: Sequelize.STRING },
//     prioritycode: { type: Sequelize.INTEGER },
//     startdate: { type: Sequelize.DATE },
//     studystartdate: { type: Sequelize.DATE },
//     organization_code: { type: Sequelize.STRING },
//     student_studentnumber: { type: Sequelize.STRING },
//   },
//   {
//     tableName: 'studyright',
//     timestamps: false,  
//   }
// )

module.exports = {
  byStudent, createStudyright
}