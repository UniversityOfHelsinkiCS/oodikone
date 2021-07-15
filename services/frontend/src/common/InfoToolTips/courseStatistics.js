export default {
  0: {
    Attempts: `
      Table - Attempts

      Taulukko näyttää suorituskerrat lukuvuositasolla.
      Samalla opiskelijalla voi olla useampia suorituskertoja.
      Hyväksytyt suoritukset sisältävät arvosanat 1-5 sekä arvosanan Hyv.
      Hylätyt suoritukset sisältävät arvosanat Hyl. ja 0, sekä suoritukset, joille opettaja on antanut merkinnän
      "Luop" (Luopunut suorituksesta) tai "Eisa" (Ei saapunut tenttiin).

      Klikkaamalla painikkeesta "Grade distribution", saa näkyviin suorituskertojen arvosanajakauman. 
      Arvosanajakaumaa katsoessasi voit muuttaa luvut prosenteiksi, klikkaamalla painiketta "Relative".
      Mahdollinen sarake "Other passed" sisältää sekä arvosanan "Hyv." saaneet että kurssin hyväksilukeneet.
    `,
    Students: `
      Table - Students

      Taulukko näyttää yksittäiset opiskelijat, jotka ovat kurssia suorittaneet.
      Jokainen opiskelija on jaoteltu luokkiin: "läpäissyt ensiyrittämällä", "läpäissyt lopulta" tai "ei koskaan läpäissyt kurssia".
      Lukuvuosi määräytyy sen lukuvuoden perusteella, jolloin kyseinen opiskelija on ensimmäisen kerran kurssia yrittänyt. 

      Esimerkiksi opiskelija, joka on yrittänyt kurssia syksyllä 2017 ja saanut silloin hylätyn arvosanan ja läpäissyt kurssin
      myöhemmin keväällä 2019, tulisi merkityksi lukuvuodelle 2017-2018 sarakkeeseen "passed eventually".  
      
      Total-rivillä näkyy niiden opiskelijoiden kokonaismäärä, jotka ovat kurssista joskus arvosanan saaneet.
    `,
  },
  1: {
    Attempts: `
      Pass rate chart - Attempts

      Graafi näyttää suorituskerrat lukuvuositasolla jaoteltuina hyväksyttyihin ja hylättyihin suorituksiin.
      Hyväksytyt suoritukset sisältävät arvosanat 1-5 sekä arvosanan Hyv.
      Hylätyt suoritukset sisältävät arvosanat Hyl. ja 0, sekä suoritukset, joille opettaja on antanut merkinnän
      "Luop" (Luopunut suorituksesta) tai "Eisa" (Ei saapunut tenttiin).
    `,
    Students: `
      Pass rate chart - Students

      Graafi näyttää yksittäiset opiskelijat, jotka ovat kurssia suorittaneet.
      Jokainen opiskelija on jaoteltu luokkiin: "läpäissyt ensiyrittämällä", "läpäissyt lopulta" tai "ei koskaan läpäissyt kurssia".
      Lukuvuosi määräytyy sen lukuvuoden perusteella, jolloin kyseinen opiskelija on ensimmäisen kerran kurssia yrittänyt.

      Esimerkiksi opiskelija, joka on yrittänyt kurssia syksyllä 2017 ja saanut silloin hylätyn arvosanan ja läpäissyt kurssin
      myöhemmin keväällä 2019, tulisi merkityksi lukuvuodelle 2017-2018 pylvääseen "passed eventually".        
    `,
  },
  2: {
    Attempts: `
      Grade distribution
  
      Graafi näyttää suorituskertojen arvosanajakauman eri lukuvuosille. Mahdollinen kategoria
      "Other passed" sisältää sekä arvosanan "Hyv." että kurssin hyväksiluvut.
    `,
    Students: `
      Grade distribution

      Graafi näyttää suorituskertojen arvosanajakauman eri lukuvuosille. Mahdollinen kategoria
      "Other passed" sisältää sekä arvosanan "Hyv." että kurssin hyväksiluvut.
    `,
  },
}
