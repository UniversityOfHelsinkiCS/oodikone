import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool, shape, string } from 'prop-types'
import { Header, Segment, Divider, Button } from 'semantic-ui-react'
import qs from 'query-string'

import PopulationSearchForm from '../PopulationSearchForm'
import PopulationSearchHistory from '../PopulationSearchHistory'
import PopulationDetails from '../PopulationDetails'
import SegmentDimmer from '../SegmentDimmer'
import InfoBox from '../InfoBox'

import infoTooltips from '../../common/InfoToolTips'

class PopulationStatistics extends PureComponent {
  static propTypes = {
    translate: func.isRequired,
    populationFound: bool.isRequired,
    loading: bool.isRequired,
    location: shape({}).isRequired,
    language: string.isRequired,
    query: shape({}).isRequired,
    history: shape({}).isRequired,
    studyrights: shape({}).isRequired
  }

  constructor() {
    super()
    this.state = {
      show: false
    }
  }

  handleClick = () => {
    this.setState({ show: !this.state.show })
    const { query, history } = this.props
    const { startYear, endYear, studyRights, semesters, months } = query
    const queryObject = { startYear, endYear, studyRights: JSON.stringify(studyRights), semesters, months, fetch: false }
    const searchString = qs.stringify(queryObject)
    history.push(`/populations?${searchString}`)
  }

  renderPopulationSearch = () => {
    const { translate, populationFound, loading, location } = this.props
    const { Main } = infoTooltips.PopulationStatistics
    const title = populationFound ?
      translate('populationStatistics.foundTitle') :
      translate('populationStatistics.searchTitle')

    return (
      <Segment>
        <Header size="medium">{title}
          {!populationFound && <InfoBox content={Main} />}
        </Header>
        <PopulationSearchForm />
        <Divider />
        {location.search !== '' || this.state.show ? (<PopulationSearchHistory />) : null}
        <SegmentDimmer translate={translate} isLoading={loading} />
      </Segment>
    )
  }

  render() {
    this.setState({ show: false })
    const { translate, location, populationFound, studyrights, query, language } = this.props
    const programmeInStore = studyrights.programmes ? studyrights.programmes.find(programme => programme.code === query.studyRights.programme) : []
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">{translate('populationStatistics.header')}</Header>
        <Segment className="contentSegment">
          {this.renderPopulationSearch()}
          {location.search !== '' || this.state.show ? (<PopulationDetails />) : null}
          {populationFound && location.search === '' ? (
            <Segment>
              <Header>Search history</Header>
              <Button onClick={this.handleClick}>{programmeInStore.name[language]}</Button>
            </Segment>) : null}
        </Segment>
      </div>
    )
  }
}

const mapStateToProps = ({ locale, populations, settings }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  loading: populations.pending,
  populationFound: populations.data.students !== undefined,
  query: populations.query,
  studyrights: populations.data.studyrights ? populations.data.studyrights : [],
  language: settings.language
})

export default connect(mapStateToProps)(PopulationStatistics)
