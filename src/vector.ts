import { Vector } from '@guildofweavers/galois'
import { Fr, PointG1, G1 } from './ff'
import { commitPoly, prove, verify } from './poly'

function nextPowerOfTwo(n: number) {
    const candidate = 2 ** Math.ceil(Math.log2(n))
    if (!Fr.isElement(BigInt(candidate))) throw new Error(`${candidate} is not in field`)
    return candidate
}

// KZG commitments are polynomial commitments, but we can turn them into
// vector commitments by interpolating the polynomial p(ω^i) = v_i
export function interpolate(vector: bigint[]) {
    // We need to find a primitive d-th root of unity in F_r;
    // d must be a power of 2
    const d = nextPowerOfTwo(vector.length)

    // Let ω <- primitive d-th root of unity in F_r
    const root = Fr.getRootOfUnity(d)
    // { ω^0, ω^1, ω^2, ..., ω^(d-1) }
    const xs = Fr.newVectorFrom(Array.from({ length: d }, (_, i) => Fr.exp(root, BigInt(i))))

    // We pad the vector with zeros as we need a polynomial of degree d-1
    // { v_0, v_1, v_2, ..., v_(d-1) }
    const z = d - vector.length
    const vectorWithPadding = [...vector, ...Array.from({ length: z }, () => 0n)]
    const ys = Fr.newVectorFrom(vectorWithPadding)

    // Finally, compute p(x) via Lagrange interpolation
    const px = Fr.interpolate(xs, ys)

    return {
        d,
        root,
        px,
    }
}

export interface VectorCommitment {
    d: number
    root: bigint
    px: Vector
    C: PointG1
}

// Compute a KZG vector commitment via Lagrange interpolation
export async function commitVec(vector: bigint[]): Promise<VectorCommitment> {
    const { d, root, px } = interpolate(vector)
    const C = await commitPoly(px.toValues())
    return {
        d,
        root,
        px,
        C: G1.affine(C),
    }
}

export async function proveVec(value: bigint, index: bigint, vectorCommitment: VectorCommitment) {
    const { root, px } = vectorCommitment
    // To prove: P(ω^i) = v_i.
    return prove(Fr.exp(root, index), value, px.toValues())
}

export async function verifyVec(
    C: PointG1,
    root: bigint,
    pi: PointG1,
    value: bigint,
    index: bigint,
) {
    return verify(C, pi, Fr.exp(root, index), value)
}
