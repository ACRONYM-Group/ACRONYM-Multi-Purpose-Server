class KeyExchange:
    def __init__(self,primes):
        self.p, self.g = primes
        self.secret = 0

    def setSecred(self,secret):
        self.secret = secret

    def calculateMixed(self):
        return self.g ** self.secret % self.p

    def getSharedKey(self,otherMix):
        return otherMix ** self.secret % self.p