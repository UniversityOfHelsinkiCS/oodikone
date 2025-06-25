import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export const PopulationQueryCard = ({ query, populationTags }) => {
  const { studentStatuses, tag } = query
  const tagName = populationTags.get(tag)

  return (
    <div style={{ marginRight: '2rem', marginTop: '1rem' }}>
      <Card sx={{ height: 'fit-content' }} variant="outlined">
        <CardContent>
          <Typography sx={{ fontWeight: '600' }} variant="subtitle1">
            Result details
          </Typography>
          {tag && (
            <Typography sx={{ fontWeight: '500' }}>
              {tagName ? `Tagged with: ${tagName}` : `Invalid tag id: ${tag}`}
            </Typography>
          )}
          <Typography sx={{ color: 'text.secondary' }}>
            {studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {studentStatuses.includes('NONDEGREE') ? 'Includes' : 'Excludes'} students with non-degree study right
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {studentStatuses.includes('TRANSFERRED') ? 'Includes' : 'Excludes'} students who have transferred out of
            this programme
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}
