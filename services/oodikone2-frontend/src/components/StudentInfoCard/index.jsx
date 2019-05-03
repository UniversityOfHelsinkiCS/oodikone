import React from 'react'
import { func, bool, shape } from 'prop-types'
import { Card, Icon, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { reformatDate } from '../../common'
import { studentDetailsType } from '../../constants/types'
import { DISPLAY_DATE_FORMAT } from '../../constants'

import './studentInfoCard.css'

import { removeStudentSelection, resetStudent } from '../../redux/students'
import { updatePopulationStudents } from '../../redux/populations'

const StudentInfoCard = (props) => {
  const { student, translate, showName, updating } = props
  const name = showName ? `${student.name}, ` : ''
  const email = showName && student.email ? `${student.email}` : ''
  const onRemove = () => {
    props.history.push('/students')
    props.resetStudent()
    props.removeStudentSelection()
  }

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header className="cardHeader">
          <div>{name}{student.studentNumber}</div>
          <Icon
            name="remove"
            className="controlIcon"
            onClick={onRemove}
          />

        </Card.Header>
        <Card.Meta>
          <div className="startDate">
            {`${translate('common.started')}: ${reformatDate(student.started, DISPLAY_DATE_FORMAT)}`}
          </div>
          <div className="startDate">
            {email}
          </div>
        </Card.Meta>
        <Card.Description>
          {`${translate('common.credits')}: ${student.credits || 0}`}
          <p style={{ fontSize: 14 }}>{`Updated at ${reformatDate(student.updatedAt, DISPLAY_DATE_FORMAT)}`}</p>
        </Card.Description>
        <div style={{ paddingTop: '4px' }}>
          {updating ?
            <Button disabled compact size="medium" labelPosition="left" onClick={() => props.updatePopulationStudents([student.studentNumber])} >
              <Icon loading name="refresh" />
              update student
            </Button>
            :
            <Button compact floated="left" size="medium" labelPosition="left" onClick={() => props.updatePopulationStudents([student.studentNumber])} >
              <Icon name="refresh" />
              update student
            </Button>
          }
        </div>
      </Card.Content>
    </Card>
  )
}

StudentInfoCard.propTypes = {
  student: studentDetailsType.isRequired,
  translate: func.isRequired,
  showName: bool.isRequired,
  removeStudentSelection: func.isRequired,
  resetStudent: func.isRequired,
  history: shape({}).isRequired,
  updating: bool.isRequired,
  updatePopulationStudents: func.isRequired
}

const mapStateToProps = state => ({
  showName: state.settings.namesVisible,
  updating: state.populations.updating
})

export default withRouter(connect(mapStateToProps, {
  removeStudentSelection, resetStudent, updatePopulationStudents
})(StudentInfoCard))

