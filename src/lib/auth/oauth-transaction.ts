import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { getAuthConfig } from './config'
import type { HostedUiTransaction } from './cognito'

const transactionCookieName = 'dynamodb_mvp_oauth'

export async function writeHostedUiTransaction(transaction: HostedUiTransaction): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(transactionCookieName, encrypt(JSON.stringify(transaction)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  })
}

export async function readHostedUiTransaction(): Promise<HostedUiTransaction | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(transactionCookieName)?.value
  if (!value) {
    return null
  }

  try {
    return JSON.parse(decrypt(value)) as HostedUiTransaction
  } catch {
    return null
  }
}

export async function clearHostedUiTransaction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(transactionCookieName)
}

function encrypt(value: string): string {
  const key = createHash('sha256').update(getAuthConfig().sessionSecret).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`
}

function decrypt(value: string): string {
  const [ivEncoded, tagEncoded, ciphertextEncoded] = value.split('.')
  if (!ivEncoded || !tagEncoded || !ciphertextEncoded) {
    throw new Error('Invalid transaction cookie.')
  }

  const key = createHash('sha256').update(getAuthConfig().sessionSecret).digest()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivEncoded, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, 'base64url')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
