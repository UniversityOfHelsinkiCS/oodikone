const { ARRAY, BIGINT, DATE, INTEGER, STRING } = require('sequelize')

const { sequelizeKone } = require('../database/connection')

const ExcludedCourse = sequelizeKone.define(
  'excluded_courses',
  {
    id: {
      primaryKey: true,
      type: INTEGER,
      autoIncrement: true,
    },
    programme_code: {
      type: STRING,
    },
    curriculum_version: {
      type: STRING,
    },
    course_code: {
      type: STRING,
    },
    created_at: {
      type: DATE,
    },
    updated_at: {
      type: DATE,
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
      type: STRING,
    },
    tag_id: {
      primaryKey: true,
      type: BIGINT,
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
      type: STRING,
    },
    tag_id: {
      primaryKey: true,
      type: BIGINT,
      autoIncrement: true,
    },
    studytrack: {
      type: STRING,
    },
    year: {
      type: STRING,
    },
    personal_user_id: {
      type: BIGINT,
    },
  },
  {
    tableName: 'tag',
  }
)

const CustomPopulationSearch = sequelizeKone.define('custom_population_searches', {
  id: {
    primaryKey: true,
    type: BIGINT,
    autoIncrement: true,
  },
  userId: {
    type: BIGINT,
  },
  name: {
    type: STRING,
  },
  students: {
    type: ARRAY(STRING),
  },
})

// also used in completed courses search feature
const OpenUniPopulationSearch = sequelizeKone.define(
  'open_uni_population_searches',
  {
    id: {
      primaryKey: true,
      type: BIGINT,
      autoIncrement: true,
    },
    userId: {
      type: BIGINT,
    },
    name: {
      type: STRING,
      allowNull: false,
    },
    courseCodes: {
      type: ARRAY(STRING),
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
      type: ARRAY(STRING),
    },
    coursesYearTwo: {
      type: ARRAY(STRING),
    },
    coursesYearThree: {
      type: ARRAY(STRING),
    },
    coursesYearFour: {
      type: ARRAY(STRING),
    },
    coursesYearFive: {
      type: ARRAY(STRING),
    },
    coursesYearSix: {
      type: ARRAY(STRING),
    },
    creditsYearOne: {
      type: INTEGER,
    },
    creditsYearTwo: {
      type: INTEGER,
    },
    creditsYearThree: {
      type: INTEGER,
    },
    creditsYearFour: {
      type: INTEGER,
    },
    creditsYearFive: {
      type: INTEGER,
    },
    creditsYearSix: {
      type: INTEGER,
    },
  },
  { underscored: true, timestamps: true }
)

const StudyGuidanceGroupTag = sequelizeKone.define(
  'study_guidance_group_tags',
  {
    id: {
      primaryKey: true,
      type: BIGINT,
      autoIncrement: true,
    },
    studyGuidanceGroupId: {
      type: STRING,
      unique: true,
    },
    studyProgramme: {
      type: STRING,
    },
    year: {
      type: STRING,
    },
  },
  { underscored: true, timestamps: true }
)

const StudyProgrammePin = sequelizeKone.define(
  'study_programme_pins',
  {
    userId: {
      primaryKey: true,
      type: INTEGER,
    },
    studyProgrammes: {
      type: ARRAY(STRING),
    },
  },
  { underscored: true, timestamps: false }
)

TagStudent.belongsTo(Tag, { foreignKey: 'tag_id', sourceKey: 'tag_id' })
Tag.hasMany(TagStudent, { foreignKey: 'tag_id', sourceKey: 'tag_id' })

module.exports = {
  CustomPopulationSearch,
  ExcludedCourse,
  OpenUniPopulationSearch,
  ProgressCriteria,
  StudyGuidanceGroupTag,
  StudyProgrammePin,
  Tag,
  TagStudent,
}
