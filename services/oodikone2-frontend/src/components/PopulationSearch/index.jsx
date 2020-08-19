import React from 'react'
import PropTypes from 'prop-types'
import { Segment, Header, Divider, Form, Button, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getTranslate } from 'react-localize-redux'
import { Link } from 'react-router-dom'
import PopulationSearchForm from './PopulationSearchForm'
import PopulationSearchHistory from './PopulationSearchHistory'
import ProgressBar from '../ProgressBar'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import { getUserIsAdmin } from '../../common'
import useFeatureToggle from '../../common/useFeatureToggle'
import { useProgress } from '../../common/hooks'

const PopulationSearch = ({ populationFound, history, location, isAdmin, loading, translate }) => {
  const [mandatoryToggle, , toggleMandatoryToggle] = useFeatureToggle('mandatoryToggle')
  const { onProgress, progress } = useProgress(loading)
  const { Main } = infotooltips.PopulationStatistics

  const title =
    populationFound && history.location.search
      ? translate('populationStatistics.foundTitle')
      : translate('populationStatistics.searchTitle')

  return (
    <Segment>
      <Header size="medium">
        {title}
        {(!populationFound || !history.location.search) && <InfoBox content={Main} />}
      </Header>
      <PopulationSearchForm onProgress={onProgress} mandatoryToggle={mandatoryToggle} />
      <Divider />
      {location.search !== '' && !loading && (
        <Form>
          <Form.Group inline>
            <Form.Field>
              <Link to="/populations">
                <Button icon labelPosition="left" color="blue">
                  <Icon name="left arrow" />
                  New Population Search
                </Button>
              </Link>
            </Form.Field>
            {isAdmin ? (
              <Form.Field>
                <Form.Radio
                  id="accordion-toggle"
                  checked={mandatoryToggle}
                  toggle
                  onClick={toggleMandatoryToggle}
                  label="Toggle Mandatory Courses"
                />
              </Form.Field>
            ) : null}
          </Form.Group>
          <PopulationSearchHistory history={history} />
        </Form>
      )}
      <ProgressBar progress={progress} />
    </Segment>
  )
}

PopulationSearch.propTypes = {
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string.isRequired
  }).isRequired,
  populationFound: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ populations, auth, localize }) => ({
  populationFound: populations.data.students !== undefined,
  isAdmin: getUserIsAdmin(auth.token.roles),
  loading: !!populations.pending,
  translate: getTranslate(localize)
})

export default connect(mapStateToProps)(PopulationSearch)
