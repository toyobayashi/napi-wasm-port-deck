#!/usr/bin/env node

import { createNapiModule } from '@emnapi/core'
import { getDefaultContext } from '@emnapi/runtime'
import { main as demoMain } from './demo-main.mjs'

async function main() {
  let buffer
  const url = new URL('./demo_emnapi.wasm', import.meta.url)
  if (typeof window !== 'undefined') {
    const response = await fetch(url)
    buffer = await response.arrayBuffer()
  } else {
    const { readFile } = await import('fs/promises')
    buffer = await readFile(url)
  }
  const napiModule = createNapiModule({
    context: getDefaultContext()
  })
  const { instance, module } = await WebAssembly.instantiate(
    buffer,
    {
      emnapi: napiModule.imports.emnapi,
      env: napiModule.imports.env,
      napi: napiModule.imports.napi
    }
  )
  const moduleExports = napiModule.init({
    instance,
    module,
    memory: instance.exports.memory,
    table: instance.exports.__indirect_function_table
  })
  
  demoMain(moduleExports)
}

main()

