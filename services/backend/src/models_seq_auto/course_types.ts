import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface course_typesAttributes {
  coursetypecode: string;
  name?: object;
  created_at?: Date;
  updated_at?: Date;
}

export type course_typesPk = "coursetypecode";
export type course_typesId = course_types[course_typesPk];
export type course_typesOptionalAttributes = "name" | "created_at" | "updated_at";
export type course_typesCreationAttributes = Optional<course_typesAttributes, course_typesOptionalAttributes>;

export class course_types extends Model<course_typesAttributes, course_typesCreationAttributes> implements course_typesAttributes {
  declare coursetypecode: string;
  declare name?: object;
  declare created_at?: Date;
  declare updated_at?: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof course_types {
    return course_types.init({
    coursetypecode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'course_types',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "course_types_pkey",
        unique: true,
        fields: [
          { name: "coursetypecode" },
        ]
      },
    ]
  });
  }
}
