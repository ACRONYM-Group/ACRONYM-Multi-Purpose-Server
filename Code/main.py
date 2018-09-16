import socket
import threading

import keyExchange

import primes as Primes

pair = Primes.getPrimePair()

alice = keyExchange.KeyExchange(pair)
bob = keyExchange.KeyExchange(pair)

alice.randomSecret()
bob.randomSecret()

A = alice.calculateMixed()
B = bob.calculateMixed()

print (alice.getSharedKey(B))
print (bob.getSharedKey(A))