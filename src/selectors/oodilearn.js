const getSearchedCourses = (state) => {
  const { settings, oodilearnCourses } = state
  const { language } = settings
  return oodilearnCourses.data.map(({ code, name }) => ({
    code,
    name: name[language]
  }))
}

export default {
  getSearchedCourses
}
