#!/usr/bin/env bash

set -e

wat2wasm -o ./src/fib.wasm ./src/fib.wat
wat2wasm -o ./src/str.wasm ./src/str.wat

clang="$WASI_SDK_PATH/bin/clang"

"$clang" -g -o ./src/fib_c.wasm \
      --target=wasm32-unknown-unknown \
      -nostdlib ./src/fib.c \
      -Wl,--import-undefined,--export-dynamic,--no-entry

"$clang" -g -o ./src/str_c.wasm \
      --target=wasm32-unknown-unknown \
      -nostdlib ./src/str.c \
      -Wl,--import-undefined,--export-table,--export-memory,--export-dynamic,--no-entry

__dirname=$(cd `dirname $0`;pwd)

node_include=$__dirname/node_modules/emnapi/include
node_link=$__dirname/node_modules/emnapi/lib/wasm32

"$clang" -g -o ./src/demo_emnapi.wasm \
      --target=wasm32-unknown-unknown \
      -I"$node_include" \
      -L"$node_link" \
      -nostdlib ./src/demo.c \
      -ldlmalloc -lemnapi \
      -Wl,--import-undefined,--export-dynamic,--export-table,--export-memory,--export=malloc,--export=free,--no-entry

node-gyp rebuild

"$clang" -g -o ./src/demo_pure.wasm \
      --target=wasm32-unknown-unknown \
      -I"$node_include" \
      -nostdlib ./src/demo.c \
      -Wl,--import-undefined,--export-dynamic,--export-table,--no-entry

em++ -g -o ./src/embind/demo.mjs -lembind ./src/embind/demo.cpp
