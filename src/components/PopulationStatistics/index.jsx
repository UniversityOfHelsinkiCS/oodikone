import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool } from 'prop-types'
import { Header, Segment, Divider } from 'semantic-ui-react'

import PopulationSearchForm from '../PopulationSearchForm'
import PopulationSearchHistory from '../PopulationSearchHistory'
import PopulationDetails from '../PopulationDetails'

import sharedStyles from '../../styles/shared'

class PopulationStatistics extends PureComponent {
  static propTypes = {
    translate: func.isRequired,
    populationFound: bool.isRequired
  }

  renderPopulationSearch = () => {
    const { translate, populationFound } = this.props

    const title = populationFound ?
      translate('populationStatistics.foundTitle') :
      translate('populationStatistics.searchTitle')

    return (
      <Segment>
        <Header size="medium">{title}</Header>
        <PopulationSearchForm />
        <Divider />
        <PopulationSearchHistory />
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
  populationFound: populations.length > 0
})

const mapDispatchToProps = () => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationStatistics)
