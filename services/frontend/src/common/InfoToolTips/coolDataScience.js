export default {
  protoC: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
  Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
    
  **3 vuoden tahdissa** olevat opiskelijat 60op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
  
  **4 vuoden tahdissa** olevat opiskelijat 45op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,
  
  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - passiivinen).

  **passiivinen**, jos opinto-oikeus on päättynyt tai opiskelija on laiminlyönyt ilmoittautumisen tälle lukukaudelle, eikä opiskelija ole vielä valmistunut. 
    
  **Include only at least once enrolled students** suodattaa pois opiskelijat jotka eivät ole ollenkaan ilmoittautunut. 
  Vakiona opiskelijat jotka eivät ole ilmoittautunut millekkään lukuvuodelle (läsnä tai poissa olevaksi)
  on sisällytetty laskuihin.  
  
  **Include attainments attained before the studyright start** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
  Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois.
  `,
  protoC2: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
  Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
  
  **3 vuoden tahdissa** olevat opiskelijat 60op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
  
  **4 vuoden tahdissa** olevat opiskelijat 45op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,
  
  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - passiivinen).

  **passiivinen**, jos opinto-oikeus on päättynyt tai opiskelija on laiminlyönyt ilmoittautumisen tälle lukukaudelle, eikä opiskelija ole vielä valmistunut. 
  
  **Include only at least once enrolled students** suodattaa pois opiskelijat,
  jotka eivät ole ollenkaan ilmoittautunut. Vakiona opiskelijat, jotka eivät ole ilmoittautunut millekkään lukuvuodelle (läsnä tai poissa olevaksi) on sisällytetty laskuihin.
  
  **Include attainments attained before the studyright start** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
  Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois. 
  `,
  protoG: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
  Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
  
  **3 vuoden tahdissa** olevat opiskelijat 60op × ((tarkastuspäivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
  
  **4 vuoden tahdissa** olevat opiskelijat 45op × ((tarkastuspäivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,

  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - passiivinen). 
  
  **Tarkastuspäivät** ovat 31.7, 30.11 ja 1.4 joka vuodelle.

  **passiivinen**, jos opinto-oikeus on päättynyt tai opiskelija on laiminlyönyt ilmoittautumisen tälle lukukaudelle, eikä opiskelija ole vielä valmistunut. 

  **Include attainments attained before the studyright start** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
  Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois.
  `,
  status: {
    general: `
      Tilannekuva näyttää "reaaliaikaisesti" eri tiedekuntien, ohjelmien ja kurssien tuottamat opintopisteet nykyisen lukuvuoden aikana 
      verrattuna edelliseen lukuvuoteen. 
      
      Nuoli kuvaa muutosta, paljonko opintopisteitä on kertynyt tämänhetkisen lukuvuoden alusta tarkastelupäivään mennessä 
      suhteessa edellisen lukuvuoden alusta vastaavaan tarkastelupäivään viime vuonna. Vain suoritetut ja hyväksiluetut opintopisteet huomioidaan.
      
      Tilannekuvassa voi porautua kortteja klikkaamalla ensin ohjelmatasolle ja edelleen kurssitasolle. Asetukset-nappi avaa valikon, josta voi valita missä muodossa data halutaan nähdä. Mahdolliset valinnat ovat selitettyinä alla.
    `,
    settings: {
      showByYear: {
        label: 'Näytä kalenterivuosittain',
        short: 'Näytä tilastot kalenterivuosittain lukuvuosien sijasta.',
        long: `
          Kun tämä valinta on käytössä, vuosittaiset ajanjaksot lasketaan kalenterivuoden alusta sen loppuun.
          Muulloin vuosittaiset ajanjaksot lasketaan lukukauden alusta seuraavan lukukauden alkuun.
        `,
      },
      showYearlyValues: {
        label: 'Näytä edelliset vuodet',
        short: 'Näytä tilastot vuosittain, alkaen vuodesta 2017.',
        long: `
          Näyttää tilastot vuodesta 2017 eteenpäin.
          Jokaiselta vuodelta näytetään kaksi tilastoa: ajanjakson kokonaistilasto ja ns. tähän mennessä "*kertynyt*" tilasto.
          Kokonaistilasto vastaa nimensä mukaisesti koko ajanjaksoa, kun taas *kertynyt* tilasto kattaa ajanjakson vuoden 
          tai lukuvuoden alusta "Näytä päivänä"-valintaa vastaavaan päivämäärään tuona vuotena. Luvut näytetään muodossa *<kerynyt>*/*<kokonais>*.
          Kuluvalta vuodelta näytetään ainoastaan kertynyt tilasto.
        `,
      },
      showRelativeValues: {
        label: 'Näytä suhteutettuna opiskelijoiden määrään',
        short:
          'Näyttää tilastot suhteutettuna opiskelijoiden määrään kyseisellä aikavälillä ja kyseisessä organisaatiossa.',
        long: `
          Näyttää tilastot suhteutettuna opiskelijoiden määrään kyseisellä aikavälillä ja kyseisessä organisaatiossa.
          Opiskelijoiden määrä perustuu ajanjaksolla kyseisen organisaation alaisista kursseista suoritusmerkintöjä saaneiden opiskelijoiden määrään.
          Luku siis sisältää muutkin kuin kyseiseen ohjelman tai osaston opinto-oikeuden omaavat opiskelijat.
        `,
      },
      showCountingFrom: {
        label: 'Valitse päivämäärä',
        short: 'Valitse päivä johon asti kertyneet tilastot näytetään.',
        long: `
          Tämä valinta määrittää päivämäärän, jota käyttäen kertyneet tilastot lasketaan.
          Esimerkiksi "Näytä kalenterivuosittain" valinnan ollessa pois päältä,
          lasketaan kertyneet tilastot (vrt. lukuvuosien kokonaistilastot) kunkin lukuvuoden alusta
          tätä päivämäärää vastaavaan päivään kyseisenä lukuvuonna.
        `,
      },
      showStudentCounts: {
        label: 'Näytä kurssien opiskelijamäärät',
        short: 'Näyttää suoritettujen opintopisteiden sijasta opiskelijoiden määrät kurssitason näkymässä.',
        long: `
          Oletuksena kurssitason näkymässä näytetään organisaatio- ja ohjelmatason näkymien tapaan suoritettujen opintopisteiden
          kokonaismäärä. Kun tämä valinta on käytössä, tämän sijasta näytettävät luvut vastaavat kurssin suorittaneiden 
          *yksilöityjen* opiskelijoiden määrää. Kukin opiskelija lasketaan siis vain kerran tähän tilastoon.
        `,
      },
    },
  },
  statusGraduated: {
    general: `
      Tilannekuva näyttää "reaaliaikaisesti" eri tiedekuntien ja ohjelmien valmistumiset nykyisen lukuvuoden aikana 
      verrattuna edelliseen lukuvuoteen. 
      
      Nuoli kuvaa muutosta, paljonko valmistuneita on kertynyt tämänhetkisen lukuvuoden alusta tarkastelupäivään mennessä 
      suhteessa edellisen lukuvuoden alusta vastaavaan tarkastelupäivään viime vuonna.
      
      Tilannekuvassa voi porautua kortteja klikkaamalla ohjelmatasolle. 
      Asetukset-nappi avaa valikon, josta voi valita missä muodossa data halutaan nähdä. 
    `,
    settings: {
      showByYear: {
        label: 'Näytä kalenterivuosittain',
        short: 'Näytä tilastot kalenterivuosittain lukuvuosien sijasta.',
        long: `
          Kun tämä valinta on käytössä, vuosittaiset ajanjaksot lasketaan kalenterivuoden alusta sen loppuun.
          Muulloin vuosittaiset ajanjaksot lasketaan lukukauden alusta seuraavan lukukauden alkuun.
        `,
      },

      showYearlyValues: {
        label: 'Näytä edelliset vuodet',
        short: 'Näytä tilastot vuosittain, alkaen vuodesta 2017.',
        long: `
          Näyttää vuosittaisen valmistumiskertymän tähän päivään mennessä vuonna X
          sekä koko lukuvuoden X valmistuneet muodossa *"kerääntymä vuonna X / koko
          lukuvuoden X valmistuneet"*.
        `,
      },

      showCountingFrom: {
        label: 'Näytä päivänä',
        short: 'Valitse päivä johon asti kertyneet tilastot näytetään.',
        long: `
          Tämä valinta määrittää päivämäärän, jota käyttäen kertyneet tilastot lasketaan.
          Esimerkiksi "Näytä kalenterivuosittain" valinnan ollessa pois päältä,
          lasketaan kertyneet tilastot (vrt. lukuvuosien kokonaistilastot) kunkin lukuvuoden alusta
          tätä päivämäärää vastaavaan päivään kyseisenä lukuvuonna.
        `,
      },
    },
  },
}
