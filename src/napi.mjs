// napi.mjs

export function createNapiModule (ctx) {
  let wasmExports
  let wasmMemory
  let wasmTable

  const textDecoder = new TextDecoder()

  function utf8ToString (ptr, length) {
    const HEAPU8 = new Uint8Array(wasmMemory.buffer)
    if (length === -1) {
      let len = 0
      while (HEAPU8[ptr + len] !== 0) len++
      return textDecoder.decode(
        new Uint8Array(wasmMemory.buffer, ptr, len))
    }
    return textDecoder.decode(
      new Uint8Array(wasmMemory.buffer, ptr, length))
  }

  function napi_create_function (
      env, utf8name, length, cb, data, result) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (!result || !cb) {
      return envObject.setLastError(1)
    }
    const name = utf8name ? utf8ToString(utf8name, length) : ''
    const f = function () {
      ctx.cbinfoStack.push(this, data, arguments, f);
      const scope = ctx.openHandleScope();
      try {
        return envObject.callIntoModule(function () {
          const napiValue = (wasmTable.get(cb))(envObject.id, 0);
          return (!napiValue)
            ? undefined
            : ctx.handleStore.get(napiValue).value;
        });
      }
      finally {
        ctx.cbinfoStack.pop();
        ctx.closeHandleScope(scope);
      }
    }
    if (name) {
      Object.defineProperty(f, 'name', { value: name })
    }
    const fid = ctx.toHandle(f).id
    new DataView(wasmMemory.buffer)
      .setInt32(result, fid, true)
    return envObject.clearLastError()
  }

  function napi_set_named_property (env, object, cname, value) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (envObject.lastException.hasCaught()) {
      return envObject.setLastError(10)
    }
    if (!object || !cname || !value) {
      return envObject.setLastError(1)
    }
    try {
      ctx.handleStore.get(object).value[
        utf8ToString(cname, -1)
      ] = ctx.handleStore.get(value).value
      return envObject.clearLastError()
    } catch (err) {
      envObject.lastException.setError(err)
      return envObject.setLastError(10)
    }
  }

  function napi_throw_error (env, code, msg) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (envObject.lastException.hasCaught()) {
      return envObject.setLastError(10)
    }
    if (!msg) {
      return envObject.setLastError(1)
    }
    const err = new Error(utf8ToString(msg, -1))
    if (code) {
      err.code = utf8ToString(code, -1)
    }
    envObject.lastException.setError(err)
    return envObject.clearLastError()
  }

  function napi_get_cb_info (env, _, argc, argv, this_arg, data) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    const cbinfoValue = ctx.cbinfoStack.current
    const HEAP_DATA_VIEW = new DataView(wasmMemory.buffer)
    if (argv) {
      if (!argc) return envObject.setLastError(1)
      const argcValue = HEAP_DATA_VIEW.getUint32(argc, true)
      const len = cbinfoValue.args.length
      const arrlen = argcValue < len ? argcValue : len
      let i = 0
      for (; i < arrlen; i++) {
        const argVal = ctx.toHandle(cbinfoValue.args[i]).id
        HEAP_DATA_VIEW.setInt32(argv + i * 4, argVal, true)
      }
      if (i < argcValue) {
        for (; i < argcValue; i++) {
          HEAP_DATA_VIEW.setInt32(argv + i * 4, 1, true)
        }
      }
    }
    if (argc) {
      HEAP_DATA_VIEW.setUint32(argc, cbinfoValue.args.length, true)
    }
    if (this_arg) {
      const v = ctx.toHandle(cbinfoValue.thiz).id
      HEAP_DATA_VIEW.setInt32(this_arg, v, true)
    }
    if (data) {
      HEAP_DATA_VIEW.setInt32(data, cbinfoValue.data, true)
    }
    return envObject.clearLastError()
  }

  function napi_is_array (env, value, result) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (!value || !result) {
      return envObject.setLastError(1)
    }
    const h = ctx.handleStore.get(value)
    const r = Array.isArray(h.value) ? 1 : 0
    new DataView(wasmMemory.buffer)
      .setInt8(result, r, true)
    return envObject.clearLastError()
  }

  function napi_get_array_length (env, value, result) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (!value || !result) {
      return envObject.setLastError(1)
    }
    const h = ctx.handleStore.get(value)
    if (!Array.isArray(h.value)) {
      return envObject.setLastError(8)
    }
    new DataView(wasmMemory.buffer)
      .setInt32(result, h.value.length >>> 0, true)
    return envObject.clearLastError()
  }

  function napi_get_value_uint32 (env, value, result) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (!value || !result) {
      return envObject.setLastError(1)
    }
    const h = ctx.handleStore.get(value)
    if (typeof h.value !== 'number') {
      return envObject.setLastError(6)
    }
    new DataView(wasmMemory.buffer)
      .setUint32(result, h.value, true)
    return envObject.clearLastError()
  }

  function napi_create_uint32 (env, value, result) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (!result) {
      return envObject.setLastError(1)
    }
    const id = ctx.toHandle(value >>> 0).id
    new DataView(wasmMemory.buffer)
      .setInt32(result, id, true)
    return envObject.clearLastError()
  }
  
  function napi_set_element (env, object, index, value) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (envObject.lastException.hasCaught()) {
      return envObject.setLastError(10)
    }
    if (!object || !value) {
      return envObject.setLastError(1)
    }
    try {
      ctx.handleStore.get(object).value[index] =
        ctx.handleStore.get(value).value
      return envObject.clearLastError()
    } catch (err) {
      envObject.lastException.setError(err)
      return envObject.setLastError(10)
    }
  }

  function napi_get_element (env, object, index, result) {
    if (!env) return 1
    const envObject = ctx.envStore.get(env)
    if (envObject.lastException.hasCaught()) {
      return envObject.setLastError(10)
    }
    if (!object || !result) {
      return envObject.setLastError(1)
    }
    try {
      const value = ctx.handleStore.get(object)
        .value[index >>> 0]
      const id = ctx.toHandle(value).id
      new DataView(wasmMemory.buffer)
      .setInt32(result, id, true)
      return envObject.clearLastError()
    } catch (err) {
      envObject.lastException.setError(err)
      return envObject.setLastError(10)
    }
  }

  function init (options) {
    if (napiModule.loaded) return napiModule.exports
    const instance = options.instance

    const exports = instance.exports
    const memory = options.memory ||
      exports.memory
    const table = options.table ||
      exports.__indirect_function_table

    wasmExports = exports
    wasmMemory = memory
    wasmTable = table

    const envObject = ctx.createEnv()
    const scope = ctx.openHandleScope()
    try {
      envObject.callIntoModule(function () {
        const exports = napiModule.exports
        const exportsHandle = ctx.toHandle(exports)
        const napiValue = wasmExports
          .napi_register_wasm_v1(envObject.id,
                                 exportsHandle.id)
        napiModule.exports = !napiValue
          ? exports
          : ctx.handleStore.get(napiValue).value
      })
    } finally {
      ctx.closeHandleScope(scope)
    }
    napiModule.loaded = true
    return napiModule.exports
  }

  const napiModule = {
    imports: {
      napi: {
        napi_create_function,
        napi_set_named_property,
        napi_throw_error,
        napi_get_cb_info,
        napi_is_array,
        napi_get_array_length,
        napi_get_value_uint32,
        napi_create_uint32,
        napi_set_element,
        napi_get_element
      }
    },
    exports: {},
    loaded: false,
    init
  }

  return napiModule
}
