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

const StudyGuidanceGroupTag = sequelizeKone.define(
  'study_guidance_group_tags',
  {
    id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true,
    },
    studyGuidanceGroupId: {
      type: Sequelize.STRING,
      unique: true,
    },
    studyProgramme: {
      type: Sequelize.STRING,
    },
    year: {
      type: Sequelize.STRING,
    },
  },
  { underscored: true, timestamps: true }
)

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
  ThesisTypeEnums,
  MandatoryCourseLabels,
  CustomPopulationSearch,
  sequelizeKone,
  ExcludedCourse,
  StudyGuidanceGroupTag,
}
