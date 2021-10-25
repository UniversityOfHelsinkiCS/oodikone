export default {
  protoC: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
  Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
    
  **3 vuoden tahdissa** olevat opiskelijat 60op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
  
  **4 vuoden tahdissa** olevat opiskelijat 45op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,
  
  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - peruutettu).

  **peruutettu**, jos opinto-oikeus merkattu perutuksi
    
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
  
  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - peruutettu).

  **peruutettu**, jos opinto-oikeus merkattu perutuksi
  
  **Include only at least once enrolled students** suodattaa pois opiskelijat,
  jotka eivät ole ollenkaan ilmoittautunut. Vakiona opiskelijat, jotka eivät ole ilmoittautunut millekkään lukuvuodelle (läsnä tai poissa olevaksi) on sisällytetty laskuihin.
  
  **Include attainments attained before the studyright start** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
  Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois. 
  `,
  protoG: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
  Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
  
  **3 vuoden tahdissa** olevat opiskelijat 60op × ((tarkastuspäivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
  
  **4 vuoden tahdissa** olevat opiskelijat 45op × ((tarkastuspäivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,

  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - peruutettu). 
  
  **Tarkastuspäivät** ovat 31.7, 30.11 ja 1.4 joka vuodelle.

  **peruutettu**, jos opinto-oikeus merkattu perutuksi

  **Include attainments attained before the studyright start** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
  Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois.
  `,
  status: `
  Tilannekuva näyttää "reaaliaikaisesti" eri tiedekuntien, ohjelmien ja kurssien tuottamat opintopisteet nykyisen lukuvuoden aikana 
  verrattuna edelliseen lukuvuoteen. 
  
  Nuoli kuvaa muutosta, paljonko opintopisteitä on kertynyt tämänhetkisen lukuvuoden alusta tarkastelupäivään mennessä 
  suhteessa edellisen lukuvuoden alusta vastaavaan tarkastelupäivään viime vuonna. Vain suoritetut ja hyväksiluetut opintopisteet huomioidaan.
  
  Tilannekuvassa voi porautua kortteja klikkaamalla ensin ohjelmatasolle ja edelleen kurssitasolle. Asetukset-nappi avaa valikon, josta voi valita missä muodossa data halutaan nähdä. 
  
  Valinta "Näytä edelliset vuodet" näyttää vuosittaisen opintopiste-kertymän tähän päivään
  mennessä vuonna X sekä koko lukuvuoden X opintopisteet muodossa "kerääntymä vuonna X / koko lukuvuoden X opintopisteet".
  
  Valinta "Näytä kalenterivuosittain" laskee kertymän kalenterivuoden alusta,
  eikä lukuvuoden alusta.

  Valinta "Näytä suhteutettuna opiskelijoiden määrään" näyttää opintopistemäärät suhteutettuna kyseisen ajanjakson aikana kyseisen organisaation alaisuuteen kuuluvia kursseja suorittaineiden opiskelijoiden määrään. Tämä luku sisältää myös avoimen yliopiston opiskelijat.
  
  Kohdasta "Näytä päivänä" voi valita tarkastelupäivän, joka on oletusarvoisesti tämänhetkinen päivä.
  
  Avoimen yliopiston suorituksia ei vielä lasketa mukaan.
  `,
  statusGraduated: `
  Tilannekuva näyttää "reaaliaikaisesti" eri tiedekuntien ja ohjelmien valmistumiset nykyisen lukuvuoden aikana 
  verrattuna edelliseen lukuvuoteen. 
  
  Nuoli kuvaa muutosta, paljonko valmistuneita on kertynyt tämänhetkisen lukuvuoden alusta tarkastelupäivään mennessä 
  suhteessa edellisen lukuvuoden alusta vastaavaan tarkastelupäivään viime vuonna.
  
  Tilannekuvassa voi porautua kortteja klikkaamalla ohjelmatasolle. 
  Asetukset-nappi avaa valikon, josta voi valita missä muodossa data halutaan nähdä. 
  
  Valinta "Näytä edelliset vuodet" näyttää vuosittaisen valmistumiskertymän tähän päivään mennessä vuonna X sekä koko lukuvuoden X valmistuneet muodossa "kerääntymä vuonna X / koko lukuvuoden X valmistuneet". 
  
  Valinta "Näytä vuositasolla" laskee kertymän kalenterivuoden alusta, eikä lukuvuoden alusta.
  
  Kohdasta "Näytä päivänä" voi valita tarkastelupäivän, joka on oletusarvoisesti tämänhetkinen päivä.
  `,
}
