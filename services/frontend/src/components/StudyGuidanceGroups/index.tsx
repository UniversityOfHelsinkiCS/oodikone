import { useParams } from 'react-router'

import { useTitle } from '@/hooks/title'
import { useGetAllStudyGuidanceGroupsQuery } from '@/redux/studyGuidanceGroups'
import { PageLayout } from '../common/PageLayout'
import { PageTitle } from '../common/PageTitle'
import { PageLoading } from '../Loading'
import { SingleStudyGuidanceGroupContainer as SingleStudyGuidanceGroup } from './SingleStudyGuidanceGroup'
import { StudyGuidanceGroupOverview } from './StudyGuidanceGroupOverview'

export const StudyGuidanceGroups = () => {
  useTitle('Study guidance groups')
  const { groupid } = useParams()
  const { data: groups, isLoading } = useGetAllStudyGuidanceGroupsQuery()

  if (!groupid)
    return (
      <PageLayout>
        <PageTitle title="Study guidance groups" />
        <PageLoading isLoading={isLoading} />
        {!isLoading && groups !== undefined && <StudyGuidanceGroupOverview groups={groups} />}
      </PageLayout>
    )

  if (!!groupid && Array.isArray(groups))
    return <SingleStudyGuidanceGroup group={groups.find(group => group.id === groupid)} />

  return null
}
