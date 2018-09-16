function getMixture(p, g, secret)
{
    return Math.pow(g, secret) % p;
}

function getSharedKey(p, g, secret, other)
{
    return Math.pow(other, secret) % p;
}