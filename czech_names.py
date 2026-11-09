"""Czech names of the monthly challenges and badges.

names.cs.json maps a challenge key to a Czech name. Names that contain the month use placeholders, so one entry
serves every month of the year; the month is the one in the key of the challenge (e.g. ..._2026_11 = November):

    {mesic}      nominative            říjen          "Aktivní {mesic}"                 -> Aktivní říjen
    {v_mesici}   "in the month"        v říjnu        "Kroky {v_mesici}"                -> Kroky v říjnu
    {Mesicni}    adjective (feminine)  Říjnová        "{Mesicni} víkendová procházka"   -> Říjnová víkendová procházka
    {mesicne}    adjective (plural)    říjnové        "Medaile za {mesicne} kroky"      -> Medaile za říjnové kroky
    ({Mesic}, {mesicni} and {Mesicne} are the same forms with / without a capital first letter)
"""

MONTHS = {  # month: (nominative, "in the month", adjective feminine, adjective plural)
    1: ("leden", "v lednu", "lednová", "lednové"), 2: ("únor", "v únoru", "únorová", "únorové"),
    3: ("březen", "v březnu", "březnová", "březnové"), 4: ("duben", "v dubnu", "dubnová", "dubnové"),
    5: ("květen", "v květnu", "květnová", "květnové"), 6: ("červen", "v červnu", "červnová", "červnové"),
    7: ("červenec", "v červenci", "červencová", "červencové"), 8: ("srpen", "v srpnu", "srpnová", "srpnové"),
    9: ("září", "v září", "zářijová", "zářijové"), 10: ("říjen", "v říjnu", "říjnová", "říjnové"),
    11: ("listopad", "v listopadu", "listopadová", "listopadové"), 12: ("prosinec", "v prosinci", "prosincová", "prosincové"),
}


def localize(template, month):
    """Fills the month into a Czech name template. Returns None when there is no template, or when it needs a
    month that is unknown (the caller then keeps the English name)."""
    if not template:
        return None
    if "{" not in template:
        return template
    if month not in MONTHS:
        return None
    nom, loc, fem, plu = MONTHS[month]
    forms = {"mesic": nom, "Mesic": nom.capitalize(), "v_mesici": loc, "mesicni": fem, "Mesicni": fem.capitalize(),
             "mesicne": plu, "Mesicne": plu.capitalize()}
    try:
        return template.format(**forms)
    except (KeyError, IndexError, ValueError):
        return None
