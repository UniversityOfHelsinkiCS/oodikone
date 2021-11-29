import React from 'react'
import ExternalFilterToggle from '../../FilterTray/ExternalFilterToggle'
import { contextKey } from '../../FilterTray/filters/Grade'

const ExternalGradeFilterToggle = (/* { grade } */) => {
  // const { value, setValue } = useGradeFilter() FIXME

  return (
    <ExternalFilterToggle
      filterPanelContextKey={contextKey}
      applyFilter={() => {} /* setValue(value.concat(grade)) */}
      clearFilter={() => {} /* FIXME setValue(value.filter(val => val !== grade)) */}
      active={false /* FIXME: value.includes(grade) */}
      filterName="Grade Filter"
      popupContent="Rajaa opiskelijat kurssin arvosanan perusteella."
    />
  )
}

export default ExternalGradeFilterToggle
