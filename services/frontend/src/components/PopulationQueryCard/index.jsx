import { minBy } from 'lodash'
import { Card } from 'semantic-ui-react'

import { reformatDate } from '@/common/timeAndDate'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useGetTagsByStudyTrackQuery } from '@/redux/tags'

export const PopulationQueryCard = ({ population, query }) => {
  const { studentStatuses, tag } = query
  const { data: tags = [] } = useGetTagsByStudyTrackQuery(query?.studyRights?.programme, {
    skip: !query?.studyRights?.programme,
  })
  const tagname = tag ? tags.find(t => t.tag_id === tag)?.tagname : ''
  const { students } = population

  if (!students.length) return null

  return (
    <Card style={{ minWidth: '500px', padding: '0.5em', margin: '0.5em 0' }}>
      <Card.Header>
        <div>Result details</div>
      </Card.Header>
      <Card.Meta>
        {tag ? <div style={{ color: 'black', fontWeight: 'bold' }}>{`Tagged with: ${tagname}`}</div> : null}
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
