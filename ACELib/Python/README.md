# AMPS Client Environment Library

## ACELib Examples

<b>Basic ACELib Setup</b>

There are two steps that must be taken before effective use of ACELib can be
made, these two steps are generating the connection, and connecting to the
server. This is done using the `ACELib.Connection` class, and the
`ACELib.Connection.initConnection()` function.

These two operations are performed in the following snippet:

```python
import ACELib

conn = ACELib.Connection()

conn.initConnection()
```

<b>Login</b>

Before any useful action can be made in communicating with the AMPS server, the
client must first use the `ACELib.Connection.loginServer()` function, the use
of which can be seen below:

```python
if conn.loginServer("Username", "Password"):
    print("Good Login")
else:
    print("Login Failed")
```

## ACELib Documentation 