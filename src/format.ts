type Stringable = { toString: () => string }
type Value = null | undefined | number | boolean | string | Array<Value> | Date | Stringable

export function format(query: string, values: any): string {
  return Array.isArray(values) ? replacePosition(query, values) : replaceNamed(query, values)
}

function replacePosition(query: string, values: Value[]): string {
  let index = 0
  return replacePlaceholders(query, (match) => {
    if (match !== '?') return match
    return index < values.length ? sanitize(values[index++]) : match
  })
}

function replaceNamed(query: string, values: Record<string, Value>): string {
  return replacePlaceholders(query, (match) => {
    const name = match.slice(1)
    return match[0] === ':' && hasOwn(values, name) ? sanitize(values[name]) : match
  })
}

// Scan the template only; parameter values must never change its lexical state.
function replacePlaceholders(query: string, replace: (placeholder: string) => string): string {
  let result = ''
  let start = 0
  let i = 0
  while (i < query.length) {
    const char = query[i]
    if (char === "'" || char === '"' || char === '`') {
      const quote = char
      i++
      while (i < query.length) {
        if (query[i] === '\\' && quote !== '`') {
          i += 2
        } else if (query[i] === quote) {
          i++
          if (query[i] !== quote) break
          i++ // Doubled quotes remain inside the literal or identifier.
        } else {
          i++
        }
      }
    } else if (char === '#' || (query.startsWith('--', i) && /[\x00-\x20]/.test(query[i + 2] ?? ''))) {
      while (i < query.length && query[i] !== '\n' && query[i] !== '\r') i++
    } else if (query.startsWith('/*', i)) {
      const end = query.indexOf('*/', i + 2)
      i = end === -1 ? query.length : end + 2
    } else {
      const match = char === '?' ? '?' : char === ':' ? /^:\w+/.exec(query.slice(i))?.[0] : undefined
      if (match) {
        result += query.slice(start, i) + replace(match)
        i += match.length
        start = i
      } else {
        i++
      }
    }
  }
  return result + query.slice(start)
}

function hasOwn(obj: unknown, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, name)
}

function sanitize(value: Value): string {
  if (value == null) {
    return 'null'
  }

  if (['number', 'bigint'].includes(typeof value)) {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (value instanceof Uint8Array) {
    return uint8ArrayToHex(value)
  }

  if (typeof value === 'string') {
    return quote(value)
  }

  if (Array.isArray(value)) {
    return value.map(sanitize).join(', ')
  }

  if (value instanceof Date) {
    return quote(value.toISOString().replace('Z', ''))
  }

  return quote(value.toString())
}

function quote(text: string): string {
  return `'${escape(text)}'`
}

const re = /[\0\b\n\r\t\x1a\\"']/g

function escape(text: string): string {
  return text.replace(re, replacement)
}

function replacement(text: string): string {
  switch (text) {
    case '"':
      return '\\"'
    case "'":
      return "\\'"
    case '\n':
      return '\\n'
    case '\r':
      return '\\r'
    case '\t':
      return '\\t'
    case '\\':
      return '\\\\'
    case '\0':
      return '\\0'
    case '\b':
      return '\\b'
    case '\x1a':
      return '\\Z'
    default:
      return ''
  }
}

export function uint8ArrayToHex(uint8: Uint8Array): string {
  const digits = Array.from(uint8).map((i) => i.toString(16).padStart(2, '0'))
  return `0x${digits.join('')}`
}
