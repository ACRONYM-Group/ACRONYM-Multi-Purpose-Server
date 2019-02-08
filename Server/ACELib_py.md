# AMPS Client Environment Library

## ACELib Example Code

<b>Basic ACELib Setup</b>

There are two steps that must be taken before effective use of ACELib can be
made, these two steps are generating the connection, and connecting to the
server. This is done using the <a href='#Connection'>`ACELib.Connection`</a>
class, and the <a href='#initConnection'>`ACELib.Connection.initConnection()`
</a> function.

These two operations are performed in the following snippet:

```python
import ACELib

conn = ACELib.Connection()

conn.initConnection()
```

<b>Login</b>

Before any useful action can be made in communicating with the AMPS server, the
client must first use the 
<a href='#loginServer'>`ACELib.Connection.loginServer()`</a> function, the use
of which can be seen below:

```python
if conn.loginServer("Username", "Password"):
    print("Good Login")
else:
    print("Login Failed")
```

<b>Variable Interface</b>

There are three key operations that can be made with the ACELib system, the first
is interfacing with the variables that can be set on the server side. This can
be used with AMPS packages to create widgets that can be interfaced with
the ACELib client.

Variables can be set using the 
<a href='#setData'>`ACELib.Connection.setData()`</a> function and 
variables can be read using the
<a href='#getData'>`ACELib.Connection.getData()`</a> function. 
Examples of the use of the use of these two functions can be found in the
following example:

```python
conn.setData("key", "value")

conn.getData("key")
```

<b>File Interface</b>

The second key operation that ACELib can perform is interacting with files
stored on the AMPS server. These files are interacted with the
<a href='#downloadFile'>`ACELib.Connection.downloadFile()`</a> function and the
<a href='#uploadFile'>`ACELib.Connection.uploadFile()`</a> function, examples
of the usage of which can be found in the following snippet:

```python
conn.downloadFile("serverFile.ext", open("clientFile.ext", 'wb'))

conn.uploadFile(open("clientFile.ext", 'wb'), "serverFile.ext")
```

<b>Variable Events</b>

The third key operation that ACELib can perform is related to the first, in that
it is designed to interface with variables on the server, however instead of
changing those variables, this operation responds to those variables being updated
on the server. This is done using the 
<a href="#addListener">`ACELib.Connection.addListener()`</a> function and the 
<a href="#startListener">`ACELib.Connection.startListener()`</a> function. These
two functions subscribe to a listening event and start the listening loop
respectively. The following snippet shows the two files that would be involved
in something akin to a remote display board being controled through AMPS:

```python
def changeDisplayBoard(newValue, oldValue):
    print("Value Changed to: ", newValue, "\nOld Value:", oldValue)
    #The other stuff for changing the display board would go here
    
eventConnection.addListener("boardText", changeDisplayBoard)
eventConnection.startListener()
```

and the second which would update the data on the server:

```python
while True:
    newValue = input("> ")
    
    conn.setData("boardText", newValue)
```

## ACELib Examples

The following example files can be found in the examples folder.

<b>Example1.py</b>

The first example file simply opens a connection with the AMPS server, and
then performs the login procedure.

## ACELib Documentation 

<span id="Connection"></span>
### Connection

<b>`ACELib.Connection`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;\[host= "127.0.0.1"\]  
  &nbsp;&nbsp;&nbsp;&nbsp;\[port= 4242\]

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Connection class wraps the connection to an AMPS Server
`

Description:  
The Connection class handles all of the operations that
can be performed with the AMPS server from ACELib. The initalization function
simply sets the host and port variables, and does not connect to the server,
connecting to the server requires the <a href='#initConnection'>`ACELib.Connection.initConnection()`</a>
function be called. 

<span id="initConnection"></span>
### initConnection()

<b>`ACELib.Connection.initConnection()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Returns:  
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
by making use of the <a href="#connect">`ACELib.Connection.connect()`</a>,
<a href="#handshake">`ACELib.Connection.handshake()`</a>, and 
<a href="#getKey">`ACELib.Connection.getKey()`</a> functions.

<span id="connect"></span>
### connect()

<b>`ACELib.Connection.connect()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Connects to the AMPS Server, and initalizes the connection
`

Description:  
Connects the internal socket to the server using the host, port pair provided.

<span id="handshake"></span>
### handshake()

<b>`ACELib.Connection.handshake()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Performs the standard handshake with an AMPS Server
`

Description:  
Ensures the server the library is connected to is an AMPS Server by ensuring it
correctly responds to the handshake message, can only be called directly after
the <a href="#connect">`ACELib.Connection.connect()`</a> for the server to respond correctly.

<span id="getKey"></span>
### getKey()

<b>`ACELib.Connection.getKey()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;Shared Key

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Performs the other half of the key exchange, resulting in the sharing of keys 
between the AMPS Server and client
`

Description:  
Causes the connection and the server to share a key for encryption. Returns the
agreed upon key.

<span id="setData"></span>
### setData()

<b>`ACELib.Connection.setData()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;name  
  &nbsp;&nbsp;&nbsp;&nbsp;value  
  &nbsp;&nbsp;&nbsp;&nbsp;\[dataType="str"\]

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Sets data in the cache on the server, Specificly, sets the data under name to value
`

Description:  
Sets the value for the variable given by `name` to `value`, with the optional
datatype setting

<span id="getData"></span>
### getData()

<b>`ACELib.Connection.getData()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;name  

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;Value

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Gets data by name from the server
`

Description:  
Gets the value for the variable given by `name`, and returns it.

<span id="loginServer"></span>
### loginServer()

<b>`ACELib.Connection.loginServer()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;username  
    &nbsp;&nbsp;&nbsp;&nbsp;password  

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`
Starts the login process with the AMPS server
`

Description:  
Performs the login with the server using the given `username` and `password`

<span id="downloadFile"></span>
### downloadFile()

<b>`ACELib.Connection.downloadFile()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;fileName  
    &nbsp;&nbsp;&nbsp;&nbsp;fileObject  

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`Downloads the file with the given filename on the
server, and outputs it to the (binary, must be binary) file stored in fileObject
`

Description:  
Downloads the file in `fileName` on the server and writes it to the given file
object, which must be binary for the writing and decoding to work correctly.

<span id="uploadFile"></span>
### uploadFile()

<b>`ACELib.Connection.uploadFile()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;fileObject  
    &nbsp;&nbsp;&nbsp;&nbsp;fileName

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`Uploads the data from the fileObject and stores it in the file designated by fileName
`

Description:  
Uploads the file in `fileObject` to the server and stores it in `fileName`

<span id="addListener"></span>
### addListener()

<b>`ACELib.Connection.addListener()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;key  
    &nbsp;&nbsp;&nbsp;&nbsp;callBack

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`Adds an event listener on the server to respond to the variable in
            key being updated, upon it being updated callBack will be called, with
            two parameters, the first being the new value, and the second, the old
            value.`

Description:  
Subscribes to the event triggered by the changing of a variable with the key `key`, calling
`callBack` with the new and old values as parameters

<span id="startListener"></span>
### startListener()

<b>`ACELib.Connection.startListener()`</b>

Arguments:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Returns:  
  &nbsp;&nbsp;&nbsp;&nbsp;None

Docstring:  
&nbsp;&nbsp;&nbsp;&nbsp;`Starts the event loop, while this occurs in a seperate thread and code
            can be run after this is called, it is still recomended to call this
            at the end of a file.`
`
Description:  
Starts the event listener loop.

