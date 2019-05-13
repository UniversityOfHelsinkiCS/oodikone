import React from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Header, Popup, Button, Portal, Message } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'

import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import { getPopulationCourses } from '../../redux/populationCourses'
import { refreshFilters } from '../../redux/populationFilters'

const PopulationCourses = ({
  populationCourses,
  refreshNeeded,
  dispatchRefreshFilters,
  selectedStudents,
  translate,
  getPopulationCourses: gpc
}) => {
  const { CoursesOf } = infotooltips.PopulationStatistics
  const { pending } = populationCourses
  const reloadCourses = () => {
    dispatchRefreshFilters()
    gpc({ ...populationCourses.query, uuid: uuidv4(), selectedStudents })
  }

  return (
    <Segment>
      <Header size="medium" dividing >
        <Popup
          trigger={<Header.Content>{translate('populationCourses.header')}</Header.Content>}
          content="Sort by clicking columns. Click course name to limit observed population to students who
          participated to the course."
          wide
          position="top left"
        />
        <InfoBox content={CoursesOf} />
      </Header>

      <Portal open={refreshNeeded}>
        <Message
          style={{
            left: '80%',
            position: 'fixed',
            top: '5%'
          }}
        >
          Filters updated. Click to here to recalculate course table
          <Button
            key="refreshCourses"
            primary
            onClick={reloadCourses}
            icon="refresh"
            style={{ marginLeft: '10px' }}
            compact
            // disabled={filtersAreEqual()}
          />
        </Message>
      </Portal>
      <SegmentDimmer translate={translate} isLoading={pending} />
      <PopulationCourseStats
        key={populationCourses.query.uuid}
        courses={populationCourses.data}
        query={populationCourses.query}
        pending={populationCourses.pending}
        selectedStudents={selectedStudents}
      />
    </Segment>
  )
}

PopulationCourses.propTypes = {
  populationCourses: shape({}).isRequired,
  refreshNeeded: bool.isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  getPopulationCourses: func.isRequired,
  dispatchRefreshFilters: func.isRequired
}

const mapStateToProps = ({ populationCourses, locale, populationFilters }) => ({
  populationCourses,
  refreshNeeded: populationFilters.refreshNeeded,
  translate: getTranslate(locale)
})

export default connect(mapStateToProps, {
  getPopulationCourses, dispatchRefreshFilters: refreshFilters
})(PopulationCourses)
