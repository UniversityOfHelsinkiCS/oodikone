const Sequelize = require('sequelize')
const moment = require('moment')
const { getDate } = require('./database_updater/oodi_data_mapper')
const { Student, Credit, CourseInstance, Course } = require('../models')
const Op = Sequelize.Op

const createStudent = (array) => Student.create({
  studentnumber: array[0],
  lastname: array[4],
  firstnames: array[5],
  abbreviatedname: array[6],
  birthdate: getDate(array[2]),
  communicationlanguage: array[22],
  country: array[15],
  creditcount: array[18],
  dateoffirstcredit: getDate(array[20]),
  dateoflastcredit: getDate(array[21]),
  dateofuniversityenrollment: getDate(array[19]),
  gradestudent: array[25],
  matriculationexamination: array[24],
  nationalities: array[23],
  semesterenrollmenttypecode: array[16],
  sex: array[3],
  studentstatuscode: array[17]
})

const updateStudent = (array) => Student.update({
  studentnumber: array[0],
  lastname: array[4],
  firstnames: array[5],
  abbreviatedname: array[6],
  birthdate: getDate(array[2]),
  communicationlanguage: array[22],
  country: array[15],
  creditcount: array[18],
  dateoffirstcredit: getDate(array[20]),
  dateoflastcredit: getDate(array[21]),
  dateofuniversityenrollment: getDate(array[19]),
  gradestudent: array[25],
  matriculationexamination: array[24],
  nationalities: array[23],
  semesterenrollmenttypecode: array[16],
  sex: array[3],
  studentstatuscode: array[17]
},
{
  where: {
    studentnumber: {
      [Op.eq]: array[0]
    }
  }
})

const byId = async (id) => Student.findOne({
  include: [
    {
      model: Credit,
      include: [
        {
          model: CourseInstance,
          include: [Course]
        }
      ]
    }
  ],
  where: {
    studentnumber: {
      [Op.eq]: id
    }
  }
})

const byAbreviatedNameOrStudentNumber = (searchTerm) => {
  return Student.findAll({
    limit: 10,
    where: {
      [Op.or]: [
        {
          studentnumber: {
            [Op.like]: searchTerm
          }
        },
        {
          abbreviatedname: {
            [Op.iLike]: searchTerm
          }
        }
      ]

    }
  })
}

const formatStudent = ({ studentnumber, dateofuniversityenrollment, creditcount, credits }) => {

  const toCourse = ({ grade, credits, courseinstance }) => {
    return {
      course: {
        code: courseinstance.course_code,
        name: courseinstance.course.name
      },
      date: courseinstance.coursedate,
      passed: Credit.passed({ grade }),
      grade,
      credits
    }
  }

  const byDate = (a, b) => {
    return moment(a.courseinstance.coursedate).isSameOrBefore(b.courseinstance.coursedate) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }

  return {
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount,
    courses: credits.sort(byDate).map(toCourse),
    tags: []
  }
}

