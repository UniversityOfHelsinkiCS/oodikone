run '../common'
focus

visit $basepath
wait do
    has_text? "Population statistics"
end
click_text "Population statistics"

