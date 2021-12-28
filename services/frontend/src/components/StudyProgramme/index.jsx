import React, { useCallback, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Header, Segment, Tab, Button } from 'semantic-ui-react'
import { isEqual, uniqBy } from 'lodash'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import DegreeCoursesTable from './DegreeCourses'
import StudyProgrammeSelector from './StudyProgrammeSelector'
import Overview from './Overview'
import NewOverview from './NewOverview'
import NewStudytrackOverview from './NewStudytrackOverview'
import StudyTrackOverview from './StudyTrackOverview'
import ThesisCourses from './ThesisCourses'
import '../PopulationQueryCard/populationQueryCard.css'
import { getTextIn } from '../../common'
import { useTabs, useTitle } from '../../common/hooks'
import TSA from '../../common/tsa'
import Tags from './Tags'

import { getThroughput } from '../../redux/throughput'
import { getProductivity } from '../../redux/productivity'
import { getProgrammes } from '../../redux/populationProgrammes'

import { callApi } from '../../apiConnection'
import useLanguage from '../LanguagePicker/useLanguage'

const StudyProgramme = props => {
  const { language } = useLanguage()
  const { roles, isAdmin } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('p_tab', 0, props.history)

  useTitle('Study programmes')

  useEffect(() => {
    props.getProgrammesDispatch()
  }, [])

  const refreshProductivity = () => {
    callApi('/v2/studyprogrammes/productivity/recalculate', 'get', null, {
      code: props.match.params.studyProgrammeId,
    })
      .then(() => {
        props.getProductivityDispatch(props.match.params.studyProgrammeId)
      })
      .catch(e => {
        if (e.message.toLowerCase() === 'network error') {
          window.location.reload(true)
        }
      })
  }
  const refreshThroughput = () => {
    callApi('/v2/studyprogrammes/throughput/recalculate', 'get', null, {
      code: props.match.params.studyProgrammeId,
    })
      .then(() => {
        props.getThroughputDispatch(props.match.params.studyProgrammeId)
      })
      .catch(e => {
        if (e.message.toLowerCase() === 'network error') {
          window.location.reload(true)
        }
      })
  }

  const SHOW_NEW_OVERVIEW = isAdmin && roles?.find(r => r.group_code === 'teachers')

  const getPanes = () => {
    const { match, programmes } = props
    const { studyProgrammeId } = match.params
    const filteredStudytracks = programmes?.[studyProgrammeId]
      ? Object.values(programmes?.[studyProgrammeId].enrollmentStartYears).reduce((acc, curr) => {
          acc.push(...Object.values(curr.studyTracks))
          return uniqBy(acc, 'code')
        }, [])
      : []
    const panes = []
    panes.push({
      menuItem: 'Overview',
      render: () => <Overview studyprogramme={studyProgrammeId} history={props.history} />,
    })
    if (filteredStudytracks.length > 0) {
      panes.push({
        menuItem: 'Studytrack overview',
        render: () => <StudyTrackOverview studyprogramme={studyProgrammeId} history={props.history} admin={isAdmin} />,
      })
    }
    panes.push({
      menuItem: 'Degree Courses',
      render: () => <DegreeCoursesTable studyProgramme={studyProgrammeId} />,
    })
    panes.push({
      menuItem: 'Thesis Courses',
      render: () => <ThesisCourses studyprogramme={studyProgrammeId} />,
    })
    panes.push({
      menuItem: 'Tags',
      render: () => <Tags studyprogramme={studyProgrammeId} />,
    })
    if (SHOW_NEW_OVERVIEW) {
      panes.push({
        menuItem: 'Basic information (NEW)',
        render: () => <NewOverview studyprogramme={studyProgrammeId} history={props.history} />,
      })
    }
    if (SHOW_NEW_OVERVIEW) {
      panes.push({
        menuItem: 'Populations and Studytracks (NEW)',
        render: () => <NewStudytrackOverview studyprogramme={studyProgrammeId} history={props.history} />,
      })
    }
    if (isAdmin) {
      panes.push({
        menuItem: 'Admin',
        render: () => (
          <>
            <Button onClick={() => refreshThroughput()}>recalculate throughput</Button>
            <Button onClick={() => refreshProductivity()}>recalculate productivity</Button>
          </>
        ),
      })
    }
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
