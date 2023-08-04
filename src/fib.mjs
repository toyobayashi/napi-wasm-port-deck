#!/usr/bin/env node

async function main() {
  let buffer
  const url = new URL('./fib_c.wasm', import.meta.url)
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
        print (i32) {
          console.log(i32)
        }
      }
    }
  )
  const {
    fib, calc_fib_then_print
  } = instance.exports
  const a = fib(10)
  const b = calc_fib_then_print(10)
  console.log(a === b)
  console.log(`log result from JS: ${a}`)
}

main()
