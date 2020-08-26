import React from 'react'
import PropTypes from 'prop-types'
import { Popup, Button, Icon } from 'semantic-ui-react'
import { useLocation } from 'react-router-dom'
import { getMonths } from '../../../common/query'
import useCreditFilter from '../../FilterTray/filters/CreditsEarned/useCreditFilter'
import { contextKey as filterTrayContextKey } from '../../FilterTray'
import { contextKey as creditFilterContextKey } from '../../FilterTray/filters/CreditsEarned'
import useFilterTray from '../../FilterTray/useFilterTray'
import useAnalytics from '../../FilterTray/useAnalytics'

const ExternalCreditFilterToggle = ({ min, max }) => {
  const { currentValue: currentFilterValue, setRequestedValue } = useCreditFilter()
  const [, setFilterTrayOpen] = useFilterTray(filterTrayContextKey)
  const [, setCreditFilterOpen] = useFilterTray(creditFilterContextKey)
  const filterAnalytics = useAnalytics()
  const name = 'Credit Filter'

  const months = getMonths(useLocation())
  const limitedMax = max === 0 ? 1 : max

  const currentMin = currentFilterValue.min === '' ? null : Number(currentFilterValue.min)
  const currentMax = currentFilterValue.max === '' ? null : Number(currentFilterValue.max)
  const active = currentMin === min && currentMax === limitedMax

  const updateFilters = () => {
    if (active) {
      setRequestedValue({ min: null, max: null })
      filterAnalytics.clearFilterViaTable(name)
    } else {
      setRequestedValue({ min, max: limitedMax })
      setFilterTrayOpen(true)
      setCreditFilterOpen(true)
      filterAnalytics.setFilterViaTable(name)
    }
  }

  return (
    <Popup
      content={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
      size="mini"
      trigger={
        <Button onClick={updateFilters} size="mini" icon basic={!active} primary={active}>
          <Icon name="filter" />
        </Button>
      }
    />
  )
}

ExternalCreditFilterToggle.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number
}

ExternalCreditFilterToggle.defaultProps = {
  min: null,
  max: null
}

export default ExternalCreditFilterToggle
