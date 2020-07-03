import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import lodash from 'lodash'
import { Form, Dropdown } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'

const EnrollmentStatus = ({ filterControl, allSemesters, language }) => {
  const [status, setStatus] = useState(null)
  const [semesters, setSemesters] = useState([])
  const { allStudents, addFilter, removeFilter } = filterControl
  const name = 'enrollmentStatusFilter'
  const active = !!status && !!semesters.length

  const statusOptions = [
    { key: 'enrl-status-present', text: 'Present', value: 1 },
    { key: 'enrl-status-absent', text: 'Absent', value: 2 }
  ]

  const semesterCodes = lodash(allStudents.map(student => student.semesterenrollments.map(enrl => enrl.semestercode)))
    .flatten()
    .uniq()
    .value()

  const semesterOptions = semesterCodes.map(code => ({
    key: `semester-option-${code}`,
    text: allSemesters[code].name[language],
    value: code
  }))

  useEffect(() => {
    if (active) {
      addFilter(name, student =>
        semesters.every(sem => {
          const enrollment = student.semesterenrollments.find(enrl => enrl.semestercode === sem)
          // If enrollment info not found, return false. This may or may not be what we want?
          return enrollment ? enrollment.enrollmenttype === status : false
        })
      )
    } else {
      removeFilter(name)
    }
  }, [status, semesters])

  const clear = () => {
    setStatus(null)
    setSemesters([])
  }

  return (
    <FilterCard
      title="Enrollment Status"
      contextKey="enrollmentStatus"
      active={active}
      footer={<ClearFilterButton disabled={!status && !semesters.length} onClick={clear} />}
    >
      <Form>
        <Form.Field>
          <Dropdown
            options={statusOptions}
            value={status}
            onChange={(_, { value }) => setStatus(value)}
            placeholder="Choose Enrollment Status"
            className="mini"
            selection
            fluid
            button
            clearable
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
            onChange={(_, { value }) => setSemesters(value)}
            value={semesters}
          />
        </Form.Field>
      </Form>
    </FilterCard>
  )
}

EnrollmentStatus.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    allStudents: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired,
  allSemesters: PropTypes.shape({}),
  language: PropTypes.string.isRequired
}

EnrollmentStatus.defaultProps = {
  allSemesters: {}
}

const mapStateToProps = ({ semesters, settings }) => ({
  allSemesters: semesters.data.semesters,
  language: settings.language
})

export default withRouter(connect(mapStateToProps)(EnrollmentStatus))
