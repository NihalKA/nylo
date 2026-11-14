package expo.modules.nylobackgroundresponse

import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NyloBackgroundResponseModule : Module() {
  private val owned = mutableSetOf<String>()

  override fun definition() = ModuleDefinition {
    Name("NyloBackgroundResponse")
    Events("expired")

    AsyncFunction("begin") { token: String, promise: Promise ->
      val context = appContext.reactContext?.applicationContext
      if (context == null || !owned.add(token)) {
        promise.resolve(false)
      } else {
        ResponseExecution.begin(context, token, { granted ->
          if (!granted) owned.remove(token)
          promise.resolve(granted)
        }, {
          owned.remove(token)
          sendEvent("expired", mapOf("token" to token))
        })
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("end") { token: String ->
      // A stale module must never release another module's response.
      if (owned.remove(token)) ResponseExecution.release(token)
    }.runOnQueue(Queues.MAIN)

    OnDestroy {
      Handler(Looper.getMainLooper()).post {
        for (token in owned.toList()) ResponseExecution.release(token)
        owned.clear()
      }
    }
  }
}
