package com.prompt

import com.facebook.react.bridge.ReactApplicationContext

class PromptModule(reactContext: ReactApplicationContext) :
  NativePromptSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativePromptSpec.NAME
  }
}
