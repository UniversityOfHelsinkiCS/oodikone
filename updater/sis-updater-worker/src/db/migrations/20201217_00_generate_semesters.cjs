const startYear = 1950
const endYear = 2050

const org = 'hy-university-root-id'

const semesters = []

let semestercode = 1
let yearcode = 1

for (let year = startYear; year <= endYear; year++) {
  semesters.push({
    composite: `${org}-${semestercode}`,
    semestercode: semestercode++,
    name: {
      en: `Autumn ${year}`,
      fi: `Syksy ${year}`,
      sv: `Hösten ${year}`,
    },
    startdate: `${year}-08-01`,
    enddate: `${year + 1}-01-01`,
    yearcode,
    org,
    yearname: `${year}-${year + 1}`,
    term_index: 0,
    start_year: year,
  })

  semesters.push({
    composite: `${org}-${semestercode}`,
    semestercode: semestercode++,
    name: {
      en: `Spring ${year + 1}`,
      fi: `Kevät ${year + 1}`,
      sv: `Våren ${year + 1}`,
    },
    startdate: `${year + 1}-01-01`,
    enddate: `${year + 1}-08-01`,
    yearcode,
    org,
    yearname: `${year}-${year + 1}`,
    term_index: 1,
    start_year: year,
  })
  yearcode++
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('semesters', semesters, {}, { name: { type: new Sequelize.JSON() } })
  },

  down: async queryInterface => {
    await queryInterface.bulkDelete('semesters', null, {})
  },
}
