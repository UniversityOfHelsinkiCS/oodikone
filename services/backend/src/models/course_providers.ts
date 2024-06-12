import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { course, courseId } from './course';
import type { organization, organizationId } from './organization';

export interface course_providersAttributes {
  composite: string;
  coursecode?: string;
  organizationcode?: string;
  created_at?: Date;
  updated_at?: Date;
  shares?: object;
}

export type course_providersPk = "composite";
export type course_providersId = course_providers[course_providersPk];
export type course_providersOptionalAttributes = "coursecode" | "organizationcode" | "created_at" | "updated_at" | "shares";
export type course_providersCreationAttributes = Optional<course_providersAttributes, course_providersOptionalAttributes>;

export class course_providers extends Model<course_providersAttributes, course_providersCreationAttributes> implements course_providersAttributes {
  declare composite: string;
  declare coursecode?: string;
  declare organizationcode?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare shares?: object;

  // course_providers belongsTo course via coursecode
  declare coursecode_course: course;
  declare getCoursecode_course: Sequelize.BelongsToGetAssociationMixin<course>;
  declare setCoursecode_course: Sequelize.BelongsToSetAssociationMixin<course, courseId>;
  declare createCoursecode_course: Sequelize.BelongsToCreateAssociationMixin<course>;
  // course_providers belongsTo organization via organizationcode
  declare organizationcode_organization: organization;
  declare getOrganizationcode_organization: Sequelize.BelongsToGetAssociationMixin<organization>;
  declare setOrganizationcode_organization: Sequelize.BelongsToSetAssociationMixin<organization, organizationId>;
  declare createOrganizationcode_organization: Sequelize.BelongsToCreateAssociationMixin<organization>;

  static initModel(sequelize: Sequelize.Sequelize): typeof course_providers {
    return course_providers.init({
    composite: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    coursecode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'course',
        key: 'id'
      }
    },
    organizationcode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'organization',
        key: 'id'
      }
    },
    shares: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'course_providers',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "course_providers_coursecode",
        fields: [
          { name: "coursecode" },
        ]
      },
      {
        name: "course_providers_coursecode_organizationcode",
        unique: true,
        fields: [
          { name: "coursecode" },
          { name: "organizationcode" },
        ]
      },
      {
        name: "course_providers_organizationcode",
        fields: [
          { name: "organizationcode" },
        ]
      },
      {
        name: "course_providers_pkey",
        unique: true,
        fields: [
          { name: "composite" },
        ]
      },
    ]
  });
  }
}
