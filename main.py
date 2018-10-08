import pandas as pd  

tkt = pd.read_csv("TKT_HUL.csv", header=0)
yet = pd.read_csv("YET_HUL.csv", header=0)

asd = pd.concat([tkt, yet])

asd["Opisnro"].to_csv("opisnrot.csv", index=False)