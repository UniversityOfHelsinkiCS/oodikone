import React from 'react'
import { Link } from 'react-router-dom'
import { Icon, Item } from 'semantic-ui-react'

import { SisuLinkItem } from './SisuLinkItem'

export const StudentInfoItem = ({ student, showSisuLink }) => {
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
      <Item as={Link} style={{ marginLeft: '10px', marginRight: '10px' }} to={`/students/${student.studentNumber}`}>
        <Icon name="user outline" />
      </Item>
      {showSisuLink && <SisuLinkItem id={student.sis_person_id} />}
    </div>
  )
}
