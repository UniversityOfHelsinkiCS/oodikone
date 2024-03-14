// In .env, have the token wrapped in quotes! (") otherwise some signs may be mistakenly changed
const rapoToken = process.env.RAPO_NODEPROXY
const importerDbApiToken = process.env.IMPORTER_DB_API_TOKEN

const nodeproxyUrl = 'https://toska.cs.helsinki.fi'
const importerDbApiUrl = 'https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/importer'

const bscProgrammesOfFaculties = {
  H10: ['KH10_001'],
  H20: ['KH20_001'],
  H30: ['KH30_001', 'KH30_002'],
  H40: ['KH40_001', 'KH40_002', 'KH40_003', 'KH40_004', 'KH40_005', 'KH40_006'],
  H50: ['KH50_001', 'KH50_002', 'KH50_003', 'KH50_004', 'KH50_005', 'KH50_006', 'KH50_007', 'KH50_008'],
  H55: ['KH55_001'],
  H60: ['KH60_001'],
  H70: ['KH70_001', 'KH70_002', 'KH70_003', 'KH70_004'],
  H74: ['KH74_001'],
  H80: ['KH80_001', 'KH80_002', 'KH80_003', 'KH80_004'],
  H90: ['KH90_001'],
}

module.exports = {
  rapoToken,
  importerDbApiToken,
  nodeproxyUrl,
  importerDbApiUrl,
  bscProgrammesOfFaculties,
}
