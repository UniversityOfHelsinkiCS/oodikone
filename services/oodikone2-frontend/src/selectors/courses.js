import { createSelector } from 'reselect'
import { byDateDesc, reformatDate, getTextIn } from '../common'

const getData = obj => obj

const getInstanceData = obj => obj.data

export const sortInstances = (courseInstances) => {
  if (courseInstances) {
    return courseInstances.sort(byDateDesc).map(instance => ({
      key: instance.id,
      text: `${reformatDate(instance.date, 'DD.MM.YYYY')} (${instance.students} students)`,
      value: instance.id,
      ...instance
    }))
  }
  return []
}

export const sortCourses = courseList => Object.values(courseList.data)
  .sort(byDateDesc)
  .map(course => ({
    ...course, key: `${course.name}-${course.code}`, selected: courseList.selected.some(c => course.code === c.code)
  }))

export const makeSortCourseInstances = () => createSelector(
  getInstanceData,
  sortInstances
)

export const makeSortCourses = () => createSelector(
  getData,
  sortCourses
)

export const getCourseSearchResults = (state) => {
  const { language } = state.settings
  return state.courseSearch.data.map(({ name, ...rest }) => ({
    ...rest,
    name: getTextIn(name, language)
  }))
}
