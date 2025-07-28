size_tag = soup.find("div", class_="tw-text-300 tw-font-semibold")
    size = size_tag.get_text(strip=True) if size_tag else "N/A"