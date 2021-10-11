import React, { useState, createContext, useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getStudentToTargetCourseDateMap, getNewestProgramme } from '../../../../common'
import useFilters from '../../useFilters'

const ProgrammeFilterContext = createContext([[], () => {}])
ProgrammeFilterContext.displayName = 'Programme Filter'

const defaultState = {
  selectedProgrammes: [],
}

export const ProgrammeFilterProvider = ({ children }) => {
  const [state, setState] = useState(defaultState)
  const [courseCodes, setCourseCodes] = useState([])

  const { selectedProgrammes } = state

  const setSelectedProgrammes = programmes => {
    setState({
      selectedProgrammes: programmes,
    })
  }

  const context = {
    selectedProgrammes,
    setSelectedProgrammes,
    courseCodes,
    setCourseCodes,
  }

  return <ProgrammeFilterContext.Provider value={context}>{children}</ProgrammeFilterContext.Provider>
}

export default () => {
  const { selectedProgrammes, courseCodes, setCourseCodes, setSelectedProgrammes } = useContext(ProgrammeFilterContext)

  const { allStudents } = useFilters()

  const studentToTargetCourseDateMap = useMemo(
    () => getStudentToTargetCourseDateMap(allStudents, courseCodes),
    [allStudents]
  )

  const elementDetails = useSelector(state => state?.populations?.data?.elementdetails?.data)

  const { programmes, studentToProgrammeMap } = useMemo(() => {
    if (!elementDetails) {
      return {
        programmes: [],
        studentToProgrammeMap: {},
      }
    }

    const programmeMap = {}
    const studentToProgrammeMap = {}

    allStudents
      .map(student => [
        student,
        getNewestProgramme(student.studyrights, student.studentNumber, studentToTargetCourseDateMap, elementDetails),
      ])
      .forEach(([{ studentNumber }, programme]) => {
        programmeMap[programme.code] = programme
        studentToProgrammeMap[studentNumber] = programme.code
      })

    return {
      programmes: Object.values(programmeMap),
      studentToProgrammeMap,
    }
  }, [allStudents, elementDetails])

  const selectFilterProgramme = code => {
    const index = selectedProgrammes.findIndex(p => p.code === code)

    if (index !== -1) {
      return
    }

    const programme = programmes.find(p => p.code === code)

    if (programme === undefined) {
      return
    }

    setSelectedProgrammes([...selectedProgrammes, programme])
  }

  const removeFilterProgramme = code => {
    const index = selectedProgrammes.findIndex(p => p.code === code)
    const newSelection = [...selectedProgrammes]
    newSelection.splice(index, 1)
    setSelectedProgrammes(newSelection)
  }

  const toggleFilterProgramme = code => {
    const index = selectedProgrammes.findIndex(p => p.code === code)

    if (index === -1) {
      const programme = programmes.find(p => p.code === code)
      setSelectedProgrammes([...selectedProgrammes, programme])
    } else {
      const newSelection = [...selectedProgrammes]
      newSelection.splice(index, 1)
      setSelectedProgrammes(newSelection)
    }
  }

  return {
    programmes,
    selectedProgrammes,
    toggleFilterProgramme,
    selectFilterProgramme,
    removeFilterProgramme,
    setCourseCodes,
    studentToProgrammeMap,
  }
}
