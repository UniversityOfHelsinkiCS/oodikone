// @ts-check
// Convert to tsx when migrating to MUI

import { useParams } from 'react-router'
import { Header } from 'semantic-ui-react'

import { useTitle } from '@/hooks/title'
import { useGetAllStudyGuidanceGroupsQuery } from '@/redux/studyGuidanceGroups'
import { Wrapper } from './common'
import { SingleStudyGuidanceGroupContainer as SingleStudyGuidanceGroup } from './SingleStudyGuidanceGroup'
import { StudyGuidanceGroupOverview } from './StudyGuidanceGroupOverview'

export const StudyGuidanceGroups = () => {
  useTitle('Study guidance groups')
  const { groupid } = useParams()
  const { data: groups, isLoading } = useGetAllStudyGuidanceGroupsQuery()

  return (
    <>
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Study guidance groups
        </Header>
      </div>
      <div style={{ padding: '0 1rem' }}>
        <Wrapper isLoading={isLoading}>
          {!isLoading && !groupid && <StudyGuidanceGroupOverview groups={groups} />}
        </Wrapper>
        {!isLoading && groupid && groups ? (
          <SingleStudyGuidanceGroup group={groups.find(group => group.id === groupid)} />
        ) : null}
      </div>
    </>
  )
}
