import { Model, DATE, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

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
    sequelize,
    modelName: 'programme_module_child',
    tableName: 'programme_module_children',
  }
)

export default ProgrammeModuleChild
