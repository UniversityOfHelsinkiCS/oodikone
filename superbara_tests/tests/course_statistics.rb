visit "localhost:8081"
require_relative "./components/query_course_statistics"

course_statistics = CourseQuery.new
start_year = rand(2011...Time.now.year)
end_year = rand(start_year + 1 ... Time.now.year+1)

course_statistics.query(start_year.to_s, end_year.to_s, "Tietorakenteet ja algoritmit")

wait do
  barchart = find("div", class:"recharts-wrapper")
  bar = barchart.all("path", class:"recharts-rectangle").random
  bar.hover
end

wait do
  has_text? "all"
  has_text? "passed"
  has_text? "failed"
end

click_text "switch to student level view"

wait do 
  barchart = find("div", class:"recharts-wrapper")
  bar = barchart.all("path", class:"recharts-rectangle").random
  bar.hover
end

wait do
  has_text? "all"
  has_text? "students that passed on their first try"
  has_text? "students that passed re-examination"
  has_text? "students that failed on their first try"
  has_text? "students that failed their re-examination"
end

click_button "Remove"