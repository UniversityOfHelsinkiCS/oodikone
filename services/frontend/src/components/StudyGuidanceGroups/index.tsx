import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router'

import { useTitle } from '@/hooks/title'
import { useGetAllStudyGuidanceGroupsQuery } from '@/redux/studyGuidanceGroups'
import { SegmentContainer } from '../common/SegmentContainer'
import { PageLoading } from '../material/Loading'
import { SingleStudyGuidanceGroupContainer as SingleStudyGuidanceGroup } from './SingleStudyGuidanceGroup'
import { StudyGuidanceGroupOverview } from './StudyGuidanceGroupOverview'

export const StudyGuidanceGroups = () => {
  useTitle('Study guidance groups')
  const { groupid } = useParams()
  const { data: groups, isLoading } = useGetAllStudyGuidanceGroupsQuery()

  if (!groupid)
    return (
      <SegmentContainer>
        <Box>
          <Typography sx={{ mt: '20px', mb: '20px', textAlign: 'center' }} variant="h4">
            Study guidance groups
          </Typography>
        </Box>

        <PageLoading isLoading={isLoading} />
        {!isLoading && groups !== undefined && <StudyGuidanceGroupOverview groups={groups} />}
      </SegmentContainer>
    )

  if (!!groupid && Array.isArray(groups))
    return <SingleStudyGuidanceGroup group={groups.find(group => group.id === groupid)} />

  return null
}
