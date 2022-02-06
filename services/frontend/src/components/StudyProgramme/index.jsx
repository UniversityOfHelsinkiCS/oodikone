import React, { useCallback, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Header, Segment, Tab } from 'semantic-ui-react'
import { isEqual } from 'lodash'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import DegreeCoursesTable from './DegreeCourses'
import StudyProgrammeSelector from './StudyProgrammeSelector'
import NewOverview from './NewOverview'
import NewStudytrackOverview from './NewStudytrackOverview'
import NewUpdateView from './NewUpdateView'
import '../PopulationQueryCard/populationQueryCard.css'
import { getTextIn } from '../../common'
import { useTabs, useTitle } from '../../common/hooks'
import TSA from '../../common/tsa'
import Tags from './Tags'

import { getThroughput } from '../../redux/throughput'
import { getProductivity } from '../../redux/productivity'
import { getProgrammes } from '../../redux/populationProgrammes'

import useLanguage from '../LanguagePicker/useLanguage'

const StudyProgramme = props => {
  const { language } = useLanguage()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('p_tab', 0, props.history)

  useTitle('Study programmes')

  useEffect(() => {
    props.getProgrammesDispatch()
  }, [])

  const getPanes = () => {
    const { match } = props
    const { studyProgrammeId } = match.params
    const panes = []
    panes.push({
      menuItem: 'Basic information (NEW)',
      render: () => <NewOverview studyprogramme={studyProgrammeId} history={props.history} />,
    })
    panes.push({
      menuItem: 'Studytracks and student populations (NEW)',
      render: () => <NewStudytrackOverview studyprogramme={studyProgrammeId} history={props.history} />,
    })
    if (isAdmin) {
      panes.push({
        menuItem: 'Update statistics',
        render: () => <NewUpdateView studyprogramme={studyProgrammeId} />,
      })
    }
    panes.push({
      menuItem: 'Degree Courses',
      render: () => <DegreeCoursesTable studyProgramme={studyProgrammeId} />,
    })
    panes.push({
      menuItem: 'Tags',
      render: () => <Tags studyprogramme={studyProgrammeId} />,
    })
    return panes
  }

  const handleSelect = useCallback(
    programme => {
      props.history.push(`/study-programme/${programme}`, { selected: programme })
    },
    [props.history]
  )

  const { match, programmes } = props
  const { studyProgrammeId } = match.params
  const programmeName = programmes?.[studyProgrammeId] && getTextIn(programmes?.[studyProgrammeId].name, language)
  const panes = getPanes()

  useEffect(() => {
    if (!programmeName) {
      return
    }

    TSA.Matomo.sendEvent('Programme Usage', 'study programme overview', programmeName)
    TSA.Influx.sendEvent({
      group: 'Programme Usage',
      name: 'study programme overview',
      label: programmeName,
      value: 1,
    })
  }, [programmeName])

  if (!studyProgrammeId)
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Study Programme
        </Header>
        <Segment className="contentSegment">
          <StudyProgrammeSelector handleSelect={handleSelect} selected={studyProgrammeId !== undefined} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{programmeName}</Header>
          <span>{studyProgrammeId}</span>
        </div>
        <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
      </Segment>
    </div>
  )
}

const mapStateToProps = ({ populationProgrammes }) => {
  const programmes = populationProgrammes.data ? populationProgrammes.data.programmes : {}
  return {
    programmes,
  }
}

export default connect(
  mapStateToProps,
  {
    getThroughputDispatch: getThroughput,
    getProductivityDispatch: getProductivity,
    getProgrammesDispatch: getProgrammes,
  },
  null,
  {
    areStatePropsEqual: isEqual,
  }
)(withRouter(StudyProgramme))
