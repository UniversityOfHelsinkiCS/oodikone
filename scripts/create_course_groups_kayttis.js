const { createCourseGroup } = require('../src/services/courseGroups')

const run = async () => {
  await Promise.all(groups.map(name => createCourseGroup(name)))
  process.exit(0)
}

const groups = [
  'Yleinen ja aikuiskasvatustiede',
  'Kasvatustiede, yleinen didaktiikka',
  'Kasvatuspsykologia',
  'Varhaiskasvatus (VO+VAKAMO)',
  'Erityispedagogiikka',
  'Kotitaloustiede',
  'Käsityötiede',
  'Aikuisopetus',
  'Biologia ja maantiede',
  'Historia ja yhteiskuntaoppi',
  'Uskonto',
  'Elämänkatsomustieto',
  'Suomen kieli ja kirjallisuus',
  'Vieraat kielet',
  'Matematiikka',
  'Fysiikka ja kemia',
  'Musiikki',
  'Kuvataide',
  'Liikunta',
  'Draama',
  'Mediakasvatus',
  'Tiedekeskuspedagogiikka',
  'Svenska studier'
]

run()