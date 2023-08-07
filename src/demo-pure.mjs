import { RuntimeContext } from './runtime.mjs'
import { createNapiModule } from './napi.mjs'
import { main as demoMain } from './demo-main.mjs'

async function main() {
  let buffer
  const url = new URL('./demo_pure.wasm', import.meta.url)
  if (typeof window !== 'undefined') {
    const response = await fetch(url)
    buffer = await response.arrayBuffer()
  } else {
    const { readFile } = await import('fs/promises')
    buffer = await readFile(url)
  }
  const napiModule = createNapiModule(new RuntimeContext())
  const { instance, module } = await WebAssembly.instantiate(
    buffer,
    {
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
