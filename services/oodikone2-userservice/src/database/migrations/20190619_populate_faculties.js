const valtiotieteellisen_ohjelmat = [
  'KH40_001', // Filosofian kandiohjelma
  'KH70_001', // Politiikan ja viestinnän kandiohjelma
  'KH70_002', // Yhteiskunnallisen muutoksen kandiohjelma
  'KH70_003', // Sosiaalitieteiden kandiohjelma
  'KH70_004', // Taloustieteen kandiohjelma
  'MH50_001', // Matematiikan ja tilastotieteen maisteriohjelma
  'MH50_013', // Kaupunkitutkimuksen ja suunnittelun maisteriohjelma
  'MH57_005', // Ympäristömuutoksen ja globaalin kestävyyden maisteriohjelma
  'MH70_001', // Filosofian maisteriohjelma
  'MH70_002', // Politiikan ja viestinnän maisteriohjelma
  'MH70_003', // Globaalin politiikan ja kommunikaation maisteriohjelma
  'MH70_004', // Yhteiskunnallisen muutoksen maisteriohjelma
  'MH70_005', // Nyky-yhteiskunnan tutkimuksen maisteriohjelma
  'MH70_006', // Euroopan ja pohjoismaiden tutkimuksen maisteriohjelma (European and Nordic Studies)
  'MH70_007', // Yhteiskuntatieteiden maisteriohjelma
  'MH70_008', // Sosiaalitieteiden maisteriohjelma
  'MH70_009', // Taloustieteen maisteriohjelma
  'MH70_010' // International Masters in Economy, State & Society
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      'faculty_programmes',
      valtiotieteellisen_ohjelmat.map(code => ({
        faculty_code: 'H70',
        programme_code: code,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    )
  },
  down: async () => {}
}
