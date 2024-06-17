import type { Sequelize } from "sequelize";
import { course as _course } from "./course";
import type { courseAttributes, courseCreationAttributes } from "./course";
import { course_providers as _course_providers } from "./course_providers";
import type { course_providersAttributes, course_providersCreationAttributes } from "./course_providers";
import { course_types as _course_types } from "./course_types";
import type { course_typesAttributes, course_typesCreationAttributes } from "./course_types";
import { credit as _credit } from "./credit";
import type { creditAttributes, creditCreationAttributes } from "./credit";
import { credit_teachers as _credit_teachers } from "./credit_teachers";
import type { credit_teachersAttributes, credit_teachersCreationAttributes } from "./credit_teachers";
import { credit_types as _credit_types } from "./credit_types";
import type { credit_typesAttributes, credit_typesCreationAttributes } from "./credit_types";
import { element_details as _element_details } from "./element_details";
import type { element_detailsAttributes, element_detailsCreationAttributes } from "./element_details";
import { enrollment as _enrollment } from "./enrollment";
import type { enrollmentAttributes, enrollmentCreationAttributes } from "./enrollment";
import { migrations as _migrations } from "./migrations";
import type { migrationsAttributes, migrationsCreationAttributes } from "./migrations";
import { organization as _organization } from "./organization";
import type { organizationAttributes, organizationCreationAttributes } from "./organization";
import { programme_module_children as _programme_module_children } from "./programme_module_children";
import type { programme_module_childrenAttributes, programme_module_childrenCreationAttributes } from "./programme_module_children";
import { programme_modules as _programme_modules } from "./programme_modules";
import type { programme_modulesAttributes, programme_modulesCreationAttributes } from "./programme_modules";
import { semester_enrollments as _semester_enrollments } from "./semester_enrollments";
import type { semester_enrollmentsAttributes, semester_enrollmentsCreationAttributes } from "./semester_enrollments";
import { semesters as _semesters } from "./semesters";
import type { semestersAttributes, semestersCreationAttributes } from "./semesters";
import { sis_study_right_elements as _sis_study_right_elements } from "./sis_study_right_elements";
import type { sis_study_right_elementsAttributes, sis_study_right_elementsCreationAttributes } from "./sis_study_right_elements";
import { sis_study_rights as _sis_study_rights } from "./sis_study_rights";
import type { sis_study_rightsAttributes, sis_study_rightsCreationAttributes } from "./sis_study_rights";
import { student as _student } from "./student";
import type { studentAttributes, studentCreationAttributes } from "./student";
import { studyplan as _studyplan } from "./studyplan";
import type { studyplanAttributes, studyplanCreationAttributes } from "./studyplan";
import { studyright as _studyright } from "./studyright";
import type { studyrightAttributes, studyrightCreationAttributes } from "./studyright";
import { studyright_elements as _studyright_elements } from "./studyright_elements";
import type { studyright_elementsAttributes, studyright_elementsCreationAttributes } from "./studyright_elements";
import { studyright_extents as _studyright_extents } from "./studyright_extents";
import type { studyright_extentsAttributes, studyright_extentsCreationAttributes } from "./studyright_extents";
import { teacher as _teacher } from "./teacher";
import type { teacherAttributes, teacherCreationAttributes } from "./teacher";
import { transfers as _transfers } from "./transfers";
import type { transfersAttributes, transfersCreationAttributes } from "./transfers";

export {
  _course as course,
  _course_providers as course_providers,
  _course_types as course_types,
  _credit as credit,
  _credit_teachers as credit_teachers,
  _credit_types as credit_types,
  _element_details as element_details,
  _enrollment as enrollment,
  _migrations as migrations,
  _organization as organization,
  _programme_module_children as programme_module_children,
  _programme_modules as programme_modules,
  _semester_enrollments as semester_enrollments,
  _semesters as semesters,
  _sis_study_right_elements as sis_study_right_elements,
  _sis_study_rights as sis_study_rights,
  _student as student,
  _studyplan as studyplan,
  _studyright as studyright,
  _studyright_elements as studyright_elements,
  _studyright_extents as studyright_extents,
  _teacher as teacher,
  _transfers as transfers,
};

