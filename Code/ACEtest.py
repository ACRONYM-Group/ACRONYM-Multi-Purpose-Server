import ACELib

conn = ACELib.Connection()

conn.initConnection()

print(conn.key)

conn.sendEncryptedDict({"CMDType": "setData",
                        "name": "name",
                        "value": "value"}, "__CMD__")
