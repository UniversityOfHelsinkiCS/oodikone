// Data from helsinki.fi/rapo -> opiskelijat -> Koulutusohjelmat -> Opiskelijat -> Valitse tiedekunta ja/tai koulutusohjelma
const faculty_to_programmes = {
  H10: [
    'MH10_001',
    'MH40_011',
    'KH10_001',
  ],
  H20: [
    'KH20_001',
    'MH20_001',
    'MH20_002',
  ],
  H30: [
    'KH30_001',
    'KH30_002',
    'MH30_002',
    'MH30_003',
    'MH30_004',
    'MH30_005',
    'MH30_001',
  ],
  H40: [
    'KH40_001',
    'KH40_002',
    'KH40_003',
    'KH40_004',
    'KH40_005',
    'KH40_006',
    'MH40_001',
    'MH40_002',
    'MH40_003',
    'MH40_004',
    'MH40_005',
    'MH40_006',
    'MH40_007',
    'MH40_008',
    'MH40_009',
    'MH40_010',
    'MH40_011',
    'MH40_012',
    'MH40_013',
    'MH40_014',
    'MH40_015',
    'MH70_001',
    'MH70_006',
  ],
  H50: [
    'KH50_001',
    'KH50_002',
    'KH50_003',
    'KH50_004',
    'KH50_005',
    'KH50_006',
    'KH50_007',
    'MH50_001',
    'MH50_002',
    'MH50_003',
    'MH50_004',
    'MH50_005',
    'MH50_006',
    'MH50_007',
    'MH50_008',
    'MH50_009',
    'MH50_010',
    'MH50_011',
    'MH50_012',
    'MH50_013',
  ],
  H55: [
    'KH55_001',
    'MH55_001',
  ],
  H57: [
    'KH57_001',
    'KH57_002',
    'KH57_003',
    'MH50_002',
    'MH50_013',
    'MH57_001',
    'MH57_002',
    'MH57_003',
    'MH57_004',
    'MH57_005',
    'MH80_007',
  ],
  H60: [
    'KH60_001',
    'MH60_001',
  ],
  H70: [
    'KH40_001',
    'KH50_001',
    'KH70_001',
    'KH70_002',
    'KH70_003',
    'KH70_004',
    'MH50_001',
    'MH57_005',
    'MH70_001',
    'MH70_002',
    'MH70_003',
    'MH70_004',
    'MH70_005',
    'MH70_006',
    'MH70_007',
    'MH70_008',
    'MH70_009',
    'MH70_010',
  ],
  H74: [
    'KH74_001',
  ],
  H80: [
    'KH57_002',
    'KH80_001',
    'KH80_002',
    'KH80_003',
    'KH80_004',
    'MH57_002',
    'MH57_003',
    'MH57_005',
    'MH80_001',
    'MH80_002',
    'MH80_003',
    'MH80_004',
    'MH80_005',
    'MH80_006',
    'MH80_007',
  ],
  H90: [
    'KH90_001',
  ],
}

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkDelete(
      'faculty_programmes'
    )
    for (const faculty of Object.keys(faculty_to_programmes)) {
      await queryInterface.bulkInsert(
        'faculty_programmes',
        faculty_to_programmes[faculty].map(programme => ({
          faculty_code: faculty,
          programme_code: programme,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      )
    }
  },
  down: async () => {}
}
