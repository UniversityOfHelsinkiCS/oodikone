class Filter < Superbara::PCOM

  def initialize(filter_name = "Show only students with credits at least")
    @filter = find("label", text:filter_name).find(:xpath, '../..')
  end

  def fill(has_input = false, fill_value="30")

    if has_input
      @filter.find("input").click
      type fill_value
    else
      @filter.find("label", text: fill_value).click
    end
  end

  def set_filter()
    @filter.find(:xpath, '../..').click_button("set filter")
  end
end