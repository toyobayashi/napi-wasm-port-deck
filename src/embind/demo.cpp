#include <emscripten/bind.h>

emscripten::val
FillFibArray(emscripten::val array) {
  if (!array.isArray()) {
    emscripten::val::global("Error")
      .new_(emscripten::val("arguments[0] is not an array"))
      .throw_();
  }

  uint32_t len = array["length"].as<uint32_t>();

  for (uint32_t i = 0; i < len; ++i) {
    if (i < 2) {
      array.set(i, emscripten::val(i));
      continue;
    }
    array.set(i,
              emscripten::val(
                array[i - 1].as<uint32_t>() +
                array[i - 2].as<uint32_t>()
              ));
  }

  return array;
}

EMSCRIPTEN_BINDINGS(demo_embind) {
  emscripten::function("fillFibArray", FillFibArray);
}
