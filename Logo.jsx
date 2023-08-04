import * as React from 'react'
import wasm from './assets/wasm.svg'

import nodejs from './assets/nodejs.png'

const style = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '40%'
}

export default function () {
  return (
    <div style={style}>
      <img src={nodejs} alt='webpack' width={250} />
      <img src={wasm} alt='wasm' width={200} />
    </div>
  )
}
