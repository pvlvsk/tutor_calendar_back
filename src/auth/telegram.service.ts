import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

@Injectable()
export class TelegramService {
  private readonly botToken = process.env.BOT_TOKEN
  // Dev режим: нет BOT_TOKEN или NODE_ENV=development
  private readonly isDev = !this.botToken || process.env.NODE_ENV === 'development'

  validateInitData(initData: string): TelegramUser | null {
    if (this.isDev) {
      return this.parseDevInitData(initData)
    }
    return this.parseAndValidate(initData)
  }

  private parseDevInitData(initData: string): TelegramUser {
    try {
      const params = new URLSearchParams(initData)
      const userStr = params.get('user')
      if (userStr) {
        return JSON.parse(userStr)
      }
    } catch {}
    
    return {
      id: 123456789,
      first_name: 'Dev',
      last_name: 'User',
      username: 'devuser',
    }
  }

  private parseAndValidate(initData: string): TelegramUser | null {
    try {
      const params = new URLSearchParams(initData)
      const hash = params.get('hash')
      if (!hash) return null

      params.delete('hash')
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken!)
        .digest()

      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(sortedParams)
        .digest('hex')

      if (calculatedHash !== hash) return null

      const userStr = params.get('user')
      if (!userStr) return null

      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
}

