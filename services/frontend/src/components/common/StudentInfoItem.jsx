import ArrowIcon from '@mui/icons-material/NorthEast'
import { Link } from '@/components/material/Link'

import { SisuLinkItem } from './SisuLinkItem'

export const StudentInfoItem = ({ showSisuLink, student }) => {
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
      <Link sx={{ marginLeft: '10px', marginRight: '10px' }} to={`/students/${student.studentNumber}`}>
        <ArrowIcon />
      </Link>
      {showSisuLink ? <SisuLinkItem id={student.sis_person_id} /> : null}
    </div>
  )
}
