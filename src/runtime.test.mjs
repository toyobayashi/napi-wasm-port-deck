import * as assert from 'assert'
import { RuntimeContext } from './runtime.mjs'

function runInScope(ctx, fn) {
  const scope = ctx.openHandleScope()
  let ret
  try {
    ret = fn(ctx)
  } finally {
    ctx.closeHandleScope(scope)
  }
  return ret
}

function main() {
  const ctx = new RuntimeContext()
  try {
    const h = runInScope(ctx, (ctx) => {
      const hGlobal = ctx.getHandle(5)
      const hConsoleString = ctx.toHandle('console')
      const hConsole = hGlobal.get(ctx, hConsoleString)
      const hLogString = ctx.toHandle('log')
      const hLog = hConsole.get(ctx, hLogString)
      hLog.call(ctx, hConsole, [ctx.toHandle('hello world!')])
      return ctx.getHandle(1)
    })
    assert.strictEqual(ctx.fromHandle(h), undefined)
    assert.strictEqual(ctx.handleStore.nextId, 6)
  } finally {
    ctx.dispose()
  }
}

main()
