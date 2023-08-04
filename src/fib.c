#define WASM_EXPORT \
  __attribute__((visibility("default")))

#define WASM_IMPORT(mod, name) \
  __attribute__((import_module((mod)))) \
  __attribute__((import_name((name))))

WASM_IMPORT("env", "print")
void print(int n);

WASM_EXPORT
int fib(int n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}

WASM_EXPORT
int calc_fib_then_print(int n) {
  int tmp = fib(n);
  print(tmp);
  return tmp;
}
