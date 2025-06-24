import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import { useGetPopulationStatisticsQuery } from '@/redux/populations'
import { useGetTagsByStudyTrackQuery } from '@/redux/tags'

export const PopulationQueryCard = ({ query, skipQuery }) => {
  const { studentStatuses, tag } = query
  const { data: population } = useGetPopulationStatisticsQuery(query, { skip: skipQuery })
  const students = population?.students ?? []

  const { data: tags = [] } = useGetTagsByStudyTrackQuery(query?.studyRights?.programme, {
    skip: !query?.studyRights?.programme,
  })
  const tagName = tag ? tags.find(currentTag => currentTag.id === tag)?.name : ''

  if (!students.length) return null

  return (
    <Card sx={{ height: 'fit-content' }} variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: '600' }} variant="subtitle1">
          Result details
        </Typography>
        {tag && <Typography sx={{ fontWeight: '500' }}>{`Tagged with: ${tagName}`}</Typography>}
        <Typography sx={{ color: 'text.secondary' }}>
          {studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          {studentStatuses.includes('NONDEGREE') ? 'Includes' : 'Excludes'} students with non-degree study right
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          {studentStatuses.includes('TRANSFERRED') ? 'Includes' : 'Excludes'} students who have transferred out of this
          programme
        </Typography>
      </CardContent>
    </Card>
  )
}