export type {
  courseAttributes,
  courseCreationAttributes,
  course_providersAttributes,
  course_providersCreationAttributes,
  course_typesAttributes,
  course_typesCreationAttributes,
  creditAttributes,
  creditCreationAttributes,
  credit_teachersAttributes,
  credit_teachersCreationAttributes,
  credit_typesAttributes,
  credit_typesCreationAttributes,
  element_detailsAttributes,
  element_detailsCreationAttributes,
  enrollmentAttributes,
  enrollmentCreationAttributes,
  migrationsAttributes,
  migrationsCreationAttributes,
  organizationAttributes,
  organizationCreationAttributes,
  programme_module_childrenAttributes,
  programme_module_childrenCreationAttributes,
  programme_modulesAttributes,
  programme_modulesCreationAttributes,
  semester_enrollmentsAttributes,
  semester_enrollmentsCreationAttributes,
  semestersAttributes,
  semestersCreationAttributes,
  sis_study_right_elementsAttributes,
  sis_study_right_elementsCreationAttributes,
  sis_study_rightsAttributes,
  sis_study_rightsCreationAttributes,
  studentAttributes,
  studentCreationAttributes,
  studyplanAttributes,
  studyplanCreationAttributes,
  studyrightAttributes,
  studyrightCreationAttributes,
  studyright_elementsAttributes,
  studyright_elementsCreationAttributes,
  studyright_extentsAttributes,
  studyright_extentsCreationAttributes,
  teacherAttributes,
  teacherCreationAttributes,
  transfersAttributes,
  transfersCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const course = _course.initModel(sequelize);
  const course_providers = _course_providers.initModel(sequelize);
  const course_types = _course_types.initModel(sequelize);
  const credit = _credit.initModel(sequelize);
  const credit_teachers = _credit_teachers.initModel(sequelize);
  const credit_types = _credit_types.initModel(sequelize);
  const element_details = _element_details.initModel(sequelize);
  const enrollment = _enrollment.initModel(sequelize);
  const migrations = _migrations.initModel(sequelize);
  const organization = _organization.initModel(sequelize);
  const programme_module_children = _programme_module_children.initModel(sequelize);
  const programme_modules = _programme_modules.initModel(sequelize);
  const semester_enrollments = _semester_enrollments.initModel(sequelize);
  const semesters = _semesters.initModel(sequelize);
  const sis_study_right_elements = _sis_study_right_elements.initModel(sequelize);
  const sis_study_rights = _sis_study_rights.initModel(sequelize);
  const student = _student.initModel(sequelize);
  const studyplan = _studyplan.initModel(sequelize);
  const studyright = _studyright.initModel(sequelize);
  const studyright_elements = _studyright_elements.initModel(sequelize);
  const studyright_extents = _studyright_extents.initModel(sequelize);
  const teacher = _teacher.initModel(sequelize);
  const transfers = _transfers.initModel(sequelize);

  semesters.belongsToMany(student, { as: 'studentnumber_students', through: semester_enrollments, foreignKey: "semestercomposite", otherKey: "studentnumber" });
  student.belongsToMany(semesters, { as: 'semestercomposite_semesters', through: semester_enrollments, foreignKey: "studentnumber", otherKey: "semestercomposite" });
  course_providers.belongsTo(course, { as: "coursecode_course", foreignKey: "coursecode"});
  course.hasMany(course_providers, { as: "course_providers", foreignKey: "coursecode"});
  credit.belongsTo(course, { as: "course", foreignKey: "course_id"});
  course.hasMany(credit, { as: "credits", foreignKey: "course_id"});
  enrollment.belongsTo(course, { as: "course", foreignKey: "course_id"});
  course.hasMany(enrollment, { as: "enrollments", foreignKey: "course_id"});
  credit_teachers.belongsTo(credit, { as: "credit", foreignKey: "credit_id"});
  credit.hasMany(credit_teachers, { as: "credit_teachers", foreignKey: "credit_id"});
  credit.belongsTo(credit_types, { as: "credittypecode_credit_type", foreignKey: "credittypecode"});
  credit_types.hasMany(credit, { as: "credits", foreignKey: "credittypecode"});
  studyright_elements.belongsTo(element_details, { as: "code_element_detail", foreignKey: "code"});
  element_details.hasMany(studyright_elements, { as: "studyright_elements", foreignKey: "code"});
  transfers.belongsTo(element_details, { as: "sourcecode_element_detail", foreignKey: "sourcecode"});
  element_details.hasMany(transfers, { as: "transfers", foreignKey: "sourcecode"});
  transfers.belongsTo(element_details, { as: "targetcode_element_detail", foreignKey: "targetcode"});
  element_details.hasMany(transfers, { as: "targetcode_transfers", foreignKey: "targetcode"});
  course_providers.belongsTo(organization, { as: "organizationcode_organization", foreignKey: "organizationcode"});
  organization.hasMany(course_providers, { as: "course_providers", foreignKey: "organizationcode"});
  programme_modules.belongsTo(organization, { as: "organization", foreignKey: "organization_id"});
  organization.hasMany(programme_modules, { as: "programme_modules", foreignKey: "organization_id"});
  sis_study_right_elements.belongsTo(organization, { as: "faculty_code_organization", foreignKey: "faculty_code"});
  organization.hasMany(sis_study_right_elements, { as: "sis_study_right_elements", foreignKey: "faculty_code"});
  sis_study_rights.belongsTo(organization, { as: "faculty_code_organization", foreignKey: "faculty_code"});
  organization.hasMany(sis_study_rights, { as: "sis_study_rights", foreignKey: "faculty_code"});
  studyright.belongsTo(organization, { as: "faculty_code_organization", foreignKey: "faculty_code"});
  organization.hasMany(studyright, { as: "studyrights", foreignKey: "faculty_code"});
  programme_module_children.belongsTo(programme_modules, { as: "parent", foreignKey: "parent_id"});
  programme_modules.hasMany(programme_module_children, { as: "programme_module_children", foreignKey: "parent_id"});
  credit.belongsTo(semesters, { as: "semester_composite_semester", foreignKey: "semester_composite"});
  semesters.hasMany(credit, { as: "credits", foreignKey: "semester_composite"});
  enrollment.belongsTo(semesters, { as: "semester_composite_semester", foreignKey: "semester_composite"});
  semesters.hasMany(enrollment, { as: "enrollments", foreignKey: "semester_composite"});
  semester_enrollments.belongsTo(semesters, { as: "semestercomposite_semester", foreignKey: "semestercomposite"});
  semesters.hasMany(semester_enrollments, { as: "semester_enrollments", foreignKey: "semestercomposite"});
  sis_study_right_elements.belongsTo(sis_study_rights, { as: "study_right", foreignKey: "study_right_id"});
  sis_study_rights.hasMany(sis_study_right_elements, { as: "sis_study_right_elements", foreignKey: "study_right_id"});
  credit.belongsTo(student, { as: "student_studentnumber_student", foreignKey: "student_studentnumber"});
  student.hasMany(credit, { as: "credits", foreignKey: "student_studentnumber"});
  enrollment.belongsTo(student, { as: "studentnumber_student", foreignKey: "studentnumber"});
  student.hasMany(enrollment, { as: "enrollments", foreignKey: "studentnumber"});
  semester_enrollments.belongsTo(student, { as: "studentnumber_student", foreignKey: "studentnumber"});
  student.hasMany(semester_enrollments, { as: "semester_enrollments", foreignKey: "studentnumber"});
  sis_study_rights.belongsTo(student, { as: "student_number_student", foreignKey: "student_number"});
  student.hasMany(sis_study_rights, { as: "sis_study_rights", foreignKey: "student_number"});
  studyplan.belongsTo(student, { as: "studentnumber_student", foreignKey: "studentnumber"});
  student.hasMany(studyplan, { as: "studyplans", foreignKey: "studentnumber"});
  studyright.belongsTo(student, { as: "student_studentnumber_student", foreignKey: "student_studentnumber"});
  student.hasMany(studyright, { as: "studyrights", foreignKey: "student_studentnumber"});
  studyright_elements.belongsTo(student, { as: "studentnumber_student", foreignKey: "studentnumber"});
  student.hasMany(studyright_elements, { as: "studyright_elements", foreignKey: "studentnumber"});
  transfers.belongsTo(student, { as: "studentnumber_student", foreignKey: "studentnumber"});
  student.hasMany(transfers, { as: "transfers", foreignKey: "studentnumber"});
  studyplan.belongsTo(studyright, { as: "studyright", foreignKey: "studyrightid"});
  studyright.hasMany(studyplan, { as: "studyplans", foreignKey: "studyrightid"});
  studyright_elements.belongsTo(studyright, { as: "studyright", foreignKey: "studyrightid"});
  studyright.hasMany(studyright_elements, { as: "studyright_elements", foreignKey: "studyrightid"});
  transfers.belongsTo(studyright, { as: "studyright", foreignKey: "studyrightid"});
  studyright.hasMany(transfers, { as: "transfers", foreignKey: "studyrightid"});
  sis_study_rights.belongsTo(studyright_extents, { as: "extent_code_studyright_extent", foreignKey: "extent_code"});
  studyright_extents.hasMany(sis_study_rights, { as: "sis_study_rights", foreignKey: "extent_code"});
  studyright.belongsTo(studyright_extents, { as: "extentcode_studyright_extent", foreignKey: "extentcode"});
  studyright_extents.hasMany(studyright, { as: "studyrights", foreignKey: "extentcode"});
  credit_teachers.belongsTo(teacher, { as: "teacher", foreignKey: "teacher_id"});
  teacher.hasMany(credit_teachers, { as: "credit_teachers", foreignKey: "teacher_id"});

  return {
    Course: course,
    CourseProviders: course_providers,
    CourseTypes: course_types,
    Credit: credit,
    CreditTeachers: credit_teachers,
    CreditTypes: credit_types,
    ElementDetails: element_details,
    Enrollment: enrollment,
    Migrations: migrations,
    Organization: organization,
    ProgrammeModuleChildren: programme_module_children,
    ProgrammeModules: programme_modules,
    SemesterEnrollments: semester_enrollments,
    Semesters: semesters,
    SisStudyRightElements: sis_study_right_elements,
    SisStudyRights: sis_study_rights,
    Student: student,
    Studyplan: studyplan,
    Studyright: studyright,
    StudyrightElements: studyright_elements,
    StudyrightExtents: studyright_extents,
    Teacher: teacher,
    Transfers: transfers,
  };
}
