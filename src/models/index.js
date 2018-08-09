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
    timestamps: true,
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
    ordering: { type: Sequelize.STRING },
    attainment_date: { type: Sequelize.DATE }
  },
  {
    tableName: 'credit',
    timestamps: true,
    createdAt: 'createddate',
    updatedAt: 'lastmodifieddate',
    indexes: [
      {
        fields: ['student_studentnumber']
      },
      {
        fields: ['courseinstance_id'],
        name: 'credit_courseinstance_id'
      },
      {
        fields: ['course_code'],
        name: 'credit_course_code'
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

const CREDIT_TYPE_CODES = {
  PASSED: 4,
  FAILED: 10,
  IMPROVED: 7,
  APPROVED: 9
}

Credit.passed = ({ credittypecode }) => credittypecode === CREDIT_TYPE_CODES.PASSED || credittypecode === CREDIT_TYPE_CODES.IMPROVED || credittypecode === CREDIT_TYPE_CODES.APPROVED
Credit.failed = credit => credit.credittypecode === CREDIT_TYPE_CODES.FAILED
Credit.improved = credit => credit.credittypecode === CREDIT_TYPE_CODES.IMPROVED

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
    indexes: [
      {
        fields: ['student_studentnumber']
      }
    ]
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
      },
      {
        fields: ['course_code']
      }
    ]
  }
)

const STUDY_MODULE_COURSE_TYPES = [8, 9, 10, 11, 17, 18, 19, 20, 33, 40, 41, 42, 43, 44]
const STUDY_MODULE_HEURISTICS = ['syventävät opinnot', 'muut opinnot', 'opintokokonaisuus', 'perusopinnot', 'aineopinnot', 'pedagogiset opinnot', 'sisältöopinnot', 'kasvatustieteelliset opinnot', 'sivuaine']

const Course = sequelize.define('course',
  {
    code: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    name: { type: Sequelize.JSONB },
    latest_instance_date: { type: Sequelize.DATE },
    is_study_module: {
      type: Sequelize.BOOLEAN,
      get() {
        const coursetypecode = this.getDataValue('coursetypecode')
        const coursename = this.getDataValue('name')
        const name = coursename['fi'] ? coursename['fi'].toLowerCase() : null
        if (name) {
          return STUDY_MODULE_COURSE_TYPES.some(typecode => typecode === coursetypecode) ||
            STUDY_MODULE_HEURISTICS.some(moduleName => name.includes(moduleName))
        }
        return STUDY_MODULE_COURSE_TYPES.some(typecode => typecode === coursetypecode)
      }
    }
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
    language: { type: Sequelize.STRING }
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
    description: {
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

const Discipline = sequelize.define('discipline',
  {
    discipline_id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    name: {
      type: Sequelize.JSONB
    }
  }
)

const CourseDisciplines = sequelize.define('course_disciplines', {})

const CourseType = sequelize.define('course_type', {
  coursetypecode: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  name: {
    type: Sequelize.JSONB
  }
})

const CreditType = sequelize.define('credit_type', {
  credittypecode: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  name: {
    type: Sequelize.JSONB
  }
})

const Semester = sequelize.define('semester', {
  semestercode: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  name: {
    type: Sequelize.JSONB
  },
  startdate: {
    type: Sequelize.DATE
  },
  enddate: {
    type: Sequelize.DATE
  }
})

const SemesterEnrollment = sequelize.define('semester_enrollment', {
  id: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    autoIncrement: true
  },
  enrollmenttype: {
    type: Sequelize.INTEGER
  }
}, {
  indexes: [
    {
      fields: ['semestercode', 'studentnumber'],
      unique: true
    }, {
      fields: ['studentnumber']
    }
  ]
})

const Provider = sequelize.define('provider', {
  providercode: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.JSONB
  }
})

const Transfers = sequelize.define('transfers', {
  transferdate: {
    type: Sequelize.DATE
  }
}, {
  indexes: [
    {
      fields: ['studentnumber']
    }
  ]
})

const CourseProvider = sequelize.define('course_providers', {}, {
  indexes: [
    {
      fields: ['providercode', 'coursecode'],
      unique: true
    }
  ]
})

const CourseRealisationType = sequelize.define('courserealisation_type', {
  realisationtypecode: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.JSONB
  }
})

const CourseRealisation = sequelize.define('courserealisation', {
  courserealisation_id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.JSONB
  },
  startdate: {
    type: Sequelize.DATE
  },
  enddate: {
    type: Sequelize.DATE
  },
  parent: {
    type: Sequelize.STRING
  },
  root: {
    type: Sequelize.STRING
  }
})

const CourseEnrollment = sequelize.define('course_enrollment', {})

const Migration = sequelize.define('migrations', {
  name: { type: Sequelize.STRING }
},{
  tablename: 'migrations'
})

CourseInstance.belongsTo(Course, { foreignKey: 'course_code', targetKey: 'code' })
Course.hasMany(CourseInstance, { foreignKey: 'course_code', targetKey: 'code' })

CourseInstance.hasMany(Credit, { foreignKey: 'courseinstance_id', targetKey: 'id' })
Credit.belongsTo(CourseInstance, { foreignKey: 'courseinstance_id', targetKey: 'id' })

CourseInstance.hasMany(CourseTeacher, { foreignKey: 'courseinstance_id', targetKey: 'id' })

Credit.belongsTo(Student, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Credit, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })

Credit.belongsTo(Course, { foreignKey: 'course_code' })

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

CourseType.hasMany(Course, { foreignKey: 'coursetypecode', sourceKey: 'coursetypecode' })
Course.belongsTo(CourseType, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })

Discipline.belongsToMany(Course, { through: CourseDisciplines, foreignKey: 'discipline_id' })
Course.belongsToMany(Discipline, { through: CourseDisciplines, foreignKey: 'course_id' })

CreditType.hasMany(Credit, { foreignKey: 'credittypecode', sourceKey: 'credittypecode' })
Credit.belongsTo(CreditType, { foreignKey: 'credittypecode', targetKey: 'credittypecode' })

SemesterEnrollment.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(SemesterEnrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

SemesterEnrollment.belongsTo(Semester, { foreignKey: 'semestercode', targetKey: 'semestercode' })
Semester.hasMany(SemesterEnrollment, { foreignKey: 'semestercode', sourceKey: 'semestercode' })

Course.belongsToMany(Provider, { through: CourseProvider, foreignKey: 'coursecode' })
Provider.belongsToMany(Course, { through: CourseProvider, foreignKey: 'providercode' })

Transfers.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Transfers, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

Transfers.belongsTo(Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
Studyright.hasMany(Transfers, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })

Transfers.belongsTo(ElementDetails, { as: 'source', foreignKey: 'sourcecode' })
Transfers.belongsTo(ElementDetails, { as: 'target', foreignKey: 'targetcode' })

CourseRealisation.belongsTo(CourseRealisationType, { foreignKey: 'realisationtypecode' })
CourseRealisation.belongsTo(Course, { foreignKey: 'coursecode' })
CourseRealisation.belongsToMany(Student, { through: CourseEnrollment, foreignKey: 'courserealisation_id' })
Student.belongsToMany(CourseRealisation, { through: CourseEnrollment, foreignKey: 'studentnumber' })

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
  CourseType,
  CreditType,
  Discipline,
  CourseDisciplines,
  Semester,
  SemesterEnrollment,
  Provider,
  CourseProvider,
  Transfers,
  CourseRealisationType,
  CourseRealisation,
  CourseEnrollment,
  Migration
}