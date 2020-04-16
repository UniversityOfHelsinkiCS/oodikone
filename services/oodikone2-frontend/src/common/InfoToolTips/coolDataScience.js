export default {
  protoC: `Graafi ottaa huomioon vain opiskelijat joiden opinto-oikeus on alkanut 1.8 joka vuodelta vuoden 2017 jälkeen. 
    Opiskelijat jotka ovat vaihtaneet ohjelmaa tiedekunnan sisällä suodatetaan pois.
    Opiskelijoiden tavoiteaika lasketaan seuraavasti: 3 vuoden tahdissa olevat opiskelijat 60op * ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet, 
    4 vuoden tahdissa olevat opiskelijat 45op * ((tämä päivä - aloituspäivä) / 365) ≤ opiskelijan opintopisteet,
    peruutettu jos optinto-oikeus merkattu perutuksi,
    ei tahdissa (kaikki opiskelijat - 3v - 4v - peruutettu).
    Vakiona opintopisteet ennen opinto-oikeutta suodatetaan pois. Include old attainments laskee mukaan opiskelijan ennen opinto-oikeuden alkua saadut opintopisteet.
    Vakiona opiskelijat jotka eivät ole ilmoittautunut millekkään lukuvuodelle (läsnä tai poissa olevaksi) on sisällytetty laskuihin. Include only .... suodattaa pois opiskelijat jotka eivät ole ollenkaan ilmoittautunut`,
  protoC2: 'lorem ipsum'
}
