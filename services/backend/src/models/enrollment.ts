import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import type { Enrollment } from '@oodikone/shared/models'

import { CourseModel } from './course'
import { SemesterModel } from './semester'
import { SISStudyRightModel } from './SISStudyRight'
import { StudentModel } from './student'

@Table({
  underscored: false,
  modelName: 'enrollment',
  tableName: 'enrollment',
})
export class EnrollmentModel extends Model implements Enrollment {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: Enrollment['id']

  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  declare studentnumber: Enrollment['studentnumber']

  @BelongsTo(() => StudentModel, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  declare student: Enrollment['student']

  @Column(DataType.STRING)
  declare course_code: Enrollment['course_code']

  @Column(DataType.STRING)
  declare state: Enrollment['state']

  @Column(DataType.DATE)
  declare enrollment_date_time: Enrollment['enrollment_date_time']

  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  declare course_id: Enrollment['course_id']

  @ForeignKey(() => SemesterModel)
  @Column(DataType.STRING)
  declare semester_composite: Enrollment['semester_composite']

  @BelongsTo(() => SemesterModel, { foreignKey: 'semester_composite', targetKey: 'composite' })
  declare semester: Enrollment['semester']

  @Column(DataType.INTEGER)
  declare semestercode: Enrollment['semestercode']

  @Column(DataType.BOOLEAN)
  declare is_open: Enrollment['is_open']

  @ForeignKey(() => SISStudyRightModel)
  @Column({ type: DataType.STRING, allowNull: true })
  declare studyright_id: Enrollment['studyright_id']

  @BelongsTo(() => SISStudyRightModel, { foreignKey: 'studyright_id', targetKey: 'id', constraints: false })
  declare studyright: Enrollment['studyright']

  @BelongsTo(() => CourseModel, { foreignKey: 'course_id', targetKey: 'id' })
  declare course: Enrollment['course']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Enrollment['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Enrollment['updatedAt']
}
