import React from 'react'
import { Popup, Button, Icon } from 'semantic-ui-react'
import { useLocation } from 'react-router-dom'
import { useStore } from 'react-hookstore'
import { getMonths } from '../../../common/query'
import { storeName } from '../../FilterTray/filters/TotalCredits'

const ExternalCreditFilterToggle = ({ min, max }) => {
  const [totalCreditsExternal, setTotalCreditsExternal] = useStore(storeName)
  const months = getMonths(useLocation())
  const limitedMax = max === 0 ? 1 : max

  const updateFilters = () => setTotalCreditsExternal({ min, max: limitedMax })

  const active = totalCreditsExternal.min === min && totalCreditsExternal.max === limitedMax

  return (
    <Popup
      content={`Rajaa opiskelijat ensimmäisen ${months} kuukauden aikana saatujen opintopisteiden perusteella`}
      size="mini"
      trigger={
        <Button onClick={updateFilters} size="mini" icon basic={!active}>
          <Icon name="filter" />
        </Button>
      }
    />
  )
}

export default ExternalCreditFilterToggle
