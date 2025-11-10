import { useState } from 'react'
import { useTitle } from '@/hooks/title'
import { CustomPopulationSearch } from '@oodikone/shared/models/kone'
import { CustomPopulationSearchForm } from './CustomPopulationSearchForm'
import { CustomPopulationWrapper } from './CustomPopulationWrapper'

export type CustomPopulationState = {
  selectedSearch: CustomPopulationSearch | null
  studentNumbers: string[]
  associatedProgramme?: string // programme code
}

/**
 * Custom population uses a single url /custompopulation across form/class stats view.
 * To completely reset the population when clicking back to form the whole class stats component
 * is unmounted. The same population is still cached though if user wishes to reload it.
 */
export const CustomPopulation = () => {
  useTitle('Custom population')

  const defaultState = {
    selectedSearch: null,
    studentNumbers: [],
    associatedProgramme: '',
  }

  const [populationVisible, setPopulationVisible] = useState(false)
  const [customPopulationState, setCustomPopulationState] = useState<CustomPopulationState>(defaultState)

  const showPopulation = () => setPopulationVisible(true)

  const resetState = () => {
    setCustomPopulationState(defaultState)
    setPopulationVisible(false)
  }

  if (!populationVisible) {
    return (
      <CustomPopulationSearchForm setCustomPopulationState={setCustomPopulationState} showPopulation={showPopulation} />
    )
  }

  return <CustomPopulationWrapper customPopulationState={customPopulationState} resetState={resetState} />
}
