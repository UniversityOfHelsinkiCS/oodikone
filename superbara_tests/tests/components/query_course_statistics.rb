class CourseQuery < Superbara::PCOM

  def initialize()
    wait do
      find "a", text: "Course statistics"	     
    end.click
  end

  def query(start_year="2017", end_year="2018", course_name="Tietorakenteet ja algoritmit")
    start_value = ""
    end_value = ""
    start_year_input = nil
    end_year_input = nil
    
    wait 15 do
        start_year_input = find("label", text:"Start year").find(:xpath, "..").find("input")
        start_value = start_year_input.value
        end_year_input = find("label", text:"End year").find(:xpath, "..").find("input")
        end_value = end_year_input.value
    end

    if start_value != start_year
      start_year_input.click
      4.times do
        type :backspace
      end
      type start_year
    end

    if end_value != end_year
      end_year_input.click
      4.times do
        type :backspace
      end
      type end_year
    end

    find("input", class: "prompt").click
    type course_name
    click_text course_name

    wait 60 do
      has_text? "switch to student level view"
      has_text? "Time"
      has_text? "Passed Students"
      has_text? "Failed Students"
    end
  end
  
end