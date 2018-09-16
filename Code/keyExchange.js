function getMixture(p, g, secret)
{
    return Math.pow(g, secret) % p
}