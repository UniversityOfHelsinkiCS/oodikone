class NavigationPanel < Superbara::PCOM

  def open()
    find("button", class:"navigationbuttonopen").click
  end
  def close()
    find("button", class:"navigationbuttonclose").click
  end
  def navigate(destination=/Course/)
    panel = find("div", class:"navigationpanel")
    panel = find("button", text:destination).click
  end
end