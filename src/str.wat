(module
  (import "env" "print_str"
    (func $print_str (param i32)))
  (memory (export "memory") 1) ;; 65536 Bytes
  (data (i32.const 1024) "hello world\00")
  (func $print_hello_world
      (export "print_hello_world")
      (result i32)
    i32.const 1024
    call $print_str
    i32.const 1
    return
  )
  (table (export "__indirect_function_table")
    2 funcref)
  (elem (i32.const 1) $print_hello_world)
)
