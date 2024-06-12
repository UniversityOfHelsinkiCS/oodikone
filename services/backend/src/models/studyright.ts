import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { organization, organizationId } from './organization';
import type { student, studentId } from './student';
import type { studyplan, studyplanId } from './studyplan';
import type { studyright_elements, studyright_elementsId } from './studyright_elements';
import type { studyright_extents, studyright_extentsId } from './studyright_extents';
import type { transfers, transfersId } from './transfers';

export interface studyrightAttributes {
  studyrightid: string;
  startdate?: Date;
  enddate?: Date;
  givendate?: Date;
  studystartdate?: Date;
  graduated?: number;
  student_studentnumber?: string;
  faculty_code?: string;
  prioritycode?: number;
  extentcode?: number;
  created_at?: Date;
  updated_at?: Date;
  admission_type?: string;
  active?: number;
  cancelled?: boolean;
  actual_studyrightid?: string;
  is_ba_ma?: boolean;
  semester_enrollments?: object;
}

export type studyrightPk = "studyrightid";
export type studyrightId = studyright[studyrightPk];
export type studyrightOptionalAttributes = "startdate" | "enddate" | "givendate" | "studystartdate" | "graduated" | "student_studentnumber" | "faculty_code" | "prioritycode" | "extentcode" | "created_at" | "updated_at" | "admission_type" | "active" | "cancelled" | "actual_studyrightid" | "is_ba_ma" | "semester_enrollments";
export type studyrightCreationAttributes = Optional<studyrightAttributes, studyrightOptionalAttributes>;

export class studyright extends Model<studyrightAttributes, studyrightCreationAttributes> implements studyrightAttributes {
  declare studyrightid: string;
  declare startdate?: Date;
  declare enddate?: Date;
  declare givendate?: Date;
  declare studystartdate?: Date;
  declare graduated?: number;
  declare student_studentnumber?: string;
  declare faculty_code?: string;
  declare prioritycode?: number;
  declare extentcode?: number;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare admission_type?: string;
  declare active?: number;
  declare cancelled?: boolean;
  declare actual_studyrightid?: string;
  declare is_ba_ma?: boolean;
  declare semester_enrollments?: object;

  // studyright belongsTo organization via faculty_code
  declare faculty_code_organization: organization;
  declare getFaculty_code_organization: Sequelize.BelongsToGetAssociationMixin<organization>;
  declare setFaculty_code_organization: Sequelize.BelongsToSetAssociationMixin<organization, organizationId>;
  declare createFaculty_code_organization: Sequelize.BelongsToCreateAssociationMixin<organization>;
  // studyright belongsTo student via student_studentnumber
  declare student_studentnumber_student: student;
  declare getStudent_studentnumber_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudent_studentnumber_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudent_studentnumber_student: Sequelize.BelongsToCreateAssociationMixin<student>;
  // studyright hasMany studyplan via studyrightid
  declare studyplans: studyplan[];
  declare getStudyplans: Sequelize.HasManyGetAssociationsMixin<studyplan>;
  declare setStudyplans: Sequelize.HasManySetAssociationsMixin<studyplan, studyplanId>;
  declare addStudyplan: Sequelize.HasManyAddAssociationMixin<studyplan, studyplanId>;
  declare addStudyplans: Sequelize.HasManyAddAssociationsMixin<studyplan, studyplanId>;
  declare createStudyplan: Sequelize.HasManyCreateAssociationMixin<studyplan>;
  declare removeStudyplan: Sequelize.HasManyRemoveAssociationMixin<studyplan, studyplanId>;
  declare removeStudyplans: Sequelize.HasManyRemoveAssociationsMixin<studyplan, studyplanId>;
  declare hasStudyplan: Sequelize.HasManyHasAssociationMixin<studyplan, studyplanId>;
  declare hasStudyplans: Sequelize.HasManyHasAssociationsMixin<studyplan, studyplanId>;
  declare countStudyplans: Sequelize.HasManyCountAssociationsMixin;
  // studyright hasMany studyright_elements via studyrightid
  declare studyright_elements: studyright_elements[];
  declare getStudyright_elements: Sequelize.HasManyGetAssociationsMixin<studyright_elements>;
  declare setStudyright_elements: Sequelize.HasManySetAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare addStudyright_element: Sequelize.HasManyAddAssociationMixin<studyright_elements, studyright_elementsId>;
  declare addStudyright_elements: Sequelize.HasManyAddAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare createStudyright_element: Sequelize.HasManyCreateAssociationMixin<studyright_elements>;
  declare removeStudyright_element: Sequelize.HasManyRemoveAssociationMixin<studyright_elements, studyright_elementsId>;
  declare removeStudyright_elements: Sequelize.HasManyRemoveAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare hasStudyright_element: Sequelize.HasManyHasAssociationMixin<studyright_elements, studyright_elementsId>;
  declare hasStudyright_elements: Sequelize.HasManyHasAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare countStudyright_elements: Sequelize.HasManyCountAssociationsMixin;
  // studyright hasMany transfers via studyrightid
  declare transfers: transfers[];
  declare getTransfers: Sequelize.HasManyGetAssociationsMixin<transfers>;
  declare setTransfers: Sequelize.HasManySetAssociationsMixin<transfers, transfersId>;
  declare addTransfer: Sequelize.HasManyAddAssociationMixin<transfers, transfersId>;
  declare addTransfers: Sequelize.HasManyAddAssociationsMixin<transfers, transfersId>;
  declare createTransfer: Sequelize.HasManyCreateAssociationMixin<transfers>;
  declare removeTransfer: Sequelize.HasManyRemoveAssociationMixin<transfers, transfersId>;
  declare removeTransfers: Sequelize.HasManyRemoveAssociationsMixin<transfers, transfersId>;
  declare hasTransfer: Sequelize.HasManyHasAssociationMixin<transfers, transfersId>;
  declare hasTransfers: Sequelize.HasManyHasAssociationsMixin<transfers, transfersId>;
  declare countTransfers: Sequelize.HasManyCountAssociationsMixin;
  // studyright belongsTo studyright_extents via extentcode
  declare extentcode_studyright_extent: studyright_extents;
  declare getExtentcode_studyright_extent: Sequelize.BelongsToGetAssociationMixin<studyright_extents>;
  declare setExtentcode_studyright_extent: Sequelize.BelongsToSetAssociationMixin<studyright_extents, studyright_extentsId>;
  declare createExtentcode_studyright_extent: Sequelize.BelongsToCreateAssociationMixin<studyright_extents>;

  static initModel(sequelize: Sequelize.Sequelize): typeof studyright {
    return studyright.init({
    studyrightid: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    startdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    enddate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    givendate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    studystartdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    graduated: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    student_studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    faculty_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'organization',
        key: 'code'
      }
    },
    prioritycode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    extentcode: {
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
    active: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cancelled: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    actual_studyrightid: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_ba_ma: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    semester_enrollments: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'studyright',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "studyright_extentcode",
        fields: [
          { name: "extentcode" },
        ]
      },
      {
        name: "studyright_pkey",
        unique: true,
        fields: [
          { name: "studyrightid" },
        ]
      },
      {
        name: "studyright_student_studentnumber",
        fields: [
          { name: "student_studentnumber" },
        ]
      },
    ]
  });
  }
}
