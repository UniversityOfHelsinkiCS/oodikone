import React from 'react'
import { Checkbox } from 'semantic-ui-react'
import { func, bool } from 'prop-types'
import TSA from '../../../common/tsa'

const CumulativeCheckbox = ({ cumulativeStats, setCumulativeStats }) => {
  const handleChange = () => {
    TSA.Matomo.sendEvent(
      'Population statistics',
      'Courses of Population toggle cumulative when passed stats',
      cumulativeStats ? 'false' : 'true'
    )
    // eslint-disable-next-line react/no-access-state-in-setstate
    setCumulativeStats(!cumulativeStats)
  }

  return <Checkbox toggle checked={cumulativeStats} onChange={handleChange} label="Show cumulative stats" />
}

CumulativeCheckbox.propTypes = {
  cumulativeStats: bool.isRequired,
  setCumulativeStats: func.isRequired
}

export default CumulativeCheckbox
