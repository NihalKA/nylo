package expo.modules.nylobackgroundresponse

/** Main-thread response ownership, independent of Android for race regression tests. */
internal class ResponseLeases {
  private class Lease(val ready: (Boolean) -> Unit, val expired: () -> Unit) {
    var answered = false
    fun answer(value: Boolean) {
      if (answered) return
      answered = true
      ready(value)
    }
  }
  private val leases = linkedMapOf<String, Lease>()
  val tokens: List<String> get() = leases.keys.toList()
  val size: Int get() = leases.size

  fun add(token: String, ready: (Boolean) -> Unit, expired: () -> Unit): Boolean {
    if (leases.containsKey(token)) return false
    leases[token] = Lease(ready, expired)
    return true
  }

  fun grant() {
    for (token in tokens) leases[token]?.answer(true)
  }

  fun release(token: String) {
    leases.remove(token)?.answer(false)
  }

  fun expire(token: String) {
    val lease = leases.remove(token) ?: return
    lease.answer(false)
    lease.expired()
  }
}
