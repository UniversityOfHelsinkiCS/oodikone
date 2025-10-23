import Typography from '@mui/material/Typography'
import { useParams } from 'react-router'

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
        <Typography className="segmentTitle" variant="h4">
          Study guidance groups
        </Typography>
      </div>
      <div>
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
