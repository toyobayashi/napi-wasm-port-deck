export function main (moduleExports) {
  const { fillFibArray } = moduleExports
  
  console.log(fillFibArray(Array(10)))
  console.log(fillFibArray(Array(10), 5))

  try {
    fillFibArray(Array(10), 11)
  } catch (err) {
    console.error(err.message)
  }

  try {
    fillFibArray(Array(10), {})
  } catch (err) {
    console.error(err.message)
  }
}
