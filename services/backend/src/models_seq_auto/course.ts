import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { course_providers, course_providersId } from './course_providers';
import type { credit, creditId } from './credit';
import type { enrollment, enrollmentId } from './enrollment';

export interface courseAttributes {
  id: string;
  name?: object;
  code?: string;
  latest_instance_date?: Date;
  is_study_module?: boolean;
  coursetypecode?: string;
  startdate?: Date;
  enddate?: Date;
  max_attainment_date?: Date;
  min_attainment_date?: Date;
  created_at?: Date;
  updated_at?: Date;
  substitutions?: object;
  course_unit_type?: string;
  main_course_code?: string;
}

export type coursePk = "id";
export type courseId = course[coursePk];
export type courseOptionalAttributes = "name" | "code" | "latest_instance_date" | "is_study_module" | "coursetypecode" | "startdate" | "enddate" | "max_attainment_date" | "min_attainment_date" | "created_at" | "updated_at" | "substitutions" | "course_unit_type" | "main_course_code";
export type courseCreationAttributes = Optional<courseAttributes, courseOptionalAttributes>;

export class course extends Model<courseAttributes, courseCreationAttributes> implements courseAttributes {
  declare id: string;
  declare name?: object;
  declare code?: string;
  declare latest_instance_date?: Date;
  declare is_study_module?: boolean;
  declare coursetypecode?: string;
  declare startdate?: Date;
  declare enddate?: Date;
  declare max_attainment_date?: Date;
  declare min_attainment_date?: Date;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare substitutions?: object;
  declare course_unit_type?: string;
  declare main_course_code?: string;

  // course hasMany course_providers via coursecode
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
  // course hasMany credit via course_id
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
  // course hasMany enrollment via course_id
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

  static initModel(sequelize: Sequelize.Sequelize): typeof course {
    return course.init({
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
    latest_instance_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_study_module: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    coursetypecode: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    startdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    enddate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    max_attainment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    min_attainment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    substitutions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    course_unit_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    main_course_code: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'course',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "course_code",
        fields: [
          { name: "code" },
        ]
      },
      {
        name: "course_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
