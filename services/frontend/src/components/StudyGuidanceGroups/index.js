import React from 'react'
import { useParams } from 'react-router-dom'
import { Header } from 'semantic-ui-react'
import { useGetAllStudyGuidanceGroupsQuery } from 'redux/studyGuidanceGroups'
import { useTitle } from 'common/hooks'
import StudyGuidanceGroupOverview from './StudyGuidanceGroupOverview'
import SingleStudyGuidanceGroup from './SingleStudyGuidanceGroup'
import { Wrapper } from './common'

const StudyGuidanceGroups = () => {
  useTitle('Study guidance groups')
  const { groupid } = useParams()
  const { data, isLoading } = useGetAllStudyGuidanceGroupsQuery()

  return (
    <>
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Study guidance groups
        </Header>
      </div>
      <Wrapper isLoading={isLoading}>{!isLoading && !groupid && <StudyGuidanceGroupOverview groups={data} />}</Wrapper>
      {!isLoading && groupid && <SingleStudyGuidanceGroup group={data.find(group => group.id === groupid)} />}
    </>
  )
}

export default StudyGuidanceGroups
