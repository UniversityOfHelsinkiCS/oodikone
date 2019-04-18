import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool } from 'prop-types'
import { Header, Segment, Divider } from 'semantic-ui-react'

import PopulationSearchForm from '../PopulationSearchForm'
import PopulationSearchHistory from '../PopulationSearchHistory'
import PopulationDetails from '../PopulationDetails'
import SegmentDimmer from '../SegmentDimmer'
import InfoBox from '../InfoBox'

import sharedStyles from '../../styles/shared'
import infoTooltips from '../../common/InfoToolTips'

class PopulationStatistics extends PureComponent {
  static propTypes = {
    translate: func.isRequired,
    populationFound: bool.isRequired,
    loading: bool.isRequired
  }

  renderPopulationSearch = () => {
    const { translate, populationFound, loading } = this.props
    const { Main } = infoTooltips.PopulationStatistics
    const title = populationFound ?
      translate('populationStatistics.foundTitle') :
      translate('populationStatistics.searchTitle')

    return (
      <Segment>
        <Header size="medium">{title}
          <InfoBox content={Main} />
        </Header>
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
        <Header className={sharedStyles.segmentTitle} size="large">{translate('populationStatistics.header')}</Header>
        <Segment className={sharedStyles.contentSegment}>
          { this.renderPopulationSearch() }
          <PopulationDetails />
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

export default connect(mapStateToProps)(PopulationStatistics)
