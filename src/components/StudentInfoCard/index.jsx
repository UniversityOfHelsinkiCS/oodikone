import React from 'react'
import { func, bool, shape } from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { reformatDate } from '../../common'
import { studentDetailsType } from '../../constants/types'
import { DISPLAY_DATE_FORMAT } from '../../constants'

import styles from './studentInfoCard.css'

import { removeStudentSelection, resetStudent } from '../../redux/students'

const StudentInfoCard = (props) => {
  const { student, translate, showName } = props
  const name = showName ? `${student.name}, ` : ''
  const onRemove = () => {
    props.history.push('/students')
    props.resetStudent()
    props.removeStudentSelection()
  }

  // Deprecated(?)
  // const filterDegreeStudyRight = student2 =>
  // student2.studyrights.filter((studyright) => {
  //   console.log('sright', studyright)
  //   return studyright.highlevelname.toLowerCase().match(studyRightRegex)
  // })

  const renderStudyright = () => {
    const lastStudyright = student.studyrights.slice(-1)[0]
    return (
      <div>
        <div className={styles.startDate}>
          {`Started in current programme: ${reformatDate(lastStudyright.startdate, DISPLAY_DATE_FORMAT)}`}
        </div>
        <div className={styles.startDate}>
          {lastStudyright.highlevelname}
        </div>
      </div>
    )
  }

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header className={styles.cardHeader}>
          <div>{name}{student.studentNumber}</div>
          <Icon
            name="remove"
            className={styles.controlIcon}
            onClick={onRemove}
          />
        </Card.Header>
        <Card.Meta>
          {renderStudyright()}
        </Card.Meta>
        <Card.Description>
          {`${translate('common.credits')}: ${student.credits || 0}`}
        </Card.Description>
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
  history: shape({}).isRequired
}

const mapStateToProps = state => ({
  showName: state.settings.namesVisible
})

export default withRouter(connect(mapStateToProps, {
  removeStudentSelection, resetStudent
})(StudentInfoCard))

