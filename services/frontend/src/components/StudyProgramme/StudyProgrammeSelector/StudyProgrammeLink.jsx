import { Link } from 'react-router'

export const StudyProgrammeLink = ({ linkText, programmeCode }) => (
  <Link style={{ color: 'black' }} to={`/study-programme/${programmeCode}`}>
    {linkText}
  </Link>
)
