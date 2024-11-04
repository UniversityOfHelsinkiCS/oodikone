export const courseStatisticsToolTips = {
  tables: {
    ATTEMPTS: `
      **Table - Attempts**

      Taulukko näyttää suorituskerrat lukuvuositasolla. Samalla opiskelijalla voi olla useampia suorituskertoja.
      Hyväksytyt suoritukset sisältävät arvosanat 1-5 sekä arvosanan Hyv. (sarakkeessa Other passed).
      Hylätyt suoritukset sisältävät arvosanat Hyl. ja 0, sekä suoritukset, joille opettaja on antanut merkinnän
      "Luop" (Luopunut suorituksesta) tai "Eisa" (Ei saapunut tenttiin).

      Käyttämällä vipua "Show grades" saa näkyviin suorituskertojen arvosanajakauman.
      Käyttämällä vipua "Separate semesters" suoritukset jaetaan kevät- ja syyslukukausien mukaan.
    `,
    STUDENTS: `
      **Table - Students**

      Taulukko näyttää yksittäiset opiskelijat, jotka ovat kurssia suorittaneet.
      Lukuvuosi määräytyy sen lukuvuoden perusteella, jolloin kyseinen opiskelija on ensimmäisen kerran kurssia yrittänyt.

      Esimerkiksi opiskelija, joka on yrittänyt kurssia syksyllä 2017 ja saanut silloin hylätyn arvosanan ja läpäissyt kurssin
      myöhemmin keväällä 2019, tulisi merkityksi lukuvuodelle 2017-2018.

      Total-rivillä näkyy niiden opiskelijoiden kokonaismäärä, jotka ovat saaneet kurssista joskus arvosanan.
    `,
  },
  passRate: {
    ATTEMPTS: `
      **Pass rate - Attempts**

      Graafi näyttää suorituskerrat lukuvuositasolla jaoteltuina hyväksyttyihin ja hylättyihin suorituksiin.
      Hyväksytyt suoritukset sisältävät arvosanat 1-5 sekä arvosanan Hyv.
      Hylätyt suoritukset sisältävät arvosanat Hyl. ja 0, sekä suoritukset, joille opettaja on antanut merkinnän
      "Luop" (Luopunut suorituksesta) tai "Eisa" (Ei saapunut tenttiin). "Enrolled, no grade" sisältää opiskelijat,
      jotka ovat ilmoittautuneet kurssille, mutta eivät ole saaneet arvosanaa.

      Käyttämällä vipua "Show relative" saa näkyviin suorituskertojen suhteellisen määrän.
    `,
    STUDENTS: `
      **Pass rate - Students**

      Graafi näyttää yksittäiset opiskelijat, jotka ovat kurssia suorittaneet.
      Lukuvuosi määräytyy sen lukuvuoden perusteella, jolloin kyseinen opiskelija on ensimmäisen kerran kurssia yrittänyt.

      Käyttämällä vipua "Show relative" saa näkyviin opiskelijoiden suhteellisen määrän.
    `,
  },
  gradeDistribution: `
    **Grade distribution**

    Graafi näyttää suorituskertojen arvosanajakauman eri lukuvuosille. Arvosanaksi 0 lasketaan sekä hylätyt (Failed) arvosanat,
    että kurssille ilmoittautuneet opiskelijat, joilla ei ole arvosanaa kurssista (Enrolled, no grade).
  `,
}
