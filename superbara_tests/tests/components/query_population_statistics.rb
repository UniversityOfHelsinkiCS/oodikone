class PopulationQuery < Superbara::PCOM

  def initialize()
    wait do
      find "a", text: "Population statistics"	     
    end.click
  end

  def query(enrollment_year="2017", studyright_query="Tietojenkäsittelytieteen kandiohjelma")
    wait 15 do
        find("label", text:"Enrollment year").find(:xpath, "..").find("input").click
    end
    4.times do
      type :backspace
    end
    
    type enrollment_year
    
    find("label", text:"Study rights").find(:xpath, "..").click
    
    type studyright_query
    click_text studyright_query
    click_button "See population"
    
    wait 60 do
      has_text? "Credit accumulation"
    end
  end
end