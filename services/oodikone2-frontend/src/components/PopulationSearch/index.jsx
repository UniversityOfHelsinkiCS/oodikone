import React from 'react'
import PropTypes from 'prop-types'
import { Segment, Header, Divider, Form, Button, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import PopulationSearchForm from './PopulationSearchForm'
import PopulationSearchHistory from './PopulationSearchHistory'
import ProgressBar from '../ProgressBar'
import InfoBox from '../InfoBox'
import { getUserIsAdmin } from '../../common'
import { useProgress } from '../../common/hooks'
import info from '../../common/markdown/populationStatistics/search.info.md'

const PopulationSearch = ({ populationFound, history, location, isAdmin, loading }) => {
  const { onProgress, progress } = useProgress(loading)

  const title = populationFound && history.location.search ? 'Population' : 'Search for population'

  return (
    <Segment>
      <Header size="medium">{title}</Header>
      {(!populationFound || !history.location.search) && <InfoBox content={info} />}
      <PopulationSearchForm onProgress={onProgress} />
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
  loading: PropTypes.bool.isRequired
}

const mapStateToProps = ({ populations, auth }) => ({
  populationFound: populations.data.students !== undefined,
  isAdmin: getUserIsAdmin(auth.token.roles),
  loading: !!populations.pending
})

export default connect(mapStateToProps)(PopulationSearch)
