import React from 'react'
import { Checkbox } from 'semantic-ui-react'
import { func, bool } from 'prop-types'

const CumulativeCheckbox = ({ cumulativeStats, setCumulativeStats }) => {
  const handleChange = () => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    setCumulativeStats(!cumulativeStats)
  }

  return (
    <Checkbox toggle checked={cumulativeStats} onChange={handleChange} label="Show cumulative stats" size="small" />
  )
}

CumulativeCheckbox.propTypes = {
  cumulativeStats: bool.isRequired,
  setCumulativeStats: func.isRequired,
}

export default CumulativeCheckbox
