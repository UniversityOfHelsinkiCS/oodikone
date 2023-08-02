const { Model, STRING, DATE } = require('sequelize')
const { dbConnections } = require('../connection')

class ProgrammeModuleChild extends Model {}

ProgrammeModuleChild.init(
  {
    composite: {
      type: STRING,
      primaryKey: true,
    },
    parentId: {
      type: STRING,
      references: {
        model: 'programme_modules',
        key: 'id',
      },
    },
    childId: {
      type: STRING,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'programme_module_child',
    tableName: 'programme_module_children',
  }
)

module.exports = ProgrammeModuleChild
