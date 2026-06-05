package com.ebrimasamba.rnprompt

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = RNPromptModule.NAME)
class RNPromptModule(reactContext: ReactApplicationContext) :
  NativeRNPromptSpec(reactContext) {

  override fun getName(): String = NAME

  override fun showPrompt(options: ReadableMap, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Cannot show prompt: there is no current Activity.")
      return
    }

    // Parse everything off the calling thread; the dialog itself must be built
    // and shown on the UI thread.
    val title = options.stringOrEmpty("title")
    val message = options.stringOrEmpty("message")
    val type = if (options.hasKey("type") && !options.isNull("type")) {
      options.getString("type") ?: "plain-text"
    } else {
      "plain-text"
    }
    val defaultValue = options.stringOrEmpty("defaultValue")
    val placeholder = options.stringOrEmpty("placeholder")
    val passwordPlaceholder = options.stringOrEmpty("passwordPlaceholder")
    val tintColor = options.stringOrEmpty("tintColor")
    val buttons = parseButtons(options)

    UiThreadUtil.runOnUiThread {
      RNPromptDialog.show(
        context = activity,
        title = title,
        message = message,
        type = type,
        defaultValue = defaultValue,
        placeholder = placeholder,
        passwordPlaceholder = passwordPlaceholder,
        tintColor = tintColor,
        buttons = buttons,
        callback = object : RNPromptDialog.OnResult {
          override fun onResult(text: String, password: String, buttonIndex: Int) {
            val tapped = buttons.getOrNull(buttonIndex)
            // A cancel-styled button is treated as a dismissal, matching iOS.
            if (tapped?.style == "cancel") {
              promise.resolve(Arguments.createMap().apply { putBoolean("cancelled", true) })
              return
            }
            val result = Arguments.createMap().apply {
              putString("text", text)
              putString("password", password)
              putInt("buttonIndex", buttonIndex)
              putString("buttonText", tapped?.text ?: "")
            }
            promise.resolve(result)
          }
        },
      )
    }
  }

  private fun parseButtons(options: ReadableMap): List<RNPromptDialog.ButtonSpec> {
    if (!options.hasKey("buttons") || options.isNull("buttons")) return emptyList()
    val array = options.getArray("buttons") ?: return emptyList()
    val buttons = ArrayList<RNPromptDialog.ButtonSpec>(array.size())
    for (i in 0 until array.size()) {
      val map = array.getMap(i) ?: continue
      val text = map.stringOrEmpty("text")
      val style = if (map.hasKey("style") && !map.isNull("style")) {
        map.getString("style") ?: "default"
      } else {
        "default"
      }
      buttons.add(RNPromptDialog.ButtonSpec(text, style))
    }
    return buttons
  }

  private fun ReadableMap.stringOrEmpty(key: String): String =
    if (hasKey(key) && !isNull(key)) getString(key).orEmpty() else ""

  companion object {
    const val NAME = NativeRNPromptSpec.NAME
  }
}
