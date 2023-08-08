// runtime.mjs

export class Store {
  constructor () {
    this.values = [undefined]
    this.freeList = []
    this.nextId = 1
  }

  get (id) {
    return this.values[id]
  }

  allocateId () {
    if (this.freeList.length > 0) {
      return this.freeList.shift()
    }
    return this.nextId++
  }

  allocate (value) {
    const id = this.allocateId()
    value.id = id
    this.values[id] = value
  }

  free (id) {
    if (this.values[id] !== undefined) {
      this.values[id].dispose()
      this.values[id] = undefined
      this.freeList.push(id)
    }
  }

  dispose () {
    const errors = []
    this.values.forEach(value => {
      if (value) {
        try {
          if (typeof value.dispose === 'function') {
            value.dispose()
          }
        } catch (err) {
          errors.push(err)
        }
      }
    })
    this.values = [undefined]
    this.freeList = []
    this.nextId = 1
    if (errors.length > 0) {
      throw new AggregateError(errors)
    }
  }
}

export class Handle {
  constructor(id, value) {
    this.id = id
    this.value = value
  }

  dispose() {
    this.value = undefined
  }
}

export class ConstHandle extends Handle {
  static UNDEFINED = new ConstHandle(1, undefined)
  static NULL = new ConstHandle(2, null)
  static FALSE = new ConstHandle(3, false)
  static TRUE = new ConstHandle(4, true)
  static GLOBAL = new ConstHandle(5, globalThis)

  constructor (id, value) {
    super(id, value)
  }

  dispose() {}
}

export class HandleStore {
  constructor () {
    this.values = [
      undefined,
      ConstHandle.UNDEFINED,
      ConstHandle.NULL,
      ConstHandle.FALSE,
      ConstHandle.TRUE,
      ConstHandle.GLOBAL
    ]
    this.nextId = 6
    this.pool = []
  }

  get (id) {
    return this.values[id]
  }

  allocateId () {
    return this.nextId++
  }

  add (value) {
    const id = this.allocateId()
    let handle
    if (this.pool.length > 0) {
      handle = this.pool.shift()
      handle.id = id
      handle.value = value
    } else {
      handle = new Handle(id, value)
    }
    this.values[id] = handle
    return handle
  }

  free (id) {
    if (id < 6) return
    if (this.values[id] !== undefined) {
      const handle = this.values[id]
      handle.dispose()
      this.values[id] = undefined
      this.pool.push(handle)
    }
  }
}

export class HandleScope {
  constructor(ctx, begin, parent) {
    this.ctx = ctx
    this.begin = begin
    this.end = begin
    this.parent = parent
  }

  collect(handle) {
    this.end++
  }

  dispose() {
    const { begin, end } = this
    this.parent = null
    for (let i = begin; i < end; ++i) {
      this.ctx.handleStore.free(i)
    }
    this.ctx.handleStore.nextId = begin
  }
}

export class TryCatch {
  constructor () {
    this._exception = undefined
    this._caught = false
  }

  hasCaught () {
    return this._caught
  }

  exception () {
    return this._exception
  }

  setError (err) {
    this._caught = true
    this._exception = err
  }

  reset () {
    this._caught = false
    this._exception = undefined
  }

  extractException () {
    const e = this._exception
    this.reset()
    return e
  }
}

export class Env {
  constructor (ctx) {
    this.ctx = ctx
    this.id = 0
    this.lastException = new TryCatch()
    this.lastError = { errorCode: 0 }
  }

  setLastError (error_code) {
    const lastError = this.lastError
    if (lastError.errorCode !== error_code) {
      lastError.errorCode = error_code
    }
    return error_code
  }

  clearLastError () {
    return this.setLastError(0)
  }

  callIntoModule (fn) {
    this.clearLastError()
    const r = fn(this)
    const lastException = this.lastException
    if (lastException.hasCaught()) {
      throw lastException.extractException()
    }
    return r
  }
}

export class CallbackInfo {
  constructor (parent, thiz, data, args, fn) {
    this.parent = parent
    this.thiz = thiz
    this.data = data
    this.args = args
    this.fn = fn
  }

  getNewTarget (ctx) {
    const thiz = this.thiz
    if (thiz == null || thiz.constructor == null) {
      return 0
    }
    return thiz instanceof this.fn
      ? ctx.toHandle(thiz.constructor).id
      : 0
  }
}

export class CallbackInfoStack {
  constructor () {
    this.current = null
  }

  pop () {
    const current = this.current
    if (current === null) return
    this.current = current.parent
  }

  push (thiz, data, args, fn) {
    const info = new CallbackInfo(
      this.current, thiz, data, args, fn)
    this.current = info
    return info
  }
}

export class RuntimeContext {
  constructor() {
    this.envStore = new Store()
    this.handleStore = new HandleStore()
    this.cbinfoStack = new CallbackInfoStack()
    this.currentScope = null
  }

  dispose () {
    while (this.currentScope) {
      const scope = this.currentScope
      this.currentScope = scope.parent
      scope.dispose()
    }
  }

  createEnv () {
    const envObject = new Env()
    this.envStore.allocate(envObject)
    return envObject
  }

  openHandleScope() {
    const scope = new HandleScope(
      this, this.handleStore.nextId, this.currentScope)
    this.currentScope = scope
    return scope
  }

  closeHandleScope(scope) {
    if (scope !== this.currentScope) {
      throw new Error('mismatch scope')
    }
    this.currentScope = this.currentScope.parent
    scope.dispose()
  }

  toHandle(value) {
    switch (value) {
      case undefined: return ConstHandle.UNDEFINED
      case null: return ConstHandle.NULL
      case false: return ConstHandle.FALSE
      case true: return ConstHandle.TRUE
      case globalThis: return ConstHandle.GLOBAL
      default: break
    }
    const handle = this.handleStore.add(value)
    const currentScope = this.currentScope
    currentScope.collect(handle)
    return handle
  }
}
