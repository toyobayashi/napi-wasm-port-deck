#!/usr/bin/env node

async function main() {
  let buffer
  const url = new URL('./str.wasm', import.meta.url)
  if (typeof window !== 'undefined') {
    const response = await fetch(url)
    buffer = await response.arrayBuffer()
  } else {
    const { readFile } = await import('fs/promises')
    buffer = await readFile(url)
  }
  const { instance } = await WebAssembly.instantiate(
    buffer,
    {
      env: {
        print_str (i32) {
          const HEAPU8 = new Uint8Array(memory.buffer)
          let len = 0
          while (HEAPU8[i32 + len] !== 0) len++
          var strBuffer = new Uint8Array(memory.buffer, i32, len)
          var str = new TextDecoder().decode(strBuffer)
          console.log(str)
        }
      }
    }
  )
  const {
    memory, __indirect_function_table,
    print_hello_world
  } = instance.exports
  const fp = print_hello_world()
  const fp2 = __indirect_function_table.get(fp)()
  console.log(fp === 1)
  console.log(fp === fp2)
}

main()
