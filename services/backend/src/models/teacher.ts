import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit_teachers, credit_teachersId } from './credit_teachers';

export interface teacherAttributes {
  id: string;
  name?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type teacherPk = "id";
export type teacherId = teacher[teacherPk];
export type teacherOptionalAttributes = "name" | "created_at" | "updated_at";
export type teacherCreationAttributes = Optional<teacherAttributes, teacherOptionalAttributes>;

export class teacher extends Model<teacherAttributes, teacherCreationAttributes> implements teacherAttributes {
  declare id: string;
  declare name?: string;
  declare created_at?: Date;
  declare updated_at?: Date;

  // teacher hasMany credit_teachers via teacher_id
  declare credit_teachers: credit_teachers[];
  declare getCredit_teachers: Sequelize.HasManyGetAssociationsMixin<credit_teachers>;
  declare setCredit_teachers: Sequelize.HasManySetAssociationsMixin<credit_teachers, credit_teachersId>;
  declare addCredit_teacher: Sequelize.HasManyAddAssociationMixin<credit_teachers, credit_teachersId>;
  declare addCredit_teachers: Sequelize.HasManyAddAssociationsMixin<credit_teachers, credit_teachersId>;
  declare createCredit_teacher: Sequelize.HasManyCreateAssociationMixin<credit_teachers>;
  declare removeCredit_teacher: Sequelize.HasManyRemoveAssociationMixin<credit_teachers, credit_teachersId>;
  declare removeCredit_teachers: Sequelize.HasManyRemoveAssociationsMixin<credit_teachers, credit_teachersId>;
  declare hasCredit_teacher: Sequelize.HasManyHasAssociationMixin<credit_teachers, credit_teachersId>;
  declare hasCredit_teachers: Sequelize.HasManyHasAssociationsMixin<credit_teachers, credit_teachersId>;
  declare countCredit_teachers: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof teacher {
    return teacher.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'teacher',
    schema: 'public',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true,
    indexes: [
      {
        name: "teacher_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
