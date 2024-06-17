import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit, creditId } from './credit';
import type { enrollment, enrollmentId } from './enrollment';
import type { semester_enrollments, semester_enrollmentsId } from './semester_enrollments';
import type { semesters, semestersId } from './semesters';
import type { sis_study_rights, sis_study_rightsId } from './sis_study_rights';
import type { studyplan, studyplanId } from './studyplan';
import type { studyright, studyrightId } from './studyright';
import type { studyright_elements, studyright_elementsId } from './studyright_elements';
import type { transfers, transfersId } from './transfers';

export interface studentAttributes {
  studentnumber: string;
  lastname?: string;
  firstnames?: string;
  birthdate?: Date;
  creditcount?: number;
  dateofuniversityenrollment?: Date;
  email?: string;
  national_student_number?: string;
  country_fi?: string;
  country_sv?: string;
  country_en?: string;
  home_country_fi?: string;
  home_country_sv?: string;
  home_country_en?: string;
  gender_code?: string;
  created_at?: Date;
  updated_at?: Date;
  abbreviatedname?: string;
  sis_person_id?: string;
  secondary_email?: string;
  phone_number?: string;
}

export type studentPk = "studentnumber";
export type studentId = student[studentPk];
export type studentOptionalAttributes = "lastname" | "firstnames" | "birthdate" | "creditcount" | "dateofuniversityenrollment" | "email" | "national_student_number" | "country_fi" | "country_sv" | "country_en" | "home_country_fi" | "home_country_sv" | "home_country_en" | "gender_code" | "created_at" | "updated_at" | "abbreviatedname" | "sis_person_id" | "secondary_email" | "phone_number";
export type studentCreationAttributes = Optional<studentAttributes, studentOptionalAttributes>;

export class student extends Model<studentAttributes, studentCreationAttributes> implements studentAttributes {
  declare studentnumber: string;
  declare lastname?: string;
  declare firstnames?: string;
  declare birthdate?: Date;
  declare creditcount?: number;
  declare dateofuniversityenrollment?: Date;
  declare email?: string;
  declare national_student_number?: string;
  declare country_fi?: string;
  declare country_sv?: string;
  declare country_en?: string;
  declare home_country_fi?: string;
  declare home_country_sv?: string;
  declare home_country_en?: string;
  declare gender_code?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare abbreviatedname?: string;
  declare sis_person_id?: string;
  declare secondary_email?: string;
  declare phone_number?: string;

