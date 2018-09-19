import { createSelector } from 'reselect'

const getCourseStats = state => state.courseStats.data

const ALL = {
  key: 'all',
  value: 'all',
  text: 'All'
}

const mergeUnique = (arr1, arr2) => [...new Set([...arr1, ...arr2])]

const getAllStudyProgrammes = createSelector([getCourseStats], (courseStats) => {
  const all = {}
  let studentnumbers = []
  Object.values(courseStats).forEach((stat) => {
    const { programmes: p } = stat
    Object.entries(p).forEach((entry) => {
      const [code, info] = entry
      const { name, students } = info
      studentnumbers = mergeUnique(studentnumbers, students)
      if (!all[code]) {
        all[code] = {
          key: code,
          value: code,
          text: name.fi || name.en || name.sv,
          students
        }
      } else {
        const programme = all[code]
        programme.students = mergeUnique(students, programme.students)
      }
    })
  })
  const programmes = Object.values(all)
    .map(p => ({ ...p, size: p.students.length || 0 }))
    .sort((p1, p2) => p2.size - p1.size)
  return [
    { ...ALL, students: studentnumbers, size: studentnumbers.length },
    ...programmes
  ]
})

export default {
  getAllStudyProgrammes,
  ALL
}
