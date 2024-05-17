import { useParams } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { useGetAllStudyGuidanceGroupsQuery } from '@/redux/studyGuidanceGroups'
import { Wrapper } from './common'
import { SingleStudyGuidanceGroupContainer as SingleStudyGuidanceGroup } from './SingleStudyGuidanceGroup'
import { StudyGuidanceGroupOverview } from './StudyGuidanceGroupOverview'

export const StudyGuidanceGroups = () => {
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
      <div style={{ padding: '0 1rem' }}>
        <Wrapper isLoading={isLoading}>
          {!isLoading && !groupid && <StudyGuidanceGroupOverview groups={data} />}
        </Wrapper>
        {!isLoading && groupid && <SingleStudyGuidanceGroup group={data.find(group => group.id === groupid)} />}
      </div>
    </>
  )
}
