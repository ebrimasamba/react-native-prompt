package com.ebrimasamba.rnprompt

import android.content.Context
import android.content.DialogInterface
import android.graphics.Color
import android.text.InputType
import android.util.TypedValue
import android.view.WindowManager
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AlertDialog

/**
 * Builds a native Android [AlertDialog] that mirrors the look and behaviour of
 * iOS `Alert.prompt`: a titled, non-cancelable modal with one or two text
 * inputs and up to three action buttons.
 *
 * Targets API 21+; no deprecated APIs are used.
 */
object RNPromptDialog {

  /** Style strings shared with the JS layer. */
  private const val STYLE_CANCEL = "cancel"
  private const val STYLE_DESTRUCTIVE = "destructive"

  /** Prompt types shared with the JS layer. */
  private const val TYPE_SECURE = "secure-text"
  private const val TYPE_LOGIN_PASSWORD = "login-password"

  /** iOS destructive red, so Android buttons match the iOS palette. */
  private val DESTRUCTIVE_COLOR = Color.parseColor("#FF3B30")

  /** A single dialog action button as described by JS. */
  data class ButtonSpec(val text: String, val style: String)

  /** Typed result delivered when the user taps any button. */
  fun interface OnResult {
    fun onResult(text: String, password: String, buttonIndex: Int)
  }

  fun show(
    context: Context,
    title: String,
    message: String,
    type: String,
    defaultValue: String,
    placeholder: String,
    passwordPlaceholder: String,
    tintColor: String,
    buttons: List<ButtonSpec>,
    callback: OnResult,
  ) {
    val horizontalPadding = dp(context, 16)
    val fieldSpacing = dp(context, 8)

    val container = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      // Standard Material dialog input padding: 16dp left/right.
      setPadding(horizontalPadding, 0, horizontalPadding, 0)
    }

    val textInput = EditText(context).apply {
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      )
    }
    val passwordInput = EditText(context)

    val isLoginPassword = type == TYPE_LOGIN_PASSWORD

    when (type) {
      TYPE_SECURE -> {
        textInput.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        if (placeholder.isNotEmpty()) textInput.hint = placeholder
        applyDefaultValue(textInput, defaultValue)
        container.addView(textInput)
      }

      TYPE_LOGIN_PASSWORD -> {
        // Username field.
        textInput.inputType = InputType.TYPE_CLASS_TEXT
        if (placeholder.isNotEmpty()) textInput.hint = placeholder
        applyDefaultValue(textInput, defaultValue)
        container.addView(textInput)

        // Password field, stacked beneath the username with a small gap.
        passwordInput.inputType =
          InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        if (passwordPlaceholder.isNotEmpty()) passwordInput.hint = passwordPlaceholder
        passwordInput.layoutParams = LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { topMargin = fieldSpacing }
        container.addView(passwordInput)
      }

      // "plain-text" and "default" both render a single text field.
      else -> {
        textInput.inputType = InputType.TYPE_CLASS_TEXT
        if (placeholder.isNotEmpty()) textInput.hint = placeholder
        applyDefaultValue(textInput, defaultValue)
        container.addView(textInput)
      }
    }

    val builder = AlertDialog.Builder(context)
      .setTitle(title)
      .setView(container)
      // Matches iOS: the alert cannot be dismissed by tapping outside.
      .setCancelable(false)

    if (message.isNotEmpty()) builder.setMessage(message)

    // Map the buttons list onto the three available dialog slots.
    // First "cancel"-styled button -> negative; first remaining -> positive;
    // next remaining -> neutral. The original index is reported back.
    var positiveIndex = -1
    var negativeIndex = -1
    var neutralIndex = -1
    buttons.forEachIndexed { index, button ->
      when {
        button.style == STYLE_CANCEL && negativeIndex == -1 -> negativeIndex = index
        positiveIndex == -1 -> positiveIndex = index
        neutralIndex == -1 -> neutralIndex = index
      }
    }

    val clickListener = { index: Int ->
      DialogInterface.OnClickListener { dialog, _ ->
        val text = textInput.text?.toString().orEmpty()
        val password = if (isLoginPassword) passwordInput.text?.toString().orEmpty() else ""
        callback.onResult(text, password, index)
        dialog.dismiss()
      }
    }

    if (positiveIndex >= 0) {
      builder.setPositiveButton(buttons[positiveIndex].text, clickListener(positiveIndex))
    }
    if (negativeIndex >= 0) {
      builder.setNegativeButton(buttons[negativeIndex].text, clickListener(negativeIndex))
    }
    if (neutralIndex >= 0) {
      builder.setNeutralButton(buttons[neutralIndex].text, clickListener(neutralIndex))
    }

    val dialog = builder.create()
    dialog.setCanceledOnTouchOutside(false)
    // Auto-focus the first input and surface the soft keyboard on open, matching
    // iOS Alert.prompt behaviour.
    textInput.requestFocus()
    dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE)
    dialog.show()

    // Button colors can only be applied once the dialog (and its buttons) exist.
    // "destructive" wins over the tint; tint applies to positive/neutral only.
    styleButton(dialog, AlertDialog.BUTTON_POSITIVE, buttons, positiveIndex, tintColor, tintable = true)
    styleButton(dialog, AlertDialog.BUTTON_NEUTRAL, buttons, neutralIndex, tintColor, tintable = true)
    styleButton(dialog, AlertDialog.BUTTON_NEGATIVE, buttons, negativeIndex, tintColor, tintable = false)
  }

  private fun applyDefaultValue(input: EditText, defaultValue: String) {
    if (defaultValue.isEmpty()) return
    input.setText(defaultValue)
    input.setSelection(defaultValue.length)
  }

  private fun styleButton(
    dialog: AlertDialog,
    which: Int,
    buttons: List<ButtonSpec>,
    index: Int,
    tintColor: String,
    tintable: Boolean,
  ) {
    if (index < 0) return
    val button = dialog.getButton(which) ?: return
    when {
      buttons[index].style == STYLE_DESTRUCTIVE -> button.setTextColor(DESTRUCTIVE_COLOR)
      tintable && tintColor.isNotEmpty() -> parseColorOrNull(tintColor)?.let(button::setTextColor)
    }
  }

  private fun parseColorOrNull(hex: String): Int? = try {
    Color.parseColor(hex)
  } catch (_: IllegalArgumentException) {
    null
  }

  private fun dp(context: Context, value: Int): Int = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP,
    value.toFloat(),
    context.resources.displayMetrics,
  ).toInt()
}
