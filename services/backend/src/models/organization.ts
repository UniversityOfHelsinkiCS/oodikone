import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { course_providers, course_providersId } from './course_providers';
import type { programme_modules, programme_modulesId } from './programme_modules';
import type { sis_study_right_elements, sis_study_right_elementsId } from './sis_study_right_elements';
import type { sis_study_rights, sis_study_rightsId } from './sis_study_rights';
import type { studyright, studyrightId } from './studyright';

export interface organizationAttributes {
  id: string;
  name?: object;
  code?: string;
  created_at?: Date;
  updated_at?: Date;
  parent_id?: string;
}

export type organizationPk = "id";
export type organizationId = organization[organizationPk];
export type organizationOptionalAttributes = "name" | "code" | "created_at" | "updated_at" | "parent_id";
export type organizationCreationAttributes = Optional<organizationAttributes, organizationOptionalAttributes>;

export class organization extends Model<organizationAttributes, organizationCreationAttributes> implements organizationAttributes {
  declare id: string;
  declare name?: object;
  declare code?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare parent_id?: string;

  // organization hasMany course_providers via organizationcode
  declare course_providers: course_providers[];
  declare getCourse_providers: Sequelize.HasManyGetAssociationsMixin<course_providers>;
  declare setCourse_providers: Sequelize.HasManySetAssociationsMixin<course_providers, course_providersId>;
  declare addCourse_provider: Sequelize.HasManyAddAssociationMixin<course_providers, course_providersId>;
  declare addCourse_providers: Sequelize.HasManyAddAssociationsMixin<course_providers, course_providersId>;
  declare createCourse_provider: Sequelize.HasManyCreateAssociationMixin<course_providers>;
  declare removeCourse_provider: Sequelize.HasManyRemoveAssociationMixin<course_providers, course_providersId>;
  declare removeCourse_providers: Sequelize.HasManyRemoveAssociationsMixin<course_providers, course_providersId>;
  declare hasCourse_provider: Sequelize.HasManyHasAssociationMixin<course_providers, course_providersId>;
  declare hasCourse_providers: Sequelize.HasManyHasAssociationsMixin<course_providers, course_providersId>;
  declare countCourse_providers: Sequelize.HasManyCountAssociationsMixin;
  // organization hasMany programme_modules via organization_id
  declare programme_modules: programme_modules[];
  declare getProgramme_modules: Sequelize.HasManyGetAssociationsMixin<programme_modules>;
  declare setProgramme_modules: Sequelize.HasManySetAssociationsMixin<programme_modules, programme_modulesId>;
  declare addProgramme_module: Sequelize.HasManyAddAssociationMixin<programme_modules, programme_modulesId>;
  declare addProgramme_modules: Sequelize.HasManyAddAssociationsMixin<programme_modules, programme_modulesId>;
  declare createProgramme_module: Sequelize.HasManyCreateAssociationMixin<programme_modules>;
  declare removeProgramme_module: Sequelize.HasManyRemoveAssociationMixin<programme_modules, programme_modulesId>;
  declare removeProgramme_modules: Sequelize.HasManyRemoveAssociationsMixin<programme_modules, programme_modulesId>;
  declare hasProgramme_module: Sequelize.HasManyHasAssociationMixin<programme_modules, programme_modulesId>;
  declare hasProgramme_modules: Sequelize.HasManyHasAssociationsMixin<programme_modules, programme_modulesId>;
  declare countProgramme_modules: Sequelize.HasManyCountAssociationsMixin;
  // organization hasMany sis_study_right_elements via faculty_code
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
  // organization hasMany sis_study_rights via faculty_code
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
  // organization hasMany studyright via faculty_code
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

  static initModel(sequelize: Sequelize.Sequelize): typeof organization {
    return organization.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'organization',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "organization_code",
        unique: true,
        fields: [
          { name: "code" },
        ]
      },
      {
        name: "organization_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
