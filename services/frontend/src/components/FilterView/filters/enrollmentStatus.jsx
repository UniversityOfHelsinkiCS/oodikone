import React from 'react'
import fp from 'lodash/fp'
import { Form, Dropdown } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import filterInfo from '../../../common/InfoToolTips/filters'
import createFilter from './createFilter'

const STATUS_OPTIONS = [
  { key: 'enrl-status-present', text: 'Present', value: 1 },
  { key: 'enrl-status-absent', text: 'Absent', value: 2 },
  { key: 'enrl-status-inactive', text: 'Passive', value: 3 },
]

const EnrollmentStatusFilterCard = ({ options, onOptionsChange, allSemesters, language, semesterCodes }) => {
  // const [status, setStatus] = useState(null)
  // const [semesters, setSemesters] = useState([])
  // const { allStudents, addFilter, removeFilter } = useFilters()
  const name = 'enrollmentStatusFilter'
  // const active = !!status && !!semesters.length

  const { semesters, status } = options

  if (!Object.keys(allSemesters).length) {
    return null
  }

  const semesterOptions = semesterCodes.map(code => ({
    key: `semester-option-${code}`,
    text: getTextIn(allSemesters[code].name, language),
    value: code,
  }))

  return (
    <div className="card-content">
      <Form>
        <Form.Field>
          <Dropdown
            options={STATUS_OPTIONS}
            value={status}
            onChange={(_, { value }) =>
              onOptionsChange({
                ...options,
                status: value !== '' ? value : null,
              })
            }
            placeholder="Choose Enrollment Status"
            className="mini"
            selection
            fluid
            button
            clearable
            data-cy={`${name}-status`}
          />
        </Form.Field>
        <Form.Field>
          <Dropdown
            multiple
            selection
            fluid
            options={semesterOptions}
            button
            className="mini"
            placeholder="Choose Semesters"
            onChange={(_, { value }) =>
              onOptionsChange({
                ...options,
                semesters: value,
              })
            }
            value={semesters}
            data-cy={`${name}-semesters`}
          />
        </Form.Field>
      </Form>
    </div>
  )
}

export default createFilter({
  key: 'EnrollmentStatus',

  title: 'Enrollment Status',

  info: filterInfo.enrollmentStatus,
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
    <EnrollmentStatusFilterCard
      {...props}
      semesterCodes={precomputed.semesterCodes}
      allSemesters={args.allSemesters}
      language={args.language}
    />
  ),
})
