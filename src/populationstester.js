const Populations = require('./services/populations')

let conf = { 'studyRights': ['Bachelor of Science (Biological and Environmental Sciences), Environmental Sciences'], 'courses':[]}
console.log(conf.studyRights)
const run = async () => {
  const yo = await Populations.statisticsOf(conf)
  console.log(yo.length)
  process.exit()
}

run()

// Bachelor of Food Sciences, Environmental Soil Science
// Bachelor of Laws, Environmental Law
// Bachelor of Science (Agriculture and Forestry), Agricultural and Environmental Engineering
// Bachelor of Science (Agriculture and Forestry), Environmental Economics
// Bachelor of Science (Agriculture and Forestry), Environmental Science and Policy
// Bachelor of Science (Agriculture and Forestry), Environmental Soil Science
// Bachelor of Science (Agriculture and Forestry), Microbiology, Environmental Soil Science
// Bachelor of Science (Biological and Environmental Sciences), Aquatic Sciences
// Bachelor of Science (Biological and Environmental Sciences), Biochemistry
// Bachelor of Science (Biological and Environmental Sciences), Biology
// Bachelor of Science (Biological and Environmental Sciences), Biotechnology
// Bachelor of Science (Biological and Environmental Sciences), Environmental Change and Policy
// Bachelor of Science (Biological and Environmental Sciences), Environmental Ecology
// Bachelor of Science (Biological and Environmental Sciences), Environmental Science and Policy
// Bachelor of Science (Biological and Environmental Sciences), Environmental Sciences
// Bachelor of Science (Biological and Environmental Sciences), Fishery Science, Limnology
// Bachelor of Science (Biological and Environmental Sciences), Genetics
// Bachelor of Science (Biological and Environmental Sciences), Hydrobiology
// Bachelor of Science (Biological and Environmental Sciences), Molecular Biosciences
// Bachelor of Science (Biosciences), Environmental Biology
// Bachelor of Science (Biosciences), Environmental Ecology
// Bachelor of Science (Biosciences), Environmental Science and Policy
