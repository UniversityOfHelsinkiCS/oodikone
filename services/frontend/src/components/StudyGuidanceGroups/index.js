import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'
import { Header, Loader, Segment } from 'semantic-ui-react'
import { useTitle } from '../../common/hooks'
import { getStudyGuidanceGroups } from '../../redux/studyGuidanceGroups'
import StudyGuidanceGroupOverview from './StudyGuidanceGroupOverview'
import SingleStudyGuidanceGroup from './SingleStudyGuidanceGroup'

const StudyGuidanceGroups = () => {
  useTitle('Study guidance groups')
  const dispatch = useDispatch()
  const { pending, data: groups } = useSelector(({ studyGuidanceGroups }) => studyGuidanceGroups)
  const match = useRouteMatch('/studyguidancegroups/:groupid')
  const groupid = match?.params?.groupid

  useEffect(() => {
    if (groups && groups.length > 0) return
    dispatch(getStudyGuidanceGroups())
  }, [dispatch])

  const isLoading = pending === undefined || pending === true
  const isLoaded = pending === false

  return (
    <>
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Study guidance groups
        </Header>
        <Segment className="contentSegment">
          {isLoading ? (
            <Loader active inline="centered">
              Loading
            </Loader>
          ) : null}
          {isLoaded && !groupid ? <StudyGuidanceGroupOverview /> : null}
        </Segment>
      </div>
      <div>{isLoaded && groupid ? <SingleStudyGuidanceGroup groupid={groupid} /> : null}</div>
    </>
  )
}

export default StudyGuidanceGroups
