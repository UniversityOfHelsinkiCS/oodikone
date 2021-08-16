const Sequelize = require('sequelize')
const { sequelizeKone } = require('../database/connection')

const ThesisTypeEnums = {
  MASTER: 'MASTER',
  BACHELOR: 'BACHELOR',
}

const ExcludedCourse = sequelizeKone.define(
  'excluded_courses',
  {
    id: {
      primaryKey: true,
      type: Sequelize.INTEGER,
      autoIncrement: true,
    },
    programme_code: {
      type: Sequelize.STRING,
    },
    course_code: {
      type: Sequelize.STRING,
    },
    created_at: {
      type: Sequelize.DATE,
    },
    updated_at: {
      type: Sequelize.DATE,
    },
  },
  {
    underscored: true,
  }
)

const MandatoryCourse = sequelizeKone.define('mandatory_courses', {
  course_code: {
    type: Sequelize.STRING,
  },
  studyprogramme_id: {
    type: Sequelize.STRING,
  },
  label: {
    type: Sequelize.BIGINT,
  },
})

const Filters = sequelizeKone.define('filters', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  description: {
    type: Sequelize.STRING,
  },
  filters: {
    type: Sequelize.JSONB,
  },
  population: {
    type: Sequelize.JSONB,
  },
})

const UsageStatistic = sequelizeKone.define(
  'usage_statistics',
  {
    id: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
    username: {
      type: Sequelize.STRING,
    },
    name: {
      type: Sequelize.STRING,
    },
    time: {
      type: Sequelize.INTEGER,
    },
    admin: {
      type: Sequelize.BOOLEAN,
    },
    method: {
      type: Sequelize.STRING,
    },
    URL: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.INTEGER,
    },
    data: {
      type: Sequelize.JSONB,
    },
  },
  {
    timestamps: false,
  }
)

const TagStudent = sequelizeKone.define(
  'tag_student',
  {
    studentnumber: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
    tag_id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
  },
  {
    tableName: 'tag_student',
  }
)

const Tag = sequelizeKone.define(
  'tag',
  {
    tagname: {
      type: Sequelize.STRING,
    },
    tag_id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true,
    },
    studytrack: {
      type: Sequelize.STRING,
    },
    year: {
      type: Sequelize.STRING,
    },
    personal_user_id: {
      type: Sequelize.BIGINT,
    },
  },
  {
    tableName: 'tag',
  }
)

const MandatoryCourseLabels = sequelizeKone.define('mandatory_course_labels', {
  id: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    autoIncrement: true,
  },
  studyprogramme_id: {
    type: Sequelize.STRING,
  },
  label: {
    type: Sequelize.STRING,
  },
  orderNumber: {
    type: Sequelize.INTEGER,
  },
})

const MigrationKone = sequelizeKone.define(
  'migrations',
  {
    name: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
  },
  {
    tableName: 'migrations',
    timestamps: false,
  }
)

const CourseDuplicates = sequelizeKone.define('course_duplicates', {
  groupid: {
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  coursecode: {
    type: Sequelize.STRING,
  },
})

const ThesisCourse = sequelizeKone.define('thesis_courses', {
  programmeCode: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  courseCode: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  thesisType: {
    type: Sequelize.ENUM([ThesisTypeEnums.BACHELOR, ThesisTypeEnums.MASTER]),
  },
})

const CustomPopulationSearch = sequelizeKone.define('custom_population_searches', {
  id: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    autoIncrement: true,
  },
  userId: {
    type: Sequelize.BIGINT,
  },
  name: {
    type: Sequelize.STRING,
  },
  students: {
    type: Sequelize.ARRAY(Sequelize.STRING),
  },
})

MandatoryCourse.belongsTo(MandatoryCourseLabels, {
  foreignKey: 'label',
  sourceKey: 'id',
})
MandatoryCourseLabels.hasMany(MandatoryCourse, {
  foreignKey: 'label',
  sourceKey: 'id',
})

TagStudent.belongsTo(Tag, { foreignKey: 'tag_id', sourceKey: 'tag_id' })
Tag.hasMany(TagStudent, { foreignKey: 'tag_id', sourceKey: 'tag_id' })

module.exports = {
  MandatoryCourse,
  TagStudent,
  Tag,
  Filters,
  UsageStatistic,
  CourseDuplicates,
  ThesisCourse,
  ThesisTypeEnums,
  MandatoryCourseLabels,
  MigrationKone,
  CustomPopulationSearch,
  sequelizeKone,
  ExcludedCourse,
}
