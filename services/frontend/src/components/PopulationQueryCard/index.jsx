import React from 'react'
import { withRouter } from 'react-router-dom'
import { func, arrayOf, object, shape, string, oneOfType, number } from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'
import { minBy } from 'lodash'
import './populationQueryCard.css'
import { DISPLAY_DATE_FORMAT } from '../../constants'
import { reformatDate } from '../../common'
import useLanguage from '../LanguagePicker/useLanguage'

const PopulationQueryCard = ({ population, query, removeSampleFn, units, tags }) => {
  const { getTextIn } = useLanguage()
  const { uuid, year, semesters, months, studentStatuses, tag } = query
  const tagname = tag && tags.length > 0 ? tags.find(t => t.tag_id === tag)?.tagname : ''
  const { students } = population
  const header = units.map(u => getTextIn(u.name)).join(', ')
  const semesterList = semesters.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(', ')

  if (students.length > 0) {
    return (
      <>
        <Card className="cardContainer">
          <Card.Header className="cardHeader">
            <div>Result details</div>
          </Card.Header>
          <Card.Meta>
            {tag ? <div style={{ color: 'black', fontWeight: 'bold' }}>{`Tagged with: ${tagname}`}</div> : null}
            <div>{`Updated at ${reformatDate(minBy(students, 'updatedAt').updatedAt, DISPLAY_DATE_FORMAT)} `}</div>
            <div>{studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students</div>
            <div>
              {studentStatuses.includes('NONDEGREE') ? 'Includes ' : 'Excludes '}
              students with non-degree study right
            </div>
            <div>
              {studentStatuses.includes('TRANSFERRED') ? 'Includes ' : 'Excludes '}
              students who have transferred out of this programme
            </div>
          </Card.Meta>
        </Card>
      </>
    )
  }
  return (
    <Card className="cardContainer">
      <Card.Header className="cardHeader">
        <div>{header}</div>
        <Icon name="remove" className="controlIcon" onClick={() => removeSampleFn(uuid)} />
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
  tags: arrayOf(shape({})).isRequired,
}

export default withRouter(PopulationQueryCard)
