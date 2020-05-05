const { Model, STRING, DATE } = require('sequelize')
const { dbConnections } = require('../databaseV2/connection')

class ProgrammeModuleChild extends Model {}

ProgrammeModuleChild.init(
  {
    parent_id: {
      type: STRING,
      references: {
        model: 'programme_modules',
        key: 'id'
      }
    },
    child_id: {
      type: STRING,
      references: {
        model: 'programme_modules',
        key: 'id'
      }
    },
    createdAt: {
      type: DATE
    },
    updatedAt: {
      type: DATE
    }
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'programme_module_child',
    tableName: 'programme_module_children'
  }
)

module.exports = ProgrammeModuleChild
