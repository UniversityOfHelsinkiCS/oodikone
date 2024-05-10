import React from 'react'
import { Link } from 'react-router-dom'

export const StudyProgrammeLink = ({ linkText, programmeCode }) => (
  <Link style={{ color: 'black' }} to={`/study-programme/${programmeCode}`}>
    {linkText}
  </Link>
)
