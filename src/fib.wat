;; src/fib.wat

(module
  (import "env" "print"
    (func $print (param i32)))
  (func $fib (export "fib")
      (param $n i32) (result i32)
    (local $tmp i32)

    local.get $n
    i32.const 2
    i32.lt_s
    if
      local.get $n
      return
    end

    local.get $n
    i32.const 1
    i32.sub
    call $fib
    local.set $tmp

    local.get $n
    i32.const 2
    i32.sub
    call $fib
    local.get $tmp
    i32.add
    return
  )
  (func $calc_fib_then_print
      (export "calc_fib_then_print")
      (result i32)
    (local $tmp i32)
    i32.const 10
    call $fib
    local.tee $tmp
    call $print
    local.get $tmp
    return
  )
)
