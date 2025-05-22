import { FC } from 'react'
import { Dropdown, Form } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const STATUS_OPTIONS = [
  { key: 'enrl-status-present', text: 'Present', value: 1 },
  { key: 'enrl-status-absent', text: 'Absent', value: 2 },
  { key: 'enrl-status-inactive', text: 'Passive', value: 3 },
]

const EnrollmentStatusFilterCard: FC<{
  options: any
  onOptionsChange: any
  allSemesters: Record<string, any>
}> = ({ options, onOptionsChange, allSemesters }) => {
  const name = 'enrollmentStatusFilter'
  const { getTextIn } = useLanguage()

  if (!Object.keys(allSemesters).length) {
    return null
  }

  const { semesters, status } = options

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

  filter({ studyRights }, { status, semesters }, { args }) {
    if (args.programme) {
      const correctStudyRight = studyRights.find(({ studyRightElements }) =>
        studyRightElements.some(({ code }) => code === args.programme)
      )

      return semesters.every(
        semester =>
          correctStudyRight.semesterEnrollments.find(
            ({ semester: enrollmentSemester }) => enrollmentSemester === semester
          )?.type === status
      )
    }

    const allEnrollments = studyRights.flatMap(studyRight => studyRight.semesterEnrollments).filter(Boolean)

    return semesters.every(semester => {
      // HACK: If enrollment info not found, return false. This may or may not be what we want?
      return allEnrollments
        .filter(({ semester: enrollmentSemester }) => enrollmentSemester === semester)
        .some(({ type }) => type === status)
    })
  },

  render: (props, { args }) => <EnrollmentStatusFilterCard {...props} allSemesters={args.allSemesters} />,
})
