import uuidv4 from 'uuid/v4'

export const creditsLessThan = credit =>
  ({
    id: uuidv4(),
    type: 'creditsLessThan',
    params: [credit],
    filter: (student) => {
      const creditsOfStudent = student.courses
        .filter(c => c.passed)
        .reduce((s, c) => s + c.credits, 0)
      return credit > creditsOfStudent
    }
  })


export const placeHhlder = () => () =>
  console.log('lol')
