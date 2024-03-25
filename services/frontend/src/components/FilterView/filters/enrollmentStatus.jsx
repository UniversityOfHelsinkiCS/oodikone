import fp from 'lodash/fp'
import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const STATUS_OPTIONS = [
  { key: 'enrl-status-present', text: 'Present', value: 1 },
  { key: 'enrl-status-absent', text: 'Absent', value: 2 },
  { key: 'enrl-status-inactive', text: 'Passive', value: 3 },
]

const EnrollmentStatusFilterCard = ({ options, onOptionsChange, allSemesters, semesterCodes }) => {
  const name = 'enrollmentStatusFilter'
  const { getTextIn } = useLanguage()

  const { semesters, status } = options

  if (!Object.keys(allSemesters).length) {
    return null
  }

  const semesterOptions = semesterCodes
    .sort((prev, cur) => cur - prev)
    .map(code => ({
      key: `semester-option-${code}`,
      text: getTextIn(allSemesters[code].name),
      value: code,
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
            placeholder="Choose Enrollment Status"
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
            placeholder="Choose Semesters"
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

  precompute: fp.flow(
    ({ students }) => students,
    fp.map('semesterenrollments'),
    fp.flatten,
    fp.map('semestercode'),
    fp.uniq,
    semesterCodes => ({ semesterCodes })
  ),

  filter(student, { status, semesters }) {
    return semesters.every(sem => {
      const enrollment = student.semesterenrollments.find(enrl => enrl.semestercode === sem)
      // If enrollment info not found, return false. This may or may not be what we want?
      return enrollment ? enrollment.enrollmenttype === status : false
    })
  },

  render: (props, { precomputed, args }) => (
    <EnrollmentStatusFilterCard {...props} allSemesters={args.allSemesters} semesterCodes={precomputed.semesterCodes} />
  ),
})
