"""
    Generates the primes for the key exxchange system
"""
import random


def isPrime(num):
    if num < 2:
        return False
    for i in range(2, int(num**0.5)+2):
        if i >= num:
            return True
        if num/float(i) == int(num/i):
            return False
    return True


def getRandomPrime(low, high=None):
    if high is None:
        high = low
        low = 2

    p = 1

    while not isPrime(p):
        p = random.randint(low, high)

    return p


def getPrimePair():
    return (getRandomPrime(0, 1000000), getRandomPrime(0, 1000000))
