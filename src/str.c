#define WASM_EXPORT \
  __attribute__((visibility("default")))

#define WASM_IMPORT(mod, name) \
  __attribute__((import_module((mod)))) \
  __attribute__((import_name((name))))

WASM_IMPORT("env", "print_str")
void print_str(const char* str);

WASM_EXPORT
void* print_hello_world() {
  print_str("hello world");
  return print_hello_world;
}
