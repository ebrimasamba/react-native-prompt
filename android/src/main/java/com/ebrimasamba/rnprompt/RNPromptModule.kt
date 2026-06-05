package com.ebrimasamba.rnprompt

import com.facebook.react.bridge.ReactApplicationContext

class RNPromptModule(reactContext: ReactApplicationContext) :
  NativeRNPromptSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeRNPromptSpec.NAME
  }
}
