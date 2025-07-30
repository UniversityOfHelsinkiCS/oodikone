module.exports = {
  up: async queryInterface => {
    await queryInterface.renameColumn('sis_study_right_elements', 'study_tracks', 'study_track')
  },
  down: async queryInterface => {
    await queryInterface.renameColumn('sis_study_right_elements', 'study_track', 'study_tracks')
  },
}
