import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { func, bool } from 'prop-types'
import { Radio } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'

import TSA from '../../common/tsa'
import { toggleStudentNameVisibility } from '../../redux/settings'

const StudentNameVisibilityToggle = ({ showNames, toggleStudentNameVisibility: toggle }) => {
  const handleChange = useCallback(() => {
    TSA.Matomo.sendEvent('Common', 'Toggle student name visibility', showNames ? 'hide' : 'show')
    toggle()
  }, [showNames, toggle])

  return (
    <div style={{ marginTop: 15, marginBottom: 10 }}>
      <Radio data-cy={"toggleStudentNames"} toggle label="Show student names" checked={showNames} onChange={handleChange} />
    </div>
  )
}

StudentNameVisibilityToggle.propTypes = {
  showNames: bool.isRequired,
  toggleStudentNameVisibility: func.isRequired
}

const mapStateToProps = state => ({
  showNames: state.settings.namesVisible
})

export default connect(mapStateToProps, { toggleStudentNameVisibility })(withRouter(StudentNameVisibilityToggle))
