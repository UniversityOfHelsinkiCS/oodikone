import React, { useMemo } from 'react'
import { Dropdown } from 'semantic-ui-react'
import fp from 'lodash/fp'
import { getTextIn, getStudentToTargetCourseDateMap, getNewestProgramme } from '../../../../common'
import useLanguage from '../../../LanguagePicker/useLanguage'
import createFilter from '../createFilter'

const ProgrammeFilterCard = ({ options, onOptionsChange, programmes }) => {
  const { language } = useLanguage()
  const { selectedProgrammes } = options
  const name = 'programmeFilterCard'

  const dropdownOptions = useMemo(
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
    onOptionsChange({
      selectedProgrammes: value,
    })
  }

  return (
    <Dropdown
      options={dropdownOptions}
      placeholder="Select Programme"
      onChange={handleChange}
      button
      value={selectedProgrammes}
      name={name}
      closeOnChange
      multiple
    />
  )
}

const createStudentToProgrammeMap = (courses, students, elementDetails) => {
  if (!elementDetails) {
    return {}
  }

  const studentToTargetCourseDateMap = getStudentToTargetCourseDateMap(students, courses)

  return fp.flow(
    fp.map(student => [
      student,
      getNewestProgramme(student.studyrights, student.studentNumber, studentToTargetCourseDateMap, elementDetails),
    ]),
    fp.reduce(
      ({ programmeMap, studentToProgrammeMap }, [student, programme]) => {
        return {
          programmeMap: { ...programmeMap, [programme.code]: programme },
          studentToProgrammeMap: {
            ...studentToProgrammeMap,
            [student.studentNumber]: programme.code,
          },
        }
      },
      { programmeMap: {}, studentToProgrammeMap: {} }
    ),
    ({ programmeMap, studentToProgrammeMap }) => ({
      programmes: Object.values(programmeMap),
      studentToProgrammeMap,
    })
  )(students)
}

export default (courses, elementDetails) =>
  createFilter({
    key: 'Programme',

    defaultOptions: {
      selectedProgrammes: [],
    },

    precompute: [
      students => createStudentToProgrammeMap(courses, students, elementDetails ?? []),
      [courses, elementDetails],
    ],

    isActive: ({ selectedProgrammes }) => selectedProgrammes.length > 0,

    filter({ studentNumber }, { selectedProgrammes }, { studentToProgrammeMap }) {
      return selectedProgrammes.findIndex(pcode => pcode === studentToProgrammeMap[studentNumber]) !== -1
    },

    render: (props, { programmes }) => <ProgrammeFilterCard {...props} programmes={programmes} />,
  })
