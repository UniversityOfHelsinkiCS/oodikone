const Sequelize = require('sequelize')
const moment = require('moment')

const sequelize = new Sequelize('tkt_oodi', 'tkt_oodi', process.ENV.PW, {
  host: 'localhost',
  dialect:'postgres',
  logging: process.env.NODE_ENV==='test' ? false : true,
  operatorsAliases: false
})

const Student = sequelize.define('student', 
  {
    studentnumber: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    lastname: { type: Sequelize.STRING },
    firstnames: { type: Sequelize.STRING },
    abbreviatedname: { type: Sequelize.STRING },
    birthdate: { type: Sequelize.DATE },
    communicationlanguage: { type: Sequelize.STRING },
    country: { type: Sequelize.STRING },                    
    creditcount: { type: Sequelize.INTEGER },
    dateoffirstcredit: { type: Sequelize.DATE },
    dateoflastcredit: { type: Sequelize.DATE },
    dateofuniversityenrollment: { type: Sequelize.DATE },
    gradestudent: { type: Sequelize.STRING },
    matriculationexamination: { type: Sequelize.STRING },
    nationalities: { type: Sequelize.STRING },
    semesterenrollmenttypecode: { type: Sequelize.STRING },
    sex: { type: Sequelize.STRING },
    studentstatuscode: { type: Sequelize.INTEGER },    
  },
  {
    tableName: 'student',
    timestamps: false,  
  }
)

Student.hasNoPreviousStudies = (startDate) => (student) => {
  const by = (a, b) => moment(a).isSameOrBefore(b) ? -1 : 1
  const dates = student.credits.map(c=>c.courseinstance.coursedate).sort(by)
  const earliestCreditDate = dates[0]

  return moment(startDate).isSameOrBefore(earliestCreditDate)
}

Student.hasStarted = (student) => {
  return student.credits.length > 0
} 

const TagStudent = sequelize.define('tag_student', 
  {
    taggedstudents_studentnumber: { type: Sequelize.STRING },
    tags_tagname: { type: Sequelize.STRING },
  },
  {
    tableName: 'tag_student',
    timestamps: false,  
  }  
)

TagStudent.removeAttribute('id')

const Tag = sequelize.define('tag', 
  {
    tagname: {
      primaryKey: true,
      type: Sequelize.STRING
    },
  },
  {
    tableName: 'tag',
    timestamps: false,  
  }  
)

const Credit = sequelize.define('credit', 
  {
    id: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    grade: { type: Sequelize.STRING },
    student_studentnumber: { type: Sequelize.STRING },
    credits: { type: Sequelize.DOUBLE },
    ordering: { type: Sequelize.STRING },
    status: { type: Sequelize.STRING },
    statuscode: { type: Sequelize.STRING },
    courseinstance_id: { type: Sequelize.BIGINT },    
  },
  {
    tableName: 'credit',
    timestamps: false,  
  }
)

Credit.inTimeRange = (date, months) => (credit) =>  {
  const creditDate = credit.courseinstance.coursedate
  const monthsFromDate = moment(date).add(months, 'months')

  return moment(creditDate).isBetween(date, monthsFromDate, null, '[]')
}

Credit.notUnnecessary = (credit) => {
  return credit.credits > 0 && credit.credits <= 12
}

Credit.failed = (credit) =>
  ['Luop', 'Hyl.', 'Eisa', '0'].includes(credit.grade)

Credit.passed = (credit) => 
  !['Luop', 'Hyl.', 'Eisa', '0'].includes(credit.grade)  

const Studyright = sequelize.define('studyright', 
  {
    studyrightid: { 
      primaryKey: true,
      type: Sequelize.BIGINT 
    },
    canceldate: { type: Sequelize.DATE },
    cancelorganisation: { type: Sequelize.STRING },
    enddate: { type: Sequelize.DATE },
    extentcode: { type: Sequelize.INTEGER },
    givendate: { type: Sequelize.DATE },
    graduated: { type: Sequelize.INTEGER },
    highlevelname: { type: Sequelize.STRING },
    prioritycode: { type: Sequelize.INTEGER },
    startdate: { type: Sequelize.DATE },
    studystartdate: { type: Sequelize.DATE },
    organization_code: { type: Sequelize.STRING },
    student_studentnumber: { type: Sequelize.STRING },
  },
  {
    tableName: 'studyright',
    timestamps: false,  
  }
)

const CourseInstance = sequelize.define('courseinstance', 
  {
    id: { 
      primaryKey: true,
      type: Sequelize.BIGINT 
    },
    coursedate: { type: Sequelize.DATE },
    course_code: { type: Sequelize.STRING },
  },
  {
    tableName: 'courseinstance',
    timestamps: false,  
  }  
)

const Course = sequelize.define('course', 
  {
    code: { 
      primaryKey: true,
      type: Sequelize.STRING 
    },
    name: { type: Sequelize.STRING },
  },
  {
    tableName: 'course',
    timestamps: false,  
  }  
)

const Teacher = sequelize.define('teacher', 
  {
    id: { 
      primaryKey: true,
      type: Sequelize.BIGINT 
    },
    code: { type: Sequelize.STRING },
    name: { type: Sequelize.STRING },
  },
  {
    tableName: 'teacher',
    timestamps: false,  
  }  
)

const CourseTeacher = sequelize.define('courseteacher', 
  {
    id: { 
      primaryKey: true,
      type: Sequelize.BIGINT 
    },
    teacherrole: { type: Sequelize.STRING },
    courseinstance_id: { type: Sequelize.BIGINT },
    teacher_id: { type: Sequelize.BIGINT },
  },
  {
    tableName: 'courseteacher',
    timestamps: false,  
  }  
)

const User = sequelize.define('users',  
  {
    id: { 
      primaryKey: true,
      type: Sequelize.BIGINT 
    },
    password: { type: Sequelize.STRING },
    username: { type: Sequelize.STRING },
  },
  {
    tableName: 'users',
    timestamps: false,  
  }  
)

CourseInstance.belongsTo(Course, {foreignKey: 'course_code', targetKey: 'code'})
Course.hasMany(CourseInstance, {foreignKey: 'course_code', targetKey: 'code'})

CourseInstance.hasMany(Credit, {foreignKey: 'courseinstance_id', targetKey: 'id'})
Credit.belongsTo(CourseInstance, {foreignKey: 'courseinstance_id', targetKey: 'id'})

CourseInstance.hasMany(CourseTeacher, {foreignKey: 'courseinstance_id', targetKey: 'id'})

Credit.belongsTo(Student, {foreignKey: 'student_studentnumber', targetKey: 'studentnumber'})
Student.hasMany(Credit, {foreignKey: 'student_studentnumber', sourceKey: 'studentnumber'})

Student.hasMany(TagStudent, {foreignKey: 'taggedstudents_studentnumber', sourceKey: 'studentnumber'})
Tag.hasMany(TagStudent, {foreignKey: 'tags_tagname', sourceKey: 'tagname'})

Studyright.belongsTo(Student, {foreignKey: 'student_studentnumber', targetKey: 'studentnumber'})
Student.hasMany(Studyright, {foreignKey: 'student_studentnumber', sourceKey: 'studentnumber'})

module.exports = {
  Student, 
  Credit, 
  Studyright, 
  CourseInstance, 
  Course, 
  TagStudent, 
  Tag, 
  Teacher, 
  CourseTeacher, 
  User,
  sequelize
}