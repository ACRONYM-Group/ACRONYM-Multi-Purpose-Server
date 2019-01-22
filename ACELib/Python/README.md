# AMPS Client Environment Library

## ACELib Example Code

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

<b>Variable Interface</b>

There are two key operations that can be made with the ACELib system, the first
is interfacing with the variables that can be set on the server side. This can
be used with AMPS packages to create widgets that can be interfaced with
the ACELib client.

Variables can be set using the `ACELib.Connection.setData()` function and 
variables can be read using the `ACELib.Connection.getData()` function. 
Examples of the use of the use of these two functions can be found in the
following example:

```python
conn.setData("key", "value")

conn.getData("key")
```

<b>File Interface</b>

The second key operation that ACELib can perform is interacting with files
stored on the AMPS server. These files are interacted with the
`ACELib.Connection.downloadFile()` function and the 
`ACELib.Connection.uploadFile()`function, examples of the usage of which can be
found in the following snippet:

```python
conn.downloadFile("serverFile.ext", open("clientFile.ext", 'wb'))

conn.uploadFile(open("clientFile.ext", 'wb'), "serverFile.ext")
```

## ACELib Examples

The following example files can be found in the examples folder.

<b>Example1.py</b>

The first example file simply opens a connection with the AMPS server, and
then performs the login procedure.

## ACELib Documentation 

### Classes

<b>`ACELib.Connection`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;\[host= "127.0.0.1"\]  
  &nbsp;&nbsp;&nbsp;&nbsp;\[port= 4242\]  

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Connection class wraps the connection to an AMPS Server
`

Description:  
The Connection class handles all of the operations that
can be performed with the AMPS server from ACELib. The initalization function
simply sets the host and port variables, and does not connect to the server,
connecting to the server requires the `ACELib.Connection.initConnection()`
function be called. 

### Functions

<b>`ACELib.Connection.initConnection()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Does the initalization of the connection with the server, Does the connection, handshake, and the keyexchange
`

Description:  
The `initConnection()` function simply starts the connection to the server by
doing the initial connection (this can fail due to the server not being found
at the host, port pair given), perform the handshake and the keyexchange to
enable encrypted data transfer. These functions can all be performed seperately
by making use of the `ACELib.Connection.connect()`,
`ACELib.Connection.handshake()`, and `ACELib.Connection.getKey()` functions.