class PopulationQuery < Superbara::PCOM

  def initialize()
    wait do
      find "a", text: "Population statistics"	     
    end.click
  end

  def query(enrollment_year="2017", degree="Tietojenkäsittelytieteen kandiohjelma", programme="Tietojenkäsittelytieteen kandiohjelma")
    value = "2017"
    enrollment_input = nil
    wait 15 do
        enrollment_input = find("label", text:"Enrollment year").find(:xpath, "..").find("input")
        value = enrollment_input.value
    end

    if value != enrollment_year
      enrollment_input.click
      4.times do
        type :backspace
      end
      type enrollment_year
    end

    
    find("label", text:"Degree").find(:xpath, "..").click
    
    type degree
    find("span", text:/#{Regexp.escape(degree)}$/).click

    find("label", text:"Study programme").find(:xpath, "..").click
    
    type programme
    find("span", text:programme).click
    
    click_button "See population"

    wait 60 do
      has_text? "Credit accumulation"
    end
  end
end