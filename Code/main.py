import socket
import threading

import keyExchange

alice = keyExchange.KeyExchange((337, 11))
bob = keyExchange.KeyExchange((337, 11))

alice.randomSecret()
bob.randomSecret()

A = alice.calculateMixed()
B = bob.calculateMixed()

print (alice.getSharedKey(B))
print (bob.getSharedKey(A))