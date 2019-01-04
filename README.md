# ACRONYM-File-Transfer-System
<b>AMPS</b>
ACRONYM Multi Purpose Server

Used for mangement and control of a server (or Virtual Private Server).

Primary Server is in Python, with the ability for Clients in both Python and NodeJS (with the potential to add support to other languages.)
The NodeJS client will be able to run the app in a desktop environment using Electron, allowing for easy control of the server and for user facing features.

Planned Features include:
Push Notification Support
Built-in File Transfer
Package Manager (for installation and auto-update of A.C.R.O.N.Y.M. programs)
Remote Command Line Access (Most likely through SSH)
Server/Program Status Displays and Controls
Automatic backup for server-side files/programs
etc.

<b>ACE-Lib</b>
AMPS Client Environment - Library

A library used to provide an easy way for any number of programs to interface with AMPS. Rather than requiring each client to have it's own custom networking code, ACE-Lib allows for any NodeJS or Python program to use a standard set of networking code, making integration of programs with AMPS much easier.

ACE-Lib JS uses a seperately launched NodeJS/Electron app to communicate with the server. This means that ACE-Lib JS is actually a free standing program by itself, and has it's own proccess. (And in fact, multiple ACE's can be created per app for performance reasons) Communication between the host app, and ACE-Lib JS is done via IPC.

ACE-Lib Py is imported directly as with any other Python library. Therefore it does not have it's own proccess, but is considerably easier to set up.