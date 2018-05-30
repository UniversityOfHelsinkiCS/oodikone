import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import { Segment, Header } from 'semantic-ui-react'

import StudentSearch from '../StudentSearch'
import StudentDetails from '../StudentDetails'
import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import { toggleStudentNameVisibility } from '../../redux/settings'

import sharedStyles from '../../styles/shared'

class StudentStatistics extends PureComponent {
  render() {
    const { translate, match } = this.props
    const { studentNumber } = match.params

    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">
          {translate('studentStatistics.header')}
        </Header>
        <StudentNameVisibilityToggle />
        <Segment className={sharedStyles.contentSegment}>
          <StudentSearch translate={translate} studentNumber={studentNumber} />
          <StudentDetails translate={translate} />
        </Segment>
      </div>
    )
  }
}

StudentStatistics.propTypes = {
  translate: func.isRequired,
  match: shape({
    params: shape({
      studentNumber: string
    })
  })
}

StudentStatistics.defaultProps = {
  match: {
    params: { studentNumber: undefined }
  }
}

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
})

export default connect(mapStateToProps, { toggleStudentNameVisibility })(StudentStatistics)
