import React from 'react'
import PropTypes from 'prop-types'
import useGradeFilter from '../../FilterTray/filters/Grade/useGradeFilter'
import ExternalFilterToggle from '../../FilterTray/ExternalFilterToggle'
import { contextKey } from '../../FilterTray/filters/Grade'

const ExternalGradeFilterToggle = ({ grade }) => {
  const { value, setValue } = useGradeFilter()

  return (
    <ExternalFilterToggle
      filterPanelContextKey={contextKey}
      applyFilter={() => setValue(value.concat(grade))}
      clearFilter={() => setValue(value.filter(val => val !== grade))}
      active={value.includes(grade)}
      filterName="Grade Filter"
      popupContent="Rajaa opiskelijat kurssin arvosanan perusteella."
    />
  )
}

ExternalGradeFilterToggle.propTypes = {
  grade: PropTypes.string.isRequired
}

export default ExternalGradeFilterToggle
