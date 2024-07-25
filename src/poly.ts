// @ts-ignore
import * as ffjs from 'ffjavascript'
import { G1, G2, Fr, PointG1 } from './ff'
import { getTauG1s, getTauG2s } from './tau'
import { Vector } from '@guildofweavers/galois'

// Compute a KZG polynomial commitment
// @param coeffs Polynomial coefficients from lowest power to highest
export async function commitPoly(coeffs: bigint[]) {
    const tauG1 = await getTauG1s(coeffs.length)
    for (const coeff of coeffs) {
        if (Fr.isElement(coeff)) continue
        throw new Error(`${coeff} is not in field`)
    }

    let C = G1.zero
    for (let i = 0; i < coeffs.length; i++) {
        C = G1.add(C, G1.mulScalar(tauG1[i], coeffs[i]))
    }

    return G1.affine(C)
}

export interface Proof {
    pi: PointG1
    qx: Vector
}

// Compute a KZG proof for P(a) = b
// To prove P(a) = b:
//  Q(x) = (P(x) - b) / (x - a)
//  π = [Q(τ)]_1 = q0 * (G) + q1 * (τ^1 * G) + ... + q(d-1) * (τ^(d-1) * G)
// @param coeffs Input coefficients to p(x) in order of lowest to highest power
export async function prove(a: bigint, b: bigint, coeffs: bigint[]): Promise<Proof> {
    const px = Fr.newVectorFrom(coeffs)
    /** P(x) - b */
    const qxNum = Fr.subPolys(px, Fr.newVectorFrom([b]))
    /** (x - a) */
    const qxDen = Fr.subPolys(
        Fr.newVectorFrom([0n, 1n]) /** y = 0 + 1*x = x */,
        Fr.newVectorFrom([a]) /** y = a */,
    )
    // Q(x) = (P(x) - b) / (x - a)
    const qx = Fr.divPolys(qxNum, qxDen)

    // Evaluate Q(τ) in G1
    // π = [Q(τ)]_1 = q0 * (G) + q1 * (τ^1 * G) + ... + q(d-1) * (τ^(d-1) * G)
    const pi = await commitPoly(qx.toValues())

    return {
        pi,
        qx,
    }
}

// Verify a KZG proof for v_i in vector
// To verify π that C commits P(a) = b:
// e(π, [τ − a]_2​) = e(C − [b]_1​,h)
// e(π, τG2 − aG2​) = e(C −  b*G1​,h)
export async function verify(C: PointG1, pi: PointG1, a: bigint, b: bigint) {
    const tauG1s = await getTauG1s(2)
    const tauG2s = await getTauG2s(2)
    const g1 = tauG1s[0] // G1 generator
    const g2 = tauG2s[0] // G2 generator

    const p0 = pi
    const q0 = G2.sub(tauG2s[1], G2.mulScalar(g2, a))
    const f0 = ffjs.bn128.pairing(p0, q0)

    const p1 = G1.sub(G1.affine(C), G1.mulScalar(g1, b))
    const f1 = ffjs.bn128.pairing(p1, g2)
    return ffjs.bn128.F12.eq(f0, f1)
}
