import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { PopulationSearchForm } from '@/components/PopulationSearch/PopulationSearchForm'
import { Section } from '@/components/Section'

export const PopulationSearch = () => (
  <PageLayout maxWidth="lg">
    <PageTitle title="Class statistics" />
    <Section cypress="PopulationSearch" infoBoxContent={populationStatisticsToolTips.search} title="Search for class">
      <PopulationSearchForm />
    </Section>
  </PageLayout>
)