  // student hasMany credit via student_studentnumber
  declare credits: credit[];
  declare getCredits: Sequelize.HasManyGetAssociationsMixin<credit>;
  declare setCredits: Sequelize.HasManySetAssociationsMixin<credit, creditId>;
  declare addCredit: Sequelize.HasManyAddAssociationMixin<credit, creditId>;
  declare addCredits: Sequelize.HasManyAddAssociationsMixin<credit, creditId>;
  declare createCredit: Sequelize.HasManyCreateAssociationMixin<credit>;
  declare removeCredit: Sequelize.HasManyRemoveAssociationMixin<credit, creditId>;
  declare removeCredits: Sequelize.HasManyRemoveAssociationsMixin<credit, creditId>;
  declare hasCredit: Sequelize.HasManyHasAssociationMixin<credit, creditId>;
  declare hasCredits: Sequelize.HasManyHasAssociationsMixin<credit, creditId>;
  declare countCredits: Sequelize.HasManyCountAssociationsMixin;
  // student hasMany enrollment via studentnumber
  declare enrollments: enrollment[];
  declare getEnrollments: Sequelize.HasManyGetAssociationsMixin<enrollment>;
  declare setEnrollments: Sequelize.HasManySetAssociationsMixin<enrollment, enrollmentId>;
  declare addEnrollment: Sequelize.HasManyAddAssociationMixin<enrollment, enrollmentId>;
  declare addEnrollments: Sequelize.HasManyAddAssociationsMixin<enrollment, enrollmentId>;
  declare createEnrollment: Sequelize.HasManyCreateAssociationMixin<enrollment>;
  declare removeEnrollment: Sequelize.HasManyRemoveAssociationMixin<enrollment, enrollmentId>;
  declare removeEnrollments: Sequelize.HasManyRemoveAssociationsMixin<enrollment, enrollmentId>;
  declare hasEnrollment: Sequelize.HasManyHasAssociationMixin<enrollment, enrollmentId>;
  declare hasEnrollments: Sequelize.HasManyHasAssociationsMixin<enrollment, enrollmentId>;
  declare countEnrollments: Sequelize.HasManyCountAssociationsMixin;
  // student hasMany semester_enrollments via studentnumber
  declare semester_enrollments: semester_enrollments[];
  declare getSemester_enrollments: Sequelize.HasManyGetAssociationsMixin<semester_enrollments>;
  declare setSemester_enrollments: Sequelize.HasManySetAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare addSemester_enrollment: Sequelize.HasManyAddAssociationMixin<semester_enrollments, semester_enrollmentsId>;
  declare addSemester_enrollments: Sequelize.HasManyAddAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare createSemester_enrollment: Sequelize.HasManyCreateAssociationMixin<semester_enrollments>;
  declare removeSemester_enrollment: Sequelize.HasManyRemoveAssociationMixin<semester_enrollments, semester_enrollmentsId>;
  declare removeSemester_enrollments: Sequelize.HasManyRemoveAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare hasSemester_enrollment: Sequelize.HasManyHasAssociationMixin<semester_enrollments, semester_enrollmentsId>;
  declare hasSemester_enrollments: Sequelize.HasManyHasAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare countSemester_enrollments: Sequelize.HasManyCountAssociationsMixin;
  // student belongsToMany semesters via studentnumber and semestercomposite
  declare semestercomposite_semesters: semesters[];
  declare getSemestercomposite_semesters: Sequelize.BelongsToManyGetAssociationsMixin<semesters>;
  declare setSemestercomposite_semesters: Sequelize.BelongsToManySetAssociationsMixin<semesters, semestersId>;
  declare addSemestercomposite_semester: Sequelize.BelongsToManyAddAssociationMixin<semesters, semestersId>;
  declare addSemestercomposite_semesters: Sequelize.BelongsToManyAddAssociationsMixin<semesters, semestersId>;
  declare createSemestercomposite_semester: Sequelize.BelongsToManyCreateAssociationMixin<semesters>;
  declare removeSemestercomposite_semester: Sequelize.BelongsToManyRemoveAssociationMixin<semesters, semestersId>;
  declare removeSemestercomposite_semesters: Sequelize.BelongsToManyRemoveAssociationsMixin<semesters, semestersId>;
  declare hasSemestercomposite_semester: Sequelize.BelongsToManyHasAssociationMixin<semesters, semestersId>;
  declare hasSemestercomposite_semesters: Sequelize.BelongsToManyHasAssociationsMixin<semesters, semestersId>;
  declare countSemestercomposite_semesters: Sequelize.BelongsToManyCountAssociationsMixin;
  // student hasMany sis_study_rights via student_number
  declare sis_study_rights: sis_study_rights[];
  declare getSis_study_rights: Sequelize.HasManyGetAssociationsMixin<sis_study_rights>;
  declare setSis_study_rights: Sequelize.HasManySetAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare addSis_study_right: Sequelize.HasManyAddAssociationMixin<sis_study_rights, sis_study_rightsId>;
  declare addSis_study_rights: Sequelize.HasManyAddAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare createSis_study_right: Sequelize.HasManyCreateAssociationMixin<sis_study_rights>;
  declare removeSis_study_right: Sequelize.HasManyRemoveAssociationMixin<sis_study_rights, sis_study_rightsId>;
  declare removeSis_study_rights: Sequelize.HasManyRemoveAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare hasSis_study_right: Sequelize.HasManyHasAssociationMixin<sis_study_rights, sis_study_rightsId>;
  declare hasSis_study_rights: Sequelize.HasManyHasAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare countSis_study_rights: Sequelize.HasManyCountAssociationsMixin;
  // student hasMany studyplan via studentnumber
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
  // student hasMany studyright via student_studentnumber
  declare studyrights: studyright[];
  declare getStudyrights: Sequelize.HasManyGetAssociationsMixin<studyright>;
  declare setStudyrights: Sequelize.HasManySetAssociationsMixin<studyright, studyrightId>;
  declare addStudyright: Sequelize.HasManyAddAssociationMixin<studyright, studyrightId>;
  declare addStudyrights: Sequelize.HasManyAddAssociationsMixin<studyright, studyrightId>;
  declare createStudyright: Sequelize.HasManyCreateAssociationMixin<studyright>;
  declare removeStudyright: Sequelize.HasManyRemoveAssociationMixin<studyright, studyrightId>;
  declare removeStudyrights: Sequelize.HasManyRemoveAssociationsMixin<studyright, studyrightId>;
  declare hasStudyright: Sequelize.HasManyHasAssociationMixin<studyright, studyrightId>;
  declare hasStudyrights: Sequelize.HasManyHasAssociationsMixin<studyright, studyrightId>;
  declare countStudyrights: Sequelize.HasManyCountAssociationsMixin;
  // student hasMany studyright_elements via studentnumber
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
  // student hasMany transfers via studentnumber
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

  static initModel(sequelize: Sequelize.Sequelize): typeof student {
    return student.init({
    studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    lastname: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    firstnames: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    birthdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    creditcount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dateofuniversityenrollment: {
      type: DataTypes.DATE,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    national_student_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    country_fi: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    country_sv: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    country_en: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    home_country_fi: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    home_country_sv: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    home_country_en: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    abbreviatedname: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sis_person_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    secondary_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'student',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "student_pkey",
        unique: true,
        fields: [
          { name: "studentnumber" },
        ]
      },
    ]
  });
  }
}
