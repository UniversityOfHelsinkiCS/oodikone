import { minBy } from 'lodash'
import { arrayOf, func, number, object, oneOfType, shape, string } from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'

import { reformatDate } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DISPLAY_DATE_FORMAT } from '@/constants'
import { useGetTagsByStudyTrackQuery } from '@/redux/tags'

export const PopulationQueryCard = ({ population, query, removeSampleFn, units }) => {
  const { getTextIn } = useLanguage()
  const { uuid, year, semesters, months, studentStatuses, tag } = query
  const { data: tags = [] } = useGetTagsByStudyTrackQuery(query?.studyRights?.programme, {
    skip: !query?.studyRights?.programme,
  })
  const tagname = tag && tags.length > 0 ? tags.find(t => t.tag_id === tag)?.tagname : ''
  const { students } = population
  const header = units.map(unit => getTextIn(unit.name)).join(', ')
  const semesterList = semesters
    .map(semester => semester.charAt(0).toUpperCase() + semester.slice(1).toLowerCase())
    .join(', ')

  if (students.length > 0) {
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
            {studentStatuses.includes('TRANSFERRED') ? 'Includes' : 'Excludes'} students who have transferred out of
            this programme
          </div>
        </Card.Meta>
      </Card>
    )
  }
  return (
    <Card style={{ minWidth: '500px', padding: '0.5em', margin: '0.5em 0' }}>
      <Card.Header>
        <div>{header}</div>
        <Icon className="controlIcon" name="remove" onClick={() => removeSampleFn(uuid)} />
      </Card.Header>
      <Card.Meta>
        <div className="dateItem">
          <Icon name="calendar" size="small" />
          {`${semesterList} / ${year}-${Number(year) + 1},
             showing ${months} months.`}
        </div>
        <div>Sample size: {students.length} students</div>
      </Card.Meta>
    </Card>
  )
}

PopulationQueryCard.propTypes = {
  population: shape({ students: arrayOf(object), extents: arrayOf(object) }).isRequired,
  query: shape({
    year: oneOfType([string, number]),
    semester: string,
    studyRights: shape({ programme: string, studyTrack: string }),
    uuid: string,
  }).isRequired,
  removeSampleFn: func.isRequired,
  units: arrayOf(object).isRequired,
}
