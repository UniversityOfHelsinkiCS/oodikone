wait 15 do
    find("label", text:"Enrollment year").find(:xpath, "..").find("input").click
end
2.times do
    type :backspace
end

type "15"

find("label", text:"Study rights").find(:xpath, "..").click

type "Tietojenkäsittelytieteen"
click_text "Tietojenkäsittelytieteen koulutusohjelma"
click_button "See population"

wait 60 do
    has_text? "Credit accumulation"
end
