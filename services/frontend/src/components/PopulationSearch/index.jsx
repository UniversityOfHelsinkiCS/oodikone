import React from 'react'
import { Segment, Header, Divider, Form, Button, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import PopulationSearchForm from './PopulationSearchForm'
import PopulationSearchHistory from './PopulationSearchHistory'
import ProgressBar from '../ProgressBar'
import InfoBox from '../Info/InfoBox'
import { useProgress } from '../../common/hooks'
import infotoolTips from '../../common/InfoToolTips'

const PopulationSearch = ({
  populationFound,
  history,
  location,
  loading /* , onlyHopsCredits, setOnlyHopsCredits */,
}) => {
  const { onProgress, progress } = useProgress(loading)

  const title = populationFound && history.location.search ? 'Population' : 'Search for population'

  return (
    <Segment>
      <Header size="medium">{title}</Header>
      {(!populationFound || !history.location.search) && <InfoBox content={infotoolTips.PopulationStatistics.Search} />}
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
            {/* <Form.Field>
              <Form.Radio
                toggle
                checked={onlyHopsCredits}
                onClick={() => {
                  setOnlyHopsCredits(!onlyHopsCredits)
                }}
                label="Show only credits included in study plan"
              />
            </Form.Field> */}
          </Form.Group>

          <PopulationSearchHistory history={history} />
        </Form>
      )}
      <ProgressBar progress={progress} />
    </Segment>
  )
}

const mapStateToProps = ({ populations }) => ({
  populationFound: populations.data.students !== undefined,
  loading: !!populations.pending,
})

export default connect(mapStateToProps)(PopulationSearch)
