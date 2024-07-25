import { expect } from 'chai'
import { commitPoly, prove, verify } from '../src/poly'
import { getTauG1s } from '../src/tau'
import { Fr, G1 } from '../src/ff'
import { commitVec, interpolate, proveVec, verifyVec } from '../src/vector'

describe('kate', () => {
    it('commits polynomial', async () => {
        // y = 5 + 13x + 7x^2
        const coeffs = [5n, 13n, 7n]
        const px = Fr.newVectorFrom(coeffs.slice())
        expect(Fr.evalPolyAt(px, 0n)).to.eq(5n)
        expect(Fr.evalPolyAt(px, 2n)).to.eq(59n)
        // Make commitment
        const C = await commitPoly(coeffs)

        // Check commitment
        const tauG1s = await getTauG1s(3)
        const computedC = [
            G1.mulScalar(G1.affine(tauG1s[0]), 5n),
            G1.mulScalar(G1.affine(tauG1s[1]), 13n),
            G1.mulScalar(G1.affine(tauG1s[2]), 7n),
        ].reduce((acc, tauGen) => G1.add(acc, tauGen), G1.zero)
        expect(G1.eq(C, computedC)).to.eq(true)

        const { pi } = await prove(2n, 59n, coeffs)
        expect(await verify(C, pi, 2n, 59n)).to.eq(true)
    })

    it('interpolates p(ω^i) = v_i', async () => {
        const vector = Array.from({ length: 5 }, (_, i) => Fr.rand())
        const { px, root } = interpolate(vector)
        expect(Fr.evalPolyAt(px, Fr.exp(root, 0n))).to.eq(vector[0])
    })

    it('commits vector', async () => {
        const vector = Array.from({ length: 5 }, (_, i) => Fr.rand())

        // Commit
        const commitment = await commitVec(vector)

        // Verify
        const { pi } = await proveVec(vector[0], 0n, commitment)
        expect(await verifyVec(commitment.C, commitment.root, pi, vector[0], 0n)).to.eq(true)
    })
})