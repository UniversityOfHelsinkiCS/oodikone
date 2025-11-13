import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { PopulationQuery } from '@/types/populationSearch'

type PopulationQueryCardProps = {
  query: PopulationQuery
  populationTags: Map<string, string>
}

export const PopulationQueryCard = ({ query, populationTags }: PopulationQueryCardProps) => {
  const { studentStatuses, tag } = query
  const tagName = populationTags.get(tag!)

  return (
    <Box data-cy="PopulationQueryCard" sx={{ my: '2em', mx: '1em' }}>
      <Card sx={{ height: 'fit-content', p: '0.2em' }} variant="outlined">
        <CardContent>
          <Typography sx={{ fontWeight: 'bold' }} variant="subtitle1">
            Result details
          </Typography>
          {!!tag && (
            <Typography sx={{ fontWeight: '500' }}>
              {tagName ? `Tagged with: ${tagName}` : `Invalid tag id: ${tag}`}
            </Typography>
          )}
          <Typography sx={{ color: 'text.secondary' }}>
            {studentStatuses?.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {studentStatuses?.includes('NONDEGREE') ? 'Includes' : 'Excludes'} students with non-degree study right
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {studentStatuses?.includes('TRANSFERRED') ? 'Includes' : 'Excludes'} students who have transferred out of
            this programme
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
