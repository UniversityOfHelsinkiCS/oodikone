import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import { Segment, Header } from 'semantic-ui-react'

import StudentSearch from '../StudentSearch'
import StudentDetails from '../StudentDetails'

import sharedStyles from '../../styles/shared'

class StudentStatistics extends PureComponent {
  static propTypes = {
    translate: func.isRequired,
    match: shape({
      params: { studentNumber: string }
    })
  }
  static defaultProps = {
    match: shape({
      params: { studentNumber: undefined }
    })
  }

  render() {
    const { translate, match } = this.props
    const { studentNumber } = match.params

    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">{translate('studentStatistics.header')}</Header>
        <Segment className={sharedStyles.contentSegment}>
          <StudentSearch translate={translate} studentNumber={studentNumber} />
          <StudentDetails translate={translate} />
        </Segment>
      </div>
    )
  }
}

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
})

const mapDispatchToProps = () => ({})

export default connect(mapStateToProps, mapDispatchToProps)(StudentStatistics)

