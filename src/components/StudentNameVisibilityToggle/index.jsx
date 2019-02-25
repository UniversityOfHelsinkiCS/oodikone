import React from 'react'
import { connect } from 'react-redux'
import { string, func, bool } from 'prop-types'
import { Radio } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'

import { toggleStudentNameVisibility } from '../../redux/settings'

const StudentNameVisibilityToggle = ({
  showNames, toggleLabel, toggleStudentNameVisibility: toggle
}) => (
  <div style={{ marginTop: 15, marginBottom: 10 }}>
    <Radio
      toggle
      label={toggleLabel}
      checked={showNames}
      onChange={toggle}
    />
  </div>
)

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
