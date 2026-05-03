#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE_URL = normalizeBaseUrl(
  process.env.LAGUUNI_API_BASE_URL ?? 'https://shop.laguuniin.fi',
)
const ANCHOR_DATE = process.env.LAGUUNI_CAPTURE_ANCHOR_DATE ?? '2026-05-03'
const SAMPLE_DATE = process.env.LAGUUNI_CAPTURE_SAMPLE_DATE ?? ANCHOR_DATE

const ROOT_DIR = resolve(process.cwd(), 'tests/fixtures/laguuni')

const CABLES = [
  { key: 'pro', productId: '6' },
  { key: 'easy', productId: '7' },
  { key: 'hietsu', productId: '157' },
]

const basketToken = await fetchJson('/api/laguuni/baskets.json')

await writeJson('booking/basket.json', 'fixture-basket-token')

for (const cable of CABLES) {
  const availableDates = await fetchJson(
    `/api/laguuni/products/${cable.productId}/availabledates/${ANCHOR_DATE}.json?field=hourlyfrom&count=1&resource_count=1&mode=hours&required_resources`,
  )
  const availableTimesCount = await fetchJson(
    `/api/laguuni/fi_FI/products/${cable.productId}/availabletimes/${SAMPLE_DATE}.json?count=1`,
  )
  const availableTimesCapacity = await fetchJson(
    `/api/laguuni/fi_FI/products/${cable.productId}/availabletimes/${SAMPLE_DATE}.json?capacity=true`,
  )

  await writeJson(`availability/${cable.key}.json`, {
    availableDates,
    availableTimesCapacity,
    availableTimesCount,
  })
}

console.log(
  `Captured fixtures from ${BASE_URL} using anchor date ${ANCHOR_DATE} and sample date ${SAMPLE_DATE}.`,
)
console.log(
  `Basket bootstrap was normalized from ${basketToken} to fixture-basket-token.`,
)

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '')
}

async function fetchJson(pathname) {
  const response = await fetch(new URL(pathname, `${BASE_URL}/`), {
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to capture ${pathname}: ${response.status} ${response.statusText}`,
    )
  }

  return response.json()
}

async function writeJson(relativePath, value) {
  const targetPath = resolve(ROOT_DIR, relativePath)

  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`)
}
