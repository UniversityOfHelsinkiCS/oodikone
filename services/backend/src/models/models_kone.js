const { STRING } = require('sequelize')
const Sequelize = require('sequelize')
const { sequelizeKone } = require('../database/connection')

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
    curriculum_version: {
      type: STRING,
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

// also used in completed courses search feature
const OpenUniPopulationSearch = sequelizeKone.define(
  'open_uni_population_searches',
  {
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
      allowNull: false,
    },
    courseCodes: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
  },
  { underscored: true, timestamps: true }
)

const ProgressCriteria = sequelizeKone.define(
  'progress_criteria',
  {
    code: {
      primaryKey: true,
      type: STRING,
    },
    curriculumVersion: {
      type: STRING,
    },
    coursesYearOne: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    coursesYearTwo: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    coursesYearThree: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    coursesYearFour: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    coursesYearFive: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    coursesYearSix: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    creditsYearOne: {
      type: Sequelize.INTEGER,
    },
    creditsYearTwo: {
      type: Sequelize.INTEGER,
    },
    creditsYearThree: {
      type: Sequelize.INTEGER,
    },
    creditsYearFour: {
      type: Sequelize.INTEGER,
    },
    creditsYearFive: {
      type: Sequelize.INTEGER,
    },
    creditsYearSix: {
      type: Sequelize.INTEGER,
    },
  },
  { underscored: true, timestamps: true }
)

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

TagStudent.belongsTo(Tag, { foreignKey: 'tag_id', sourceKey: 'tag_id' })
Tag.hasMany(TagStudent, { foreignKey: 'tag_id', sourceKey: 'tag_id' })

module.exports = {
  TagStudent,
  Tag,
  CustomPopulationSearch,
  OpenUniPopulationSearch,
  ExcludedCourse,
  StudyGuidanceGroupTag,
  ProgressCriteria,
}
