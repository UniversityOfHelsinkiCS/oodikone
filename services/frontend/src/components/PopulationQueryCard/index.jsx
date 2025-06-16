import { minBy } from 'lodash'
import { Card } from 'semantic-ui-react'

import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useGetPopulationStatisticsQuery } from '@/redux/populations'
import { useGetTagsByStudyTrackQuery } from '@/redux/tags'
import { reformatDate } from '@/util/timeAndDate'

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
    <Card id={'query-card'} style={{ minWidth: '500px', padding: '0.5em', margin: '0.5em 0' }}>
      <Card.Header>
        <div>Result details</div>
      </Card.Header>
      <Card.Meta>
        {tag ? <div style={{ color: 'black', fontWeight: 'bold' }}>{`Tagged with: ${tagName}`}</div> : null}
        <div>{`Updated at ${reformatDate(minBy(students, 'updatedAt').updatedAt, DISPLAY_DATE_FORMAT)} `}</div>
        <div>{studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students</div>
        <div>
          {studentStatuses.includes('NONDEGREE') ? 'Includes' : 'Excludes'} students with non-degree study right
        </div>
        <div>
          {studentStatuses.includes('TRANSFERRED') ? 'Includes' : 'Excludes'} students who have transferred out of this
          programme
        </div>
      </Card.Meta>
    </Card>
  )
}
