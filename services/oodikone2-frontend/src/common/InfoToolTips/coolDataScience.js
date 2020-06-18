export default {
  protoC: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
    Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
    <br> <br>
    Opiskelijoiden tavoiteaika lasketaan seuraavasti: **3 vuoden tahdissa** olevat opiskelijat 60op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
    **4 vuoden tahdissa** olevat opiskelijat 45op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,
    **peruutettu** jos optinto-oikeus merkattu perutuksi,
    **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - peruutettu).
    <br> <br>
    Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois. **Include old attainments** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
    <br> <br>
    Vakiona opiskelijat jotka eivät ole ilmoittautunut millekkään lukuvuodelle (läsnä tai poissa olevaksi) on sisällytetty laskuihin. **Include only at least once enrolled students** 
    suodattaa pois opiskelijat jotka eivät ole ollenkaan ilmoittautunut
    <br> <br>
    Graafissa pystyy pisteitä klikkaamalla porautumaan ensin ohjelmatasolle ja edelleen opintosuuntatasolle.
    `,
  protoC2: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
  Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
  <br> <br>
  Opiskelijoiden tavoiteaika lasketaan seuraavasti: **3 vuoden tahdissa** olevat opiskelijat 60op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
  **4 vuoden tahdissa** olevat opiskelijat 45op × ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,
  **peruutettu** jos optinto-oikeus merkattu perutuksi,
  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - peruutettu).
  <br> <br>
  Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois. **Include old attainments** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
  <br> <br>
  Vakiona opiskelijat jotka eivät ole ilmoittautunut millekkään lukuvuodelle (läsnä tai poissa olevaksi) on sisällytetty laskuihin. **Include only at least once enrolled students** 
  suodattaa pois opiskelijat jotka eivät ole ollenkaan ilmoittautunut
  <br> <br>
  Graafissa pystyy palkkeja klikkaamalla porautumaan kunkin tiedekunnan ohjelmatasolle. Painamalla ohjelmatasolla jotakin palkkia uudelleen pääsee takaisin tiedekuntatasolle.
  `,
  protoG: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
  Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
  <br> <br>
  Opiskelijoiden tavoiteaika lasketaan seuraavasti: **3 vuoden tahdissa** olevat opiskelijat 60op × ((tarkastuspäivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
  **4 vuoden tahdissa** olevat opiskelijat 45op × ((tarkastuspäivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,
  **peruutettu** jos optinto-oikeus merkattu perutuksi,
  **ei tahdissa** = (kaikki opiskelijat - 3v - 4v - peruutettu). **Tarkastuspäivät** ovat 31.7, 30.11 ja 1.4 joka vuodelle.
  <br> <br>
  Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois. **Include old attainments** laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.`,
  status: `
  **Tilannekuva** näyttää "reaaliaikaisesti" eri tiedekuntien, ohjelmien ja kurssien tuottamat opintopisteet nykyisen lukuvuoden aikana 
  verrattuna edelliseen lukuvuoteen. **Nuoli** kuvaa muutosta, paljonko opintopisteitä on kertynyt tämänhetkisen lukuvuoden alusta tarkastelupäivään mennessä 
  suhteessa edellisen lukuvuoden alusta vastaavaan tarkastelupäivään viime vuonna. Vain suoritetut ja hyväksiluetut opintopisteet huomioidaan.
  <br> <br>
  Tilannekuvassa voi **porautua** kortteja klikkaamalla ensin ohjelmatasolle ja edelleen kurssitasolle. **Asetukset**-nappi avaa valikon, josta voi valita missä muodossa data halutaan nähdä. Valinta **Näytä edelliset vuodet** näyttää
  vuosittaisen opintopiste-kertymän tähän päivään mennessä vuonna X sekä koko lukuvuoden X opintopisteet muodossa "\`kerääntymä vuonna X / koko lukuvuoden X opintopisteet\`". Valinta **Näytä vuositasolla** laskee kertymän kalenterivuoden alusta,
  eikä lukuvuoden alusta. Kohdasta **Näytä päivänä** voi valita tarkastelupäivän, joka on oletusarvoisesti tämänhetkinen päivä.
  <br> <br>
  Avoimen yliopiston suorituksia ei vielä lasketa mukaan.
  `,
  statusGraduated: `
  **Tilannekuva** näyttää "reaaliaikaisesti" eri tiedekuntien ja ohjelmien valmistumiset nykyisen lukuvuoden aikana 
  verrattuna edelliseen lukuvuoteen. **Nuoli** kuvaa muutosta, paljonko valmistuneita on kertynyt tämänhetkisen lukuvuoden alusta tarkastelupäivään mennessä 
  suhteessa edellisen lukuvuoden alusta vastaavaan tarkastelupäivään viime vuonna.
  <br> <br>
  Tilannekuvassa voi **porautua** kortteja klikkaamalla ohjelmatasolle. **Asetukset**-nappi avaa valikon, josta voi valita missä muodossa data halutaan nähdä. Valinta **Näytä edelliset vuodet** näyttää
  vuosittaisen valmistumis-kertymän tähän päivään mennessä vuonna X sekä koko lukuvuoden X valmistuneet muodossa "\`kerääntymä vuonna X / koko lukuvuoden X valmistuneet\`". Valinta **Näytä vuositasolla** 
  laskee kertymän kalenterivuoden alusta,
  eikä lukuvuoden alusta. Kohdasta **Näytä päivänä** voi valita tarkastelupäivän, joka on oletusarvoisesti tämänhetkinen päivä.
  <br> <br>
  `
}
