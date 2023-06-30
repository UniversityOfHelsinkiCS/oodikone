import React from 'react'
import { Icon, Item } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import SisuLinkItem from './SisuLinkItem'

const StudentInfoItem = ({ student, showSisuLink }) => {
  if (student.obfuscated) {
    return (
      <span style={student.obfuscated ? { fontStyle: 'italic', color: 'graytext' } : {}}>
        {!student.obfuscated ? student.studentNumber : 'hidden'}
      </span>
    )
  }
  return (
    <div style={{ display: 'inline-flex' }}>
      <div>{student.studentNumber}</div>
      <Item as={Link} to={`/students/${student.studentNumber}`} style={{ marginLeft: '10px', marginRight: '10px' }}>
        <Icon name="user outline" />
      </Item>
      {showSisuLink && <SisuLinkItem id={student.sis_person_id} />}
    </div>
  )
}

export default StudentInfoItem
