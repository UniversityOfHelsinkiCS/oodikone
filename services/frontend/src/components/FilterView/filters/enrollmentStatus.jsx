import { Dropdown, Form } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const STATUS_OPTIONS = [
  { key: 'enrl-status-present', text: 'Present', value: 1 },
  { key: 'enrl-status-absent', text: 'Absent', value: 2 },
  { key: 'enrl-status-inactive', text: 'Passive', value: 3 },
]

const EnrollmentStatusFilterCard = ({ options, onOptionsChange, allSemesters }) => {
  const name = 'enrollmentStatusFilter'
  const { getTextIn } = useLanguage()

  const { semesters, status } = options

  if (!Object.keys(allSemesters).length) {
    return null
  }

  const semesterOptions = Object.values(allSemesters)
    .filter(semester => new Date(semester.startdate) <= new Date())
    .sort((a, b) => b.semestercode - a.semestercode)
    .map(({ semestercode, name }) => ({
      key: `semester-option-${semestercode}`,
      text: getTextIn(name),
      value: semestercode,
    }))

  return (
    <div className="card-content">
      <Form>
        <Form.Field>
          <Dropdown
            button
            className="mini"
            clearable
            data-cy={`${name}-status`}
            fluid
            onChange={(_, { value }) =>
              onOptionsChange({
                ...options,
                status: value !== '' ? value : null,
              })
            }
            options={STATUS_OPTIONS}
            placeholder="Choose enrollment status"
            selection
            value={status}
          />
        </Form.Field>
        <Form.Field>
          <Dropdown
            button
            className="mini"
            data-cy={`${name}-semesters`}
            fluid
            multiple
            onChange={(_, { value }) =>
              onOptionsChange({
                ...options,
                semesters: value,
              })
            }
            options={semesterOptions}
            placeholder="Choose semesters"
            selection
            value={semesters}
          />
        </Form.Field>
      </Form>
    </div>
  )
}

export const enrollmentStatusFilter = createFilter({
  key: 'EnrollmentStatus',

  title: 'Enrollment status',

  info: filterToolTips.enrollmentStatus,
  defaultOptions: {
    status: null,
    semesters: [],
  },

  isActive: ({ status }) => status !== null,

  filter(student, { status, semesters }, { args }) {
    if (args.programme) {
      const correctStudyRight = student.studyRights.find(studyRight =>
        studyRight.studyRightElements.some(element => element.code === args.programme)
      )
      return correctStudyRight
        ? semesters.every(semester => {
            const enrollment = correctStudyRight.semesterEnrollments.find(
              enrollment => enrollment.semester === semester
            )
            return enrollment ? enrollment.type === status : false
          })
        : false
    }

    const allEnrollments = student.studyRights
      .flatMap(studyRight => studyRight.semesterEnrollments)
      .filter(enrollment => enrollment != null)

    return semesters.every(semester => {
      const enrollments = allEnrollments.filter(enrl => enrl.semester === semester)
      // If enrollment info not found, return false. This may or may not be what we want?
      return enrollments.length ? enrollments.some(enrl => enrl.type === status) : false
    })
  },

  render: (props, { args }) => <EnrollmentStatusFilterCard {...props} allSemesters={args.allSemesters} />,
})
