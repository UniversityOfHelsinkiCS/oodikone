import React, { memo } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool, shape } from 'prop-types'
import { Header, Segment, Divider } from 'semantic-ui-react'

import PopulationSearchForm from '../PopulationSearchForm'
import PopulationSearchHistory from '../PopulationSearchHistory'
import PopulationDetails from '../PopulationDetails'
import InfoBox from '../InfoBox'
import ProgressBar from '../ProgressBar'

import infoTooltips from '../../common/InfoToolTips'
import { useProgress } from '../../common'

const PopulationStatistics = memo((props) => {
  const {
    translate,
    populationFound,
    loading,
    location
  } = props

  const {
    onProgress,
    progress
  } = useProgress(loading)

  const renderPopulationSearch = () => {
    const { Main } = infoTooltips.PopulationStatistics
    const title = populationFound ?
      translate('populationStatistics.foundTitle') :
      translate('populationStatistics.searchTitle')

    return (
      <Segment>
        <Header size="medium">{title}
          {!populationFound && <InfoBox content={Main} />}
        </Header>
        <PopulationSearchForm onProgress={onProgress} />
        <Divider />
        {location.search !== '' ? (<PopulationSearchHistory />) : null}
        <ProgressBar progress={progress} />
      </Segment>
    )
  }

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">{translate('populationStatistics.header')}</Header>
      <Segment className="contentSegment">
        {renderPopulationSearch()}
        {location.search !== '' ? (<PopulationDetails />) : null}
      </Segment>
    </div>
  )
})

PopulationStatistics.propTypes = {
  translate: func.isRequired,
  populationFound: bool.isRequired,
  loading: bool.isRequired,
  location: shape({}).isRequired
}

const mapStateToProps = ({ localize, populations }) => ({
  translate: getTranslate(localize),
  currentLanguage: getActiveLanguage(localize).value,
  loading: populations.pending,
  populationFound: populations.data.students !== undefined,
  query: populations.query ? populations.query : {}
})

export default connect(mapStateToProps)(PopulationStatistics)
