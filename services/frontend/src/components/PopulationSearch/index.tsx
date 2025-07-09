import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { Section } from '../material/Section'
import { PopulationSearchForm } from './PopulationSearchForm'

export const PopulationSearch = () => (
  <Box sx={{ mx: '1em' }}>
    <Box sx={{ maxWidth: '1200px', mx: 'auto', my: 2.5, flex: 1 }}>
      <Typography sx={{ textAlign: 'center', m: 2 }} variant="h4">
        Class statistics
      </Typography>
      <Section cypress="PopulationSearch" infoBoxContent={populationStatisticsToolTips.search} title="Search for class">
        <PopulationSearchForm />
      </Section>
    </Box>
  </Box>
)
