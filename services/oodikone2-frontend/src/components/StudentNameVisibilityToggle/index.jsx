import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { string, func, bool } from 'prop-types'
import { Radio } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'

import TSA from '../../common/tsa'
import { toggleStudentNameVisibility } from '../../redux/settings'

const StudentNameVisibilityToggle = ({ showNames, toggleLabel, toggleStudentNameVisibility: toggle }) => {
  const handleChange = useCallback(() => {
    TSA.Matomo.sendEvent('Common', 'Toggle student name visibility', showNames ? 'hide' : 'show')
    toggle()
  }, [showNames, toggle])

  return (
    <div style={{ marginTop: 15, marginBottom: 10 }}>
      <Radio toggle label={toggleLabel} checked={showNames} onChange={handleChange} />
    </div>
  )
}

StudentNameVisibilityToggle.propTypes = {
  showNames: bool.isRequired,
  toggleLabel: string.isRequired,
  toggleStudentNameVisibility: func.isRequired
}

const mapStateToProps = state => ({
  showNames: state.settings.namesVisible,
  toggleLabel: state.settings.namesVisible ? 'Student names visible' : 'Student names hidden'
})

export default connect(
  mapStateToProps,
  { toggleStudentNameVisibility }
)(withRouter(StudentNameVisibilityToggle))
