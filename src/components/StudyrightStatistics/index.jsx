import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool } from 'prop-types'
import { Header, Segment, Divider } from 'semantic-ui-react'

import PopulationSearchForm from '../PopulationSearchForm'
import PopulationSearchHistory from '../PopulationSearchHistory'
import SegmentDimmer from '../SegmentDimmer'

import sharedStyles from '../../styles/shared'

class StudyrightStatistics extends PureComponent {
  static propTypes = {
    translate: func.isRequired,
    loading: bool.isRequired
  }

  renderPopulationSearch = () => {
    const { translate, loading } = this.props

    return (
      <Segment>
        <PopulationSearchForm />
        <Divider />
        <PopulationSearchHistory />
        <SegmentDimmer translate={translate} isLoading={loading} />
      </Segment>
    )
  }

  render() {
    const { translate } = this.props
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">{translate('studyrightStatistics.header')}</Header>
        <Segment className={sharedStyles.contentSegment}>
          { this.renderPopulationSearch() }
        </Segment>
      </div>
    )
  }
}

const mapStateToProps = ({ locale, populations }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  populationFound: populations.length > 0,
  loading: populations.pending
})

export default connect(mapStateToProps)(StudyrightStatistics)
