import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PageLayout } from '../common/PageLayout'
import { PageTitle } from '../common/PageTitle'
import { Section } from '../Section'
import { PopulationSearchForm } from './PopulationSearchForm'

export const PopulationSearch = () => (
  <PageLayout maxWidth="lg">
    <PageTitle title="Class statistics" />
    <Section cypress="PopulationSearch" infoBoxContent={populationStatisticsToolTips.search} title="Search for class">
      <PopulationSearchForm />
    </Section>
  </PageLayout>
)