const formatStudentUnifyCodes = ({ studentnumber, dateofuniversityenrollment, creditcount, credits }) => {
  const unifyOpenUniversity = (code) => {
    if (code[0] === 'A') {
      return code.substring(code[1] === 'Y' ? 2 :1 )
    } 
    return code
  }

  const oldToNew = (code) => {
    const codeMap = {
      '58131': 'TKT20001',  // tira
      '58161': 'TKT20010',  // tiralab
      '581305': 'TKT10005', // tito  
      '581328': 'TKT10004', // tikape
      '581259':'TKT20006', // ohtu
      '581260': 'TKT20007', // ohtuproj
      '582206': 'TKT20005', // lama
      '57033': 'MAT11001', // jym
      '581324': 'TKT50003', //
      '581325': 'TKT10002', // Ohjelmoinnin perusteet
      '582514': '80088', // TVT-ajokortti
      '582102': 'TKT10001', // Johdatus tietojenkäsittelytieteeseen
      '582103': 'TKT10003', // Ohjelmoinnin jatkokurssi
      '582202': 'TKT20004', // Tietoliikenteen perusteet
      '582203': 'TKT20011', // Aineopintojen harjoitustyö: Tietokantasovellus
      '57043': 'MAT11002', // Lineaarialgebra ja matriisilaskenta I
      '57160': 'MAT21014', // Johdatus logiikkaan I
      '582335': 'TKT21015', // Versionhallinta
      '582733': 'TKT21002', // Introduction to Game Programming
      '57047': 'MAT21001', // Lineaarialgebra ja matriisilaskenta II
      '57116': 'MAT11003', // Raja-arvot
      '582216': 'DATA15001', // Johdatus tekoälyyn
      '57161': 'MAT21015', // Johdatus logiikkaan II
      '582509': 'TKT50005', // Tietotekniikka-alan ammattitehtävissä työskentely
      '57117': 'MAT11004', // Differentiaalilaskenta
      '53861': 'FYS2041', // Tähtitieteen perusteet I
      '582506': 'TKT50002', // Tutkimustiedonhaku
      '582204': 'TKT20013', // Kandidaatin tutkielma
      '582505': 'TKT50001', // Äidinkielinen viestintä
      '584111': 'TKT1', // Tietojenkäsittelytieteen perusopinnot
      '582482': 'TKT21001', // Tietokannan suunnittelu
      '582326': 'TKT21013', // Robottiohjelmoinnin harjoitustyö
      '581358': 'CSM14101', // Ohjelmistoarkkitehtuurit
      '581362': 'CSM14203', // Ohjelmointikielten periaatteet
      '582663': 'CSM14103', // Ohjelmistoarkkitehtuurien harjoitustyö
      '53905': 'FYS4012', // Maailmankaikkeus nyt
      '581360': 'CSM14105', // Ohjelmistoprojektien johtaminen ja ryhmädynamiikka
      '55052': 'KEK101', // Atomit, molekyylit ja vuorovaikutukset
      '64162': '65122', // Avoin yo: P 2. Kasvatus, yhteiskunta ja kulttuuri
      '55059': 'KEK223', // Liuoskemia
      '57121': 'MAT21003', // Vektorianalyysi I
      '530281': 'FYS1001', // Vuorovaikutukset ja kappaleet
      '57122': 'MAT21020', // Vektorianalyysi II
      '582749': 'CSM13202', // Cryptography in Networking
      '200017': 'ON-160', // Oikeuskieli
      '770044': '770270', // Viestinnän syventävät opinnot
      '57044': 'MAT21012', // Differentiaaliyhtälöt I
      '57101': 'MAT21007', // Mitta ja integraali
      '57048': 'MAT21013', // Differentiaaliyhtälöt II
      '99501Kaikki': '99501Mat-lu', // English Academic & Professional Skills: Reading, Writing & Spoken Communication (CEFR B2)*
      '530146': '57595', // Kandidaatintutkielma
      '530282': 'FYS1002', // Vuorovaikutukset ja aine
      '57714': '78134', // Lineaariset mallit
      '58160': '582221', // Aineopintojen harjoitustyö: Ohjelmointi
      '55053': 'KEK103', // Energia, reaktiivisuus ja kemiallinen tasapaino
      '55395': 'KEK110', // Kemian perusteet
      '68153Fys': '68153Mat', // Ainedid. 1 ryhmät
      '68152': 'PED111', // Perusharjoittelu
      '57169': 'MFK-403', // Opiskelijalähtöinen ohjaaminen
      '55056': '55521', // Orgaaninen kemia I
      '53398': 'FYS1013', // Tieteellinen laskenta I
      '53723': 'FYS2010', // Fysiikan matemaattiset menetelmät Ia
      '57124': 'MFK-M303', // Yliopistomatematiikka aineenopettajan näkökulmasta
      '53724': 'FYS2011', // Fysiikan matemaattiset menetelmät Ib
      '57136': 'MFK-M305', // Matematiikan opetuslaboratorio
      '530177': 'FYS2083', // Nanotieteen perusteet
      '300123': '530148', // TVT-ajokortti
      '55055': '55328', // Epäorgaaninen kemia
      '53726': 'FYS2013', // Fysiikan matemaattiset menetelmät IIb
      '53725': 'FYS2012', // Fysiikan matemaattiset menetelmät IIa
      '200230T': '200230_WT', // Kansainvälisen yksityisoikeuden ja oikeusvertailun kirjatentti
      '3750501': '90093', // Immunologia
      '3750502': '90096', // Virologia
      '20012': '20012_WasaT', // Kauppaoikeus
      '530289': 'FYS2077', // Kiinteän maan geofysiikan peruskurssi
      '200250': '200250_WasaT', // Prosessi- ja insolvenssioikeus: Yleinen prosessioikeus
      '55077': '55306', // Kemian historia
      '30300': '50031', // Yliopiston hallinto- ja opiskelijajärjestötoiminta
      '530217': '53112', // Fysiikan historia ja filosofia
      '80144': 'ME-004', // Tilastotiede I: Tilastollisen ajattelun perusteet
      '99299': '992993', // Japanin alkeiskurssi 1
      '200251': '200251_WasaT', // Prosessi- ja insolvenssioikeus: Insolvenssioikeus
      '200203C': '200203C_WT', // Velvoiteoikeus: Vakuutus- ja vahingonkorvausoikeus
      '57118': 'MAT11005', // Integraalilaskenta
      '57119': 'MAT21002', // Sarjat
      '57152': 'MAT21005', // Topologia IA
      '99501Hum': '99501Mat-lu', // English Academic & Professional Skills: Reading, Writing & Spoken Communication (CEFR B2)*
      '50099': '590190', // Ryhmänohjauskoulutus ja tuutorointi
      '530283': 'FYS1003', // Sähkömagnetismi
      '53704': 'FYS1010', // Matemaattiset apuneuvot I
      'KK-ENMALU': 'KK-ENVALT', // Academic and Professional Communication in English 1 & 2 (CEFR B2)
      'KK-RUMALU': 'KK-RUMAME', // Toisen kotimaisen kielen suullinen taito, ruotsi (CEFR B1)
      '53705': 'FYS1011', // Matemaattiset apuneuvot II
      '530148': '80088', // TVT-ajokortti
      '50000': '57084', // Muualla suoritettuja opintoja
      '68153Kem': '68153Mat', // Ainedid. 1 ryhmät
      '530286': 'FYS2001', // Termofysiikan perusteet
      'KK-ENLAAK1': 'KK-ENMALU1', // Academic and Professional Communication in English 1 (CEFR B2)
      '20016': '20016T', // Ympäristöoikeus
      '20014': '20014T', // Perhe- ja jäämistöoikeus
      '530000': 'FYS2004', // Suhteellisuusteorian perusteet
      '52073': 'BIO-104', // Ekologian perusteet
      '535026': 'FYS2031', // Meteorologian ja säähavainnonteon perusteet
      'MAT20001': 'ON-330', // Kypsyysnäyte
      '99291Mat-lu': '99291Oik', // Toisen kotimaisen kielen suullinen ja kirjallinen taito, ruotsi*
      'KK-ENLAAK2': 'KK-ENMALU2', // Academic and Professional Communication in English 2 (CEFR B2)
      '53399': 'FYS2085', // Tieteellinen laskenta II
      '590367': 'PROV-907', // Lääkemarkkinointi, kirjatentti
      '732290': '790Y330', // Kandidaatintutkielmaseminaari
      '55075': 'KEK225', // Radiokemia
      '68166': '68207', // Tutkielmaseminaari
      
    }

    const mappedCode = codeMap[code]
    return mappedCode ? mappedCode : code
  }

  const toCourse = ({ grade, credits, courseinstance }) => {
    const code = oldToNew(unifyOpenUniversity(`${courseinstance.course_code}`))
    return {
      course: {
        code,
        name: courseinstance.course.name
      },
      date: courseinstance.coursedate,
      passed: Credit.passed({ grade }),
      grade,
      credits
    }
  }

  const byDate = (a, b) => {
    return moment(a.courseinstance.coursedate).isSameOrBefore(b.courseinstance.coursedate) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }

  return {
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount,
    courses: credits.sort(byDate).map(toCourse),
    tags: []
  }
}

const bySearchTerm = async (term) => {
  try {
    const result = await byAbreviatedNameOrStudentNumber(`%${term}%`)
    return result.map(formatStudent)
  } catch (e) {
    return {
      error: e
    }
  }
}

const withId = async (id) => {
  try {
    const result = await byId(id)
    return formatStudent(result)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

module.exports = {
  withId, bySearchTerm, formatStudent, createStudent, byId, updateStudent, formatStudentUnifyCodes
}