"""
    Handles the key exchange math for a Diffie Hellman key exchange
"""
import random


class KeyExchange:
    def __init__(self, primes):
        self.p, self.g = primes

        if self.g > self.p:
            self.g, self.p = self.p, self.g

        self.secret = 0

    def setSecret(self, secret):
        self.secret = secret

    def randomSecret(self):
        self.secret = random.randint(2, 50)

    def calculateMixed(self):
        return (self.g ** self.secret) % self.p

    def getSharedKey(self, otherMix):
        return (otherMix ** self.secret) % self.p
