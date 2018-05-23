import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { func, shape, string, bool } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import { Segment, Header, Radio } from 'semantic-ui-react'

import StudentSearch from '../StudentSearch'
import StudentDetails from '../StudentDetails'
import { toggleStudentNameVisibility } from '../../redux/settings'

import sharedStyles from '../../styles/shared'

class StudentStatistics extends PureComponent {
  render() {
    const { translate, match } = this.props
    const { studentNumber } = match.params

    const radioLabel = this.props.showNames ? 'Student names visible' : 'Studen names hidden'

    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">
          {translate('studentStatistics.header')}
        </Header>
        <Radio
          toggle
          label={radioLabel}
          onClick={() => this.props.toggleStudentNameVisibility()}
        />
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
  }),
  toggleStudentNameVisibility: func.isRequired,
  showNames: bool.isRequired
}

StudentStatistics.defaultProps = {
  match: {
    params: { studentNumber: undefined }
  }
}

const mapStateToProps = ({ locale, settings }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  showNames: settings.namesVisible
})

export default connect(mapStateToProps, { toggleStudentNameVisibility })(StudentStatistics)

