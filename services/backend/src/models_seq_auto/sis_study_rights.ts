import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { organization, organizationId } from './organization';
import type { sis_study_right_elements, sis_study_right_elementsId } from './sis_study_right_elements';
import type { student, studentId } from './student';
import type { studyright_extents, studyright_extentsId } from './studyright_extents';

export interface sis_study_rightsAttributes {
  id: string;
  start_date?: Date;
  end_date?: Date;
  study_start_date?: Date;
  cancelled?: boolean;
  student_number?: string;
  extent_code?: number;
  admission_type?: string;
  semester_enrollments?: object;
  created_at?: Date;
  updated_at?: Date;
  faculty_code?: string;
}

export type sis_study_rightsPk = "id";
export type sis_study_rightsId = sis_study_rights[sis_study_rightsPk];
export type sis_study_rightsOptionalAttributes = "start_date" | "end_date" | "study_start_date" | "cancelled" | "student_number" | "extent_code" | "admission_type" | "semester_enrollments" | "created_at" | "updated_at" | "faculty_code";
export type sis_study_rightsCreationAttributes = Optional<sis_study_rightsAttributes, sis_study_rightsOptionalAttributes>;

export class sis_study_rights extends Model<sis_study_rightsAttributes, sis_study_rightsCreationAttributes> implements sis_study_rightsAttributes {
  declare id: string;
  declare start_date?: Date;
  declare end_date?: Date;
  declare study_start_date?: Date;
  declare cancelled?: boolean;
  declare student_number?: string;
  declare extent_code?: number;
  declare admission_type?: string;
  declare semester_enrollments?: object;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare faculty_code?: string;

  // sis_study_rights belongsTo organization via faculty_code
  declare faculty_code_organization: organization;
  declare getFaculty_code_organization: Sequelize.BelongsToGetAssociationMixin<organization>;
  declare setFaculty_code_organization: Sequelize.BelongsToSetAssociationMixin<organization, organizationId>;
  declare createFaculty_code_organization: Sequelize.BelongsToCreateAssociationMixin<organization>;
  // sis_study_rights hasMany sis_study_right_elements via study_right_id
  declare sis_study_right_elements: sis_study_right_elements[];
  declare getSis_study_right_elements: Sequelize.HasManyGetAssociationsMixin<sis_study_right_elements>;
  declare setSis_study_right_elements: Sequelize.HasManySetAssociationsMixin<sis_study_right_elements, sis_study_right_elementsId>;
  declare addSis_study_right_element: Sequelize.HasManyAddAssociationMixin<sis_study_right_elements, sis_study_right_elementsId>;
  declare addSis_study_right_elements: Sequelize.HasManyAddAssociationsMixin<sis_study_right_elements, sis_study_right_elementsId>;
  declare createSis_study_right_element: Sequelize.HasManyCreateAssociationMixin<sis_study_right_elements>;
  declare removeSis_study_right_element: Sequelize.HasManyRemoveAssociationMixin<sis_study_right_elements, sis_study_right_elementsId>;
  declare removeSis_study_right_elements: Sequelize.HasManyRemoveAssociationsMixin<sis_study_right_elements, sis_study_right_elementsId>;
  declare hasSis_study_right_element: Sequelize.HasManyHasAssociationMixin<sis_study_right_elements, sis_study_right_elementsId>;
  declare hasSis_study_right_elements: Sequelize.HasManyHasAssociationsMixin<sis_study_right_elements, sis_study_right_elementsId>;
  declare countSis_study_right_elements: Sequelize.HasManyCountAssociationsMixin;
  // sis_study_rights belongsTo student via student_number
  declare student_number_student: student;
  declare getStudent_number_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudent_number_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudent_number_student: Sequelize.BelongsToCreateAssociationMixin<student>;
  // sis_study_rights belongsTo studyright_extents via extent_code
  declare extent_code_studyright_extent: studyright_extents;
  declare getExtent_code_studyright_extent: Sequelize.BelongsToGetAssociationMixin<studyright_extents>;
  declare setExtent_code_studyright_extent: Sequelize.BelongsToSetAssociationMixin<studyright_extents, studyright_extentsId>;
  declare createExtent_code_studyright_extent: Sequelize.BelongsToCreateAssociationMixin<studyright_extents>;

  static initModel(sequelize: Sequelize.Sequelize): typeof sis_study_rights {
    return sis_study_rights.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    study_start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    student_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    extent_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'studyright_extents',
        key: 'extentcode'
      }
    },
    admission_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    semester_enrollments: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    faculty_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'organization',
        key: 'code'
      }
    }
  }, {
    sequelize,
    tableName: 'sis_study_rights',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "sis_study_rights_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
