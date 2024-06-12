import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit, creditId } from './credit';
import type { teacher, teacherId } from './teacher';

export interface credit_teachersAttributes {
  composite: string;
  credit_id?: string;
  teacher_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type credit_teachersPk = "composite";
export type credit_teachersId = credit_teachers[credit_teachersPk];
export type credit_teachersOptionalAttributes = "credit_id" | "teacher_id" | "createdAt" | "updatedAt";
export type credit_teachersCreationAttributes = Optional<credit_teachersAttributes, credit_teachersOptionalAttributes>;

export class credit_teachers extends Model<credit_teachersAttributes, credit_teachersCreationAttributes> implements credit_teachersAttributes {
  declare composite: string;
  declare credit_id?: string;
  declare teacher_id?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // credit_teachers belongsTo credit via credit_id
  declare credit: credit;
  declare getCredit: Sequelize.BelongsToGetAssociationMixin<credit>;
  declare setCredit: Sequelize.BelongsToSetAssociationMixin<credit, creditId>;
  declare createCredit: Sequelize.BelongsToCreateAssociationMixin<credit>;
  // credit_teachers belongsTo teacher via teacher_id
  declare teacher: teacher;
  declare getTeacher: Sequelize.BelongsToGetAssociationMixin<teacher>;
  declare setTeacher: Sequelize.BelongsToSetAssociationMixin<teacher, teacherId>;
  declare createTeacher: Sequelize.BelongsToCreateAssociationMixin<teacher>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_teachers {
    return credit_teachers.init({
    composite: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    credit_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'credit',
        key: 'id'
      }
    },
    teacher_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'teacher',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'credit_teachers',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "credit_teachers_credit_id",
        fields: [
          { name: "credit_id" },
        ]
      },
      {
        name: "credit_teachers_pkey",
        unique: true,
        fields: [
          { name: "composite" },
        ]
      },
      {
        name: "credit_teachers_teacher_id",
        fields: [
          { name: "teacher_id" },
        ]
      },
    ]
  });
  }
}
