const Sequelize = require('sequelize')
const moment = require('moment')
const { sequelize, migrationPromise } = require('../database/connection')

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
    dateofuniversityenrollment: { type: Sequelize.DATE },
    matriculationexamination: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING },
    phone: { type: Sequelize.STRING },
    city_fi: { type: Sequelize.STRING },
    city_sv: { type: Sequelize.STRING },
    national_student_number: { type: Sequelize.STRING },
    zipcode: { type: Sequelize.STRING },
    address: { type: Sequelize.STRING },
    address2: { type: Sequelize.STRING },
    language_fi: { type: Sequelize.STRING },
    language_sv: { type: Sequelize.STRING },
    language_en: { type: Sequelize.STRING },
    age: { type: Sequelize.INTEGER },
    mobile: { type: Sequelize.STRING },
    home_county_id: { type: Sequelize.INTEGER },
    country_fi: { type: Sequelize.STRING },
    country_sv: { type: Sequelize.STRING },
    country_en: { type: Sequelize.STRING },
  },
  {
    tableName: 'student',
    timestamps: false,
  }
)

Student.hasNoPreviousStudies = (startDate) => (student) => {
  const by = (a, b) => moment(a).isSameOrBefore(b) ? -1 : 1
  const dates = student.credits.map(c => c.courseinstance.coursedate).sort(by)
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

const Organisation = sequelize.define('organization',
  {
    code: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    name: Sequelize.JSONB
  },
  {
    tableName: 'organization',
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
    isStudyModuleCredit: {
      type: Sequelize.BOOLEAN,
      get() {
        let val = this.getDataValue('credits')
        if (val >= 25) {
          return true
        }
        else {
          return false
        }
      }
    },
    ordering: { type: Sequelize.STRING },
    status: { type: Sequelize.STRING },
    statuscode: { type: Sequelize.STRING },
    courseinstance_id: { type: Sequelize.BIGINT },
  },
  {
    tableName: 'credit',
    timestamps: true,
    createdAt: 'createddate',
    updatedAt: 'lastmodifieddate',
    indexes: [
      {
        fields: ['student_studentnumber']
      }
    ]
  }
)

Credit.inTimeRange = (date, months) => (credit) => {
  const creditDate = credit.courseinstance.coursedate
  const monthsFromDate = moment(date).add(months, 'months')

  return moment(creditDate).isBetween(date, monthsFromDate, null, '[]')
}

Credit.notLaterThan = (date, months) => (credit) => {
  const creditDate = credit.courseinstance.coursedate
  const monthsFromDate = moment(date).add(months, 'months')

  return moment(creditDate).isSameOrBefore(monthsFromDate, null, '[]')
}

Credit.notUnnecessary = (credit) => {
  return credit.credits > 0 && credit.credits <= 12
}

const failedNames = ['Luop', 'Hyl.', 'Eisa', '0', 'Fail']

Credit.failed = (credit) =>
  failedNames.includes(credit.grade)

Credit.passed = (credit) =>
  !failedNames.includes(credit.grade)

const Studyright = sequelize.define('studyright',
  {
    studyrightid: {
      primaryKey: true,
      type: Sequelize.BIGINT
    },
    canceldate: { type: Sequelize.DATE },
    cancelorganisation: { type: Sequelize.STRING },
    enddate: { type: Sequelize.DATE },
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

const StudyrightElement = sequelize.define('studyright_elements',
  {
    startdate: { type: Sequelize.DATE },
    enddate: { type: Sequelize.DATE }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['startdate', 'enddate', 'studyrightid', 'code']
      }, {
        fields: ['startdate']
      }
    ],
    tablename: 'studyright_elements'
  }
)

const ElementDetails = sequelize.define('element_details',
  {
    code: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    name: { type: Sequelize.JSONB },
    type: { type: Sequelize.INTEGER }
  },
  {
    tablename: 'element_details'
  }
)

const CourseInstance = sequelize.define('courseinstance',
  {
    id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true
    },
    coursedate: { type: Sequelize.DATE },
    course_code: { type: Sequelize.STRING }
  },
  {
    tableName: 'courseinstance',
    timestamps: false,
    indexes: [
      {
        fields: ['coursedate']
      }
    ]
  }
)

const Course = sequelize.define('course',
  {
    code: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    name: { type: Sequelize.JSONB },
    latest_instance_date: { type: Sequelize.DATE }
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
      type: Sequelize.STRING
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
    teacherrole: { type: Sequelize.STRING },
    courseinstance_id: { type: Sequelize.BIGINT },
    teacher_id: { type: Sequelize.STRING },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['teacherrole', 'courseinstance_id', 'teacher_id']
      }
    ],
    tableName: 'courseteacher',
    timestamps: false,
  }
)

const User = sequelize.define('users',
  {
    id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true
    },
    full_name: { type: Sequelize.STRING },
    is_enabled: { type: Sequelize.BOOLEAN },
    username: { type: Sequelize.STRING },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
)

const StudentList = sequelize.define('student_list',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    key: {
      type: Sequelize.STRING
    },
    max: {
      type: Sequelize.BIGINT
    },
    description: {
      type: Sequelize.STRING
    },
    student_numbers: {
      type: Sequelize.JSONB
    }
  },
  {
    tableName: 'student_list',
    timestamps: false,
  }
)

const Filters = sequelize.define('filters',
  {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING
    },
    filters: {
      type: Sequelize.JSONB
    },
    population: {
      type: Sequelize.JSONB
    }
  }
)

const StudyrightExtent = sequelize.define('studyright_extent',
  {
    extentcode: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    name: {
      type: Sequelize.JSONB,
    }
  }
)

const CourseType = sequelize.define('course_type', {
  coursetypecode: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  name: {
    type: Sequelize.JSONB
  }
})

CourseInstance.belongsTo(Course, { foreignKey: 'course_code', targetKey: 'code' })
Course.hasMany(CourseInstance, { foreignKey: 'course_code', targetKey: 'code' })

CourseInstance.hasMany(Credit, { foreignKey: 'courseinstance_id', targetKey: 'id' })
Credit.belongsTo(CourseInstance, { foreignKey: 'courseinstance_id', targetKey: 'id' })

CourseInstance.hasMany(CourseTeacher, { foreignKey: 'courseinstance_id', targetKey: 'id' })

Credit.belongsTo(Student, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Credit, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })

Student.hasMany(TagStudent, { foreignKey: 'taggedstudents_studentnumber', sourceKey: 'studentnumber' })
Tag.hasMany(TagStudent, { foreignKey: 'tags_tagname', sourceKey: 'tagname' })

Studyright.belongsTo(Student, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Studyright, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })

StudyrightElement.belongsTo(Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
Studyright.hasMany(StudyrightElement, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })

StudyrightElement.belongsTo(ElementDetails, { foreignKey: 'code', targetKey: 'code' })
ElementDetails.hasMany(StudyrightElement, { foreignKey: 'code', sourceKey: 'code' })

StudyrightElement.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(StudyrightElement, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

User.belongsToMany(ElementDetails, { through: 'user_elementdetails', as: 'elementdetails' })
ElementDetails.belongsToMany(User, { through: 'user_elementdetails' })

StudyrightExtent.hasMany(Studyright, { foreignKey: 'extentcode', sourceKey: 'extentcode' })
Studyright.belongsTo(StudyrightExtent, { foreignKey: 'extentcode', targetKey: 'extentcode' })

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
  sequelize,
  migrationPromise,
  Organisation,
  StudentList,
  StudyrightElement,
  ElementDetails,
  Filters,
  StudyrightExtent,
  CourseType
}