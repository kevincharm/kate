import { createPrimeField } from '@guildofweavers/galois'
// @ts-ignore
import * as ffjs from 'ffjavascript'

export declare const tags: unique symbol

export type Tagged<BaseType, Tag extends PropertyKey> = BaseType & {
    [tags]: {
        [K in Tag]: void
    }
}

// babyjubjub curve order
export const Fr = createPrimeField(
    21888242871839275222246405745257275088548364400416034343698204186575808495617n,
    true,
)

// Projective coordinates
export type PointG1 = [bigint, bigint, bigint]
export type PointG2 = [[bigint, bigint], [bigint, bigint], [bigint, bigint]]
export type Point = PointG1 | PointG2
// https://github.com/iden3/ffjavascript/blob/18cab5b5edbd6d45c70882bd15644506e878e47f/src/ec.js
export interface G<T extends Point, P = Tagged<T, 'Point'>> {
    add(p: P, q: P): P
    neg(p: P): P
    sub(p: P, q: P): P
    mulScalar(p: P, k: bigint): P
    affine(p: T): P
    eq(p: P, q: P): boolean
    g: P
    zero: P
    one: P
}
export const G1 = ffjs.bn128.G1 as G<PointG1>
export const G2 = ffjs.bn128.G2 as G<PointG2>
