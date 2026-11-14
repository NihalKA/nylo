package expo.modules.nylobackgroundresponse

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager

/** Only protects requests already initiated by the user; never restarts/replays work. */
internal object ResponseExecution {
  const val MAX_DURATION = 600_000L
  val leases = ResponseLeases()
  private val handler = Handler(Looper.getMainLooper())
  private val deadlines = mutableMapOf<String, Runnable>()
  var service: NyloResponseService? = null

  fun begin(context: Context, token: String, ready: (Boolean) -> Unit, expired: () -> Unit) {
    if (!leases.add(token, ready, expired)) {
      ready(false)
      return
    }
    val deadline = Runnable {
      deadlines.remove(token)
      leases.expire(token)
      settle()
    }
    deadlines[token] = deadline
    handler.postDelayed(deadline, MAX_DURATION)
    try {
      val running = service
      if (running != null) running.refresh()
      else {
        val intent = Intent(context, NyloResponseService::class.java)
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent)
        else context.startService(intent)
      }
    } catch (_: Exception) {
      // OS denied startup: foreground response is still usable; no fake grant.
      release(token)
    }
  }

  fun release(token: String) {
    deadlines.remove(token)?.let { handler.removeCallbacks(it) }
    leases.release(token)
    settle()
  }

  fun expireAll(owner: NyloResponseService) {
    if (service !== owner) return
    service = null
    for (deadline in deadlines.values) handler.removeCallbacks(deadline)
    deadlines.clear()
    for (token in leases.tokens) leases.expire(token)
  }

  fun settle() {
    val running = service ?: return
    if (leases.size == 0) {
      service = null
      running.finish()
    } else {
      try { running.refresh() }
      catch (_: Exception) {
        expireAll(running)
        running.finish()
      }
    }
  }
}

class NyloResponseService : Service() {
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    ResponseExecution.service = this
    try {
      // Promote even if Stop raced startup, fulfilling Android's startup contract.
      refresh()
      ResponseExecution.settle()
    } catch (_: Exception) {
      ResponseExecution.expireAll(this)
      finish()
    }
    return START_NOT_STICKY
  }

  internal fun refresh() {
    val manager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= 26) {
      manager.createNotificationChannel(NotificationChannel(
        CHANNEL, "In-progress responses", NotificationManager.IMPORTANCE_LOW
      ).apply { description = "Keeps your current responses running when you leave Nylo" })
    }
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val notification = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL)
      else Notification.Builder(this))
      .setSmallIcon(android.R.drawable.stat_notify_sync)
      .setContentTitle("Nylo is responding")
      .setContentText("Finishing your current responses. Return to Nylo to view or stop them.")
      .setCategory(Notification.CATEGORY_PROGRESS)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .apply {
        if (launch != null) setContentIntent(PendingIntent.getActivity(
          this@NyloResponseService, 0, launch,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        ))
      }.build()
    if (Build.VERSION.SDK_INT >= 29)
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
    else startForeground(NOTIFICATION_ID, notification)
    if (ResponseExecution.leases.size > 0) {
      val lock = wakeLock ?: (getSystemService(POWER_SERVICE) as PowerManager)
        .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "$packageName:response")
        .apply { setReferenceCounted(false) }.also { wakeLock = it }
      lock.acquire(ResponseExecution.MAX_DURATION)
      ResponseExecution.leases.grant()
    }
  }

  internal fun finish() {
    if (wakeLock?.isHeld == true) wakeLock?.release()
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  // Android 15+ enforces its own aggregate dataSync time budget as well.
  override fun onTimeout(startId: Int, fgsType: Int) {
    ResponseExecution.expireAll(this)
    finish()
  }

  override fun onDestroy() {
    ResponseExecution.expireAll(this)
    if (wakeLock?.isHeld == true) wakeLock?.release()
    super.onDestroy()
  }

  companion object {
    private const val CHANNEL = "nylo-responses"
    private const val NOTIFICATION_ID = 4126
  }
}
