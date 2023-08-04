#include <node_api.h>

#define SAFE_CALL(env, status, msg) \
  do { \
    if ((status) != napi_ok) { \
      napi_throw_error(env, NULL, msg); \
      return NULL; \
    } \
  } while (0)

static napi_value js_fill_fib_array(
    napi_env env, napi_callback_info info) {
  size_t argc = 2; // 最多接收两个参数
  napi_value argv[2]; // 参数数组

  SAFE_CALL(env,
    napi_get_cb_info(env, info, &argc, argv, NULL, NULL),
    "napi_get_cb_info failed");

  // 校验参数类型
  bool is_arr = false;
  SAFE_CALL(env,
    napi_is_array(env, argv[0], &is_arr),
    "napi_is_array failed");
  if (!is_arr) {
    napi_throw_type_error(env, NULL,
      "arguments[0] is not an array");
    return NULL;
  }

  // 获取数组长度
  uint32_t arr_len = 0;
  SAFE_CALL(env,
    napi_get_array_length(env, argv[0], &arr_len),
    "napi_get_array_length failed");

  // 获取可选参数指定的填充长度
  uint32_t len = arr_len;
  if (argc == 2) {
    napi_valuetype arg1_type;
    SAFE_CALL(env,
      napi_typeof(env, argv[1], &arg1_type),
      "napi_typeof failed");
    if (arg1_type != napi_number) {
      napi_throw_type_error(env, NULL,
        "arguments[1] is not number");
      return NULL;
    }
    SAFE_CALL(env,
      napi_get_value_uint32(env, argv[1], &len),
      "napi_get_value_uint32 failed");
    if (len > arr_len) {
      napi_throw_type_error(env, NULL,
        "arguments[1] is too big");
    }
  }

  // 填充数组
  napi_value tmp_el = NULL;
  napi_value js_value_a, js_value_b;
  uint32_t a, b;
  for (uint32_t i = 0; i < len; ++i) {
    if (i < 2) {
      SAFE_CALL(env,
        napi_create_uint32(env, (uint32_t) i, &tmp_el),
        "napi_create_uint32 failed");
      SAFE_CALL(env,
        napi_set_element(env, argv[0], i, tmp_el),
        "napi_set_element failed");
      continue;
    }
    SAFE_CALL(env,
      napi_get_element(env, argv[0], i - 2, &js_value_a),
      "napi_get_element failed");
    SAFE_CALL(env,
      napi_get_element(env, argv[0], i - 1, &js_value_b),
      "napi_get_element failed");
    SAFE_CALL(env,
      napi_get_value_uint32(env, js_value_a, &a),
      "napi_get_value_uint32 failed");
    SAFE_CALL(env,
      napi_get_value_uint32(env, js_value_b, &b),
      "napi_get_value_uint32 failed");
    SAFE_CALL(env,
      napi_create_uint32(env, a + b, &tmp_el),
      "napi_create_uint32 failed");
    SAFE_CALL(env,
      napi_set_element(env, argv[0], i, tmp_el),
      "napi_set_element failed");
  }

  return argv[0];
}

#ifdef __cplusplus
#define EXTERN_C_MACRO extern "C"
#else
#define EXTERN_C_MACRO
#endif

#ifdef _WIN32
#define EXPORT __declspec(dllexport)
#else
#define EXPORT __attribute__((visibility("default")))
#endif

#ifdef __wasm__
#define EXPORT_REGISTER_SYMBOL_NAME napi_register_wasm_v1
#else
#define EXPORT_REGISTER_SYMBOL_NAME napi_register_module_v1
#endif

EXTERN_C_MACRO EXPORT
napi_value EXPORT_REGISTER_SYMBOL_NAME(
    napi_env env, napi_value exports) {
  napi_value fill_fib_array_fn = NULL;
  napi_status r = napi_create_function(env,
    "fillFibArray", NAPI_AUTO_LENGTH,
    js_fill_fib_array, NULL, &fill_fib_array_fn);
  if (r != napi_ok) {
    napi_throw_error(env, NULL,
      "napi_create_function failed");
    return exports;
  }
  r = napi_set_named_property(
    env, exports, "fillFibArray", fill_fib_array_fn);
  if (r != napi_ok) {
    napi_throw_error(env, NULL,
      "napi_set_named_property failed");
    return exports;
  }
  return exports;
}
