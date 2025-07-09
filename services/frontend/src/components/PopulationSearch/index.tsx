import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { Section } from '../material/Section'
import { PopulationSearchForm } from './PopulationSearchForm'

export const PopulationSearch = () => (
  <Section cypress="PopulationSearch" infoBoxContent={populationStatisticsToolTips.search} title="Search for class">
    <PopulationSearchForm />
  </Section>
)
