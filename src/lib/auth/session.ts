import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import type { AuthSession } from '@/lib/types'
import { getAuthConfig } from './config'

const COOKIE_CHUNK_SIZE = 3500
const COUNT_SUFFIX = 'count'

export async function readSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const cookieName = getAuthConfig().sessionCookieName
  const count = Number(cookieStore.get(getChunkCookieName(cookieName, COUNT_SUFFIX))?.value ?? '0')

  if (!Number.isInteger(count) || count <= 0) {
    return null
  }

  let encoded = ''
  for (let index = 0; index < count; index += 1) {
    const chunk = cookieStore.get(getChunkCookieName(cookieName, index))?.value
    if (!chunk) {
      return null
    }
    encoded += chunk
  }

  try {
    return decryptSession(encoded)
  } catch {
    return null
  }
}

export async function writeSession(session: AuthSession): Promise<void> {
  const cookieStore = await cookies()
  const config = getAuthConfig()
  const encoded = encryptSession(session)
  const chunks = chunkValue(encoded, COOKIE_CHUNK_SIZE)
  const previousCount = Number(
    cookieStore.get(getChunkCookieName(config.sessionCookieName, COUNT_SUFFIX))?.value ?? '0',
  )

  cookieStore.set(getChunkCookieName(config.sessionCookieName, COUNT_SUFFIX), String(chunks.length), {
    ...getCookieOptions(session.refreshTokenExpiresAt),
  })

  chunks.forEach((chunk, index) => {
    cookieStore.set(getChunkCookieName(config.sessionCookieName, index), chunk, {
      ...getCookieOptions(session.refreshTokenExpiresAt),
    })
  })

  for (let index = chunks.length; index < previousCount; index += 1) {
    cookieStore.delete(getChunkCookieName(config.sessionCookieName, index))
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const cookieName = getAuthConfig().sessionCookieName
  const count = Number(cookieStore.get(getChunkCookieName(cookieName, COUNT_SUFFIX))?.value ?? '0')

  cookieStore.delete(getChunkCookieName(cookieName, COUNT_SUFFIX))
  for (let index = 0; index < count; index += 1) {
    cookieStore.delete(getChunkCookieName(cookieName, index))
  }
}

function encryptSession(session: AuthSession): string {
  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const payload = JSON.stringify(session)
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`
}

function decryptSession(value: string): AuthSession {
  const [ivEncoded, tagEncoded, encryptedEncoded] = value.split('.')
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error('Invalid session cookie payload.')
  }

  const key = getEncryptionKey()
  const decipher = createDecipheriv('aes-256-gcm', key, fromBase64Url(ivEncoded))
  decipher.setAuthTag(fromBase64Url(tagEncoded))
  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(encryptedEncoded)),
    decipher.final(),
  ])

  return JSON.parse(decrypted.toString('utf8')) as AuthSession
}

function getEncryptionKey(): Buffer {
  return createHash('sha256').update(getAuthConfig().sessionSecret).digest()
}

function getCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  }
}

function getChunkCookieName(baseName: string, suffix: number | string): string {
  return `${baseName}.${suffix}`
}

function chunkValue(value: string, size: number): string[] {
  const chunks: string[] = []
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size))
  }
  return chunks
}

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64')
}
