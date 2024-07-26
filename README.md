# Kate

Implementation of [Kate-Zaverucha-Goldberg commitments](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf) (aka KZG commitments) over BN254.

## Usage

```ts
import { commitVec, proveVec, verifyVec, Fr } from '@kevincharm/kate'

const vector = Array.from({ length: 5 }, () => Fr.rand())

// Commitment: C, ω
const commitment = await commitVec(vector)

// Proof: π
const { pi } = await proveVec(vector[0], 0n, commitment)

// Verify(C, ω, π, value, index)
await verifyVec(commitment.C, commitment.root, pi, vector[0], 0n) // === true
```

## Vector commitments

Vector commitments are implemented as described [here](https://dankradfeist.de/ethereum/2021/06/18/verkle-trie-for-eth1.html).

Let $\omega$ be a primitive $d$-th root of unity s.t. $\omega^d = 1, \omega^i \neq 1$ for $i \in [0, d)$

Now to commit to a vector $\mathbf{v} = \{ v_0, v_1, ..., v_{d-1} \}$ with $|\mathbf{v}| = d$, we interpolate a polynomial $P(x)$ of degree $d-1$ such that:

$$
P(\omega^i) = v_i
$$

⚠️ Note that $d$ must be a power of 2, so a vector committed in this implementation is padded with zero elements until $|\mathbf{v}|$ is a power of 2.

Once we have computed the interpolated polynomial $P(x) = p_0 + p_1 \cdot x + p_2 \cdot x^2 + ... + p_{d-1} \cdot x^{d-1}$, we compute a simple vector commitment $C_{\mathbf{v}}$:

```math
C_{\mathbf{v}} = [ P(\tau) ]_1 = \left[ \sum_{i=0}^{d-1} p_i \cdot \tau^i \right]_1 = \sum_{i=0}^{d-1} p_i \cdot [\tau^i]_1 = \sum_{i=0}^{d-1} p_i \cdot ( \tau^i \cdot \mathbb{G}_1 )
```

where $\tau^i \cdot \mathbb{G}_1$ is the $i$-th power generator from the Powers of Tau trusted setup.

### Proving membership

To prove an element $v_i \in C_{\mathbf{v}}$, we first evaluate $P(\omega^i) = v_i$ (indeed, we already know this from the commitment phase).

Then, our proof is given by $\pi = [Q(\tau)]_1$, where the quotient polynomial $Q(x)$ is given by

$$
Q(x) = \frac{ P(x) - v_i }{ x - \omega^i } = q_0 + q_1 \cdot x + q_2 \cdot x^2 + ... + q_{d-1} \cdot x^{d-1}
$$

and so

```math
\pi
= [Q(\tau)]_1
= [ q_0 \cdot \tau + q_1 \cdot \tau^2 + ... + q_{d-1} \cdot \tau^d ]_1
= \sum_{i=0}^{d-1} q_i \cdot (\tau^i \cdot \mathbb{G}_1)
```

### Verifying membership proof

To verify $v_i \in C_{\mathbf{v}}$, the prover sends $\{ \omega^i, v_i, \pi \}$.

The verifier compares the following pairings and verifies that they are equivalent.

```math
e(\pi, [\tau - \omega^i]_2) \stackrel{?}{=} e(C_{\mathbf{v}} - [v_i]_1, h)
```

where $h$ is an arbitrary $i$-th power generator (with $i \neq 1$) on the $\mathbb{G}_2$ subgroup from the Powers of Tau CRS.

Note also that

$$
[\tau - \omega^i]_2 = (\tau - \omega^i) \cdot \mathbb{G}_2 = \tau \cdot \mathbb{G}_2 - \omega^i \cdot \mathbb{G}_2
$$

The pairing check is equivalent to checking that the quotient polynomial $Q(x)$ is correctly formed at $Q(\tau)$ (from [Scroll](https://docs.scroll.io/en/learn/zero-knowledge/kzg-commitment-scheme)):

```math
e(\pi, [\tau - \omega^i]_2) = e(C_{\mathbf{v}} - [v_i]_1, h)
```

$$
\iff e([Q(\tau)]_1, [\tau - \omega^i]_2) = e([P(\tau)]_1 - [v_i]_1, h)
$$

$$
\iff Q(\tau) \cdot (\tau - \omega^i) \cdot e(g,h)
= (P(\tau) - v_i) \cdot e(g,h)
$$

$$
\iff Q(\tau) \cdot (\tau - \omega^i) = P(\tau) - v_i
$$

## Powers of Tau

For each coefficient of any polynomial that we want to commit, we need an unrelated generator for which we don't know the discrete logarithm. To achieve this, we use the $\tau^i \mathbb{G}_1$ and $\tau^i \mathbb{G}_2$ generators from the [Perpetual Powers of Tau](https://github.com/privacy-scaling-explorations/perpetualpowersoftau) trusted setup.

## References

Also see [weijiekoh/libkzg](https://github.com/weijiekoh/libkzg) which was very helpful as a reference in writing this implementation.
