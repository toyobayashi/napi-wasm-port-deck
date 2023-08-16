#!/usr/bin/env node

import init from './demo.mjs'

init().then((Module) => {
  console.log(Module.fillFibArray(Array(10)))
  try {
    Module.fillFibArray({})
  } catch (err) {
    console.error(err.message)
  }
})
