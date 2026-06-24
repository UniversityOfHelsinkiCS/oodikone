import { useParams } from 'react-router'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { PageLoading } from '@/components/Loading'
import { SingleStudyGuidanceGroupContainer as SingleStudyGuidanceGroup } from '@/components/StudyGuidanceGroups/SingleStudyGuidanceGroup'
import { StudyGuidanceGroupOverview } from '@/components/StudyGuidanceGroups/StudyGuidanceGroupOverview'
import { useTitle } from '@/hooks/title'
import { useGetAllStudyGuidanceGroupsQuery } from '@/redux/studyGuidanceGroups'

export const StudyGuidanceGroups = () => {
  useTitle('Study guidance groups')
  const { groupid } = useParams()
  const { data: groups, isLoading } = useGetAllStudyGuidanceGroupsQuery()

  if (!groupid)
    return (
      <PageLayout maxWidth="lg">
        <PageTitle title="Study guidance groups" />
        <PageLoading isLoading={isLoading} />
        {!isLoading && groups !== undefined && <StudyGuidanceGroupOverview groups={groups} />}
      </PageLayout>
    )

  if (!!groupid && Array.isArray(groups))
    return <SingleStudyGuidanceGroup group={groups.find(group => group.id === groupid)} />

  return null
}
