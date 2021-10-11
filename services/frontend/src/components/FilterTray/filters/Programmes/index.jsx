import React, { useEffect, useMemo } from 'react'
import { Dropdown } from 'semantic-ui-react'
import FilterCard from '../common/FilterCard'
import { getTextIn } from '../../../../common'
import useLanguage from '../../../LanguagePicker/useLanguage'
import useProgrammeFilter from './useProgrammeFilter'
import useFilters from '../../useFilters'

const Programme = () => {
  const { programmes, selectedProgrammes, studentToProgrammeMap, selectFilterProgramme, removeFilterProgramme } =
    useProgrammeFilter()
  const { removeFilter, addFilter } = useFilters()
  const { language } = useLanguage()
  const name = 'programmeFilter'

  const options = useMemo(
    () =>
      programmes
        .map(program => ({
          key: `programme-filter-value-${program.code}`,
          text: getTextIn(program.name, language),
          value: program.code,
        }))
        .sort((a, b) => a.text.localeCompare(b.text)),
    [programmes, language]
  )

  const handleChange = (_, { value }) => {
    value.filter(code => selectedProgrammes.findIndex(p => p.code === code) === -1).forEach(selectFilterProgramme)

    selectedProgrammes.filter(({ code }) => value.indexOf(code) === -1).forEach(removeFilterProgramme)
  }

  useEffect(() => {
    if (selectedProgrammes.length === 0) {
      removeFilter(name)
    } else {
      addFilter(name, ({ studentNumber }) => {
        return selectedProgrammes.findIndex(p => p.code === studentToProgrammeMap[studentNumber]) !== -1
      })
    }
  }, [selectedProgrammes, studentToProgrammeMap])

  return (
    <FilterCard title="Programme" active={selectedProgrammes.length > 0} className="programmes-filter" name={name}>
      <Dropdown
        options={options}
        placeholder="Select Programme"
        onChange={handleChange}
        button
        value={selectedProgrammes.map(p => p.code)}
        name={name}
        closeOnChange
        multiple
      />
    </FilterCard>
  )
}

export default Programme
