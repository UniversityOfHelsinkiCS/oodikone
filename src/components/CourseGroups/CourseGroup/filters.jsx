import React, { Fragment } from 'react'
import { Header, Dropdown, Button } from 'semantic-ui-react'
import { number, arrayOf, func } from 'prop-types'
import { academicYearType } from './util'

import styles from './courseGroup.css'

const Filters = ({ academicYears, semesterCode, handleSemesterCodeChangeFn }) => {
  if (!academicYears) {
    return null
  }

  const academicYearSelectOptions = academicYears.map(ac => ({
    key: ac.semestercode,
    value: ac.semestercode,
    text: ac.yearname }))

  const semesterCodeDifference = 2
  const academicYearSelectId = 'academicYearSelect'
  const semesterCodes = academicYears.map(ac => ac.semestercode)
  const isMaxSemesterCode = semesterCode === Math.max(...semesterCodes)
  const isMinSemesterCode = semesterCode === Math.min(...semesterCodes)

  return (
    <Fragment>
      <Header size="medium">
        Filters
      </Header>
      <div className={styles.academicYearFilterContainer}>
        <Button
          type="button"
          icon="angle left"
          className={isMinSemesterCode ? styles.hiddenButton : styles.filterButton}
          onClick={e => handleSemesterCodeChangeFn(
            e,
            { value: semesterCode - semesterCodeDifference }
            )}
        />
        <div className={styles.academicYearSelectContainer}>
          <label htmlFor={academicYearSelectId}>Academic year</label>
          <Dropdown
            id={academicYearSelectId}
            search
            fluid
            selection
            options={academicYearSelectOptions}
            value={semesterCode}
            onChange={handleSemesterCodeChangeFn}
          />
        </div>
        <Button
          type="button"
          icon="angle right"
          className={isMaxSemesterCode ? styles.hiddenButton : styles.filterButton}
          onClick={e => handleSemesterCodeChangeFn(
              e,
              { value: semesterCode + semesterCodeDifference }
              )}
        />
      </div>
    </Fragment>
  )
}

export default Filters

Filters.propTypes = {
  semesterCode: number,
  academicYears: arrayOf(academicYearType),
  handleSemesterCodeChangeFn: func.isRequired
}

Filters.defaultProps = {
  semesterCode: undefined,
  academicYears: undefined
}
