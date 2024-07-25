import fs from 'fs/promises'
import path from 'path'
import { G1, G2 } from './ff'

// Get the first n tau G1 points from the Powers of Tau CRS
export async function getTauG1s(n: number) {
    const potFile = path.resolve(__dirname, '../pot/ppot_0080_10_tau_g1.bin')
    const n8 = 32
    const fd = await fs.open(path.resolve(process.cwd(), potFile), 'r')
    const { buffer: pointsBuffer } = await fd.read(Buffer.alloc(n8 * 2 * n), 0, n8 * 2 * n, 0)
    await fd.close()
    const generators = []
    for (let i = 0; i < n8 * 2 * n; i += n8 * 2) {
        const x = BigInt(`0x${pointsBuffer.subarray(i, i + n8).toString('hex')}`)
        const y = BigInt(`0x${pointsBuffer.subarray(i + n8, i + n8 * 2).toString('hex')}`)
        const point = G1.affine([x, y, 1n])
        generators.push(point)
    }
    return generators
}

export async function getTauG2s(n: number) {
    const potFile = path.resolve(__dirname, '../pot/ppot_0080_10_tau_g2.bin')
    const n8 = 32
    const fd = await fs.open(path.resolve(process.cwd(), potFile), 'r')
    const { buffer: pointsBuffer } = await fd.read(Buffer.alloc(n8 * 4 * n), 0, n8 * 4 * n, 0)
    await fd.close()
    const generators = []
    for (let i = 0; i < n; i++) {
        const cur = i * n8 * 4
        const x0 = BigInt(`0x${pointsBuffer.subarray(cur, cur + n8).toString('hex')}`)
        const x1 = BigInt(`0x${pointsBuffer.subarray(cur + n8, cur + n8 * 2).toString('hex')}`)
        const y0 = BigInt(`0x${pointsBuffer.subarray(cur + n8 * 2, cur + n8 * 3).toString('hex')}`)
        const y1 = BigInt(`0x${pointsBuffer.subarray(cur + n8 * 3, cur + n8 * 4).toString('hex')}`)
        const point = G2.affine([
            [x0, x1],
            [y0, y1],
            [1n, 0n],
        ])
        generators.push(point)
    }
    return generators
}
