import Box from '@mui/material/Box'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PageLayout } from '../common/PageLayout'
import { PageTitle } from '../common/PageTitle'
import { Section } from '../Section'
import { PopulationSearchForm } from './PopulationSearchForm'

export const PopulationSearch = () => (
  <PageLayout>
    <PageTitle title="Class statistics" />
    <Box maxWidth="lg" mx="auto" width="100%">
      <Section cypress="PopulationSearch" infoBoxContent={populationStatisticsToolTips.search} title="Search for class">
        <PopulationSearchForm />
      </Section>
    </Box>
  </PageLayout>
)
