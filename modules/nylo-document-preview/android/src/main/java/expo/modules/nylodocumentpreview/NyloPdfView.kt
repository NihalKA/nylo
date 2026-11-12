package expo.modules.nylodocumentpreview

import android.content.Context
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import android.os.ParcelFileDescriptor
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.pdf.PdfRenderer
import android.view.View
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.HorizontalScrollView
import android.widget.ScrollView
import android.widget.TextView
import java.io.File

class NyloPdfView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  override val shouldUseAndroidLayout = true
  private var document: PdfRenderer? = null
  private var descriptor: ParcelFileDescriptor? = null
  private var file: File? = null
  private var pages: PDFPages? = null
  private var resizePaper: ((Int) -> Unit)? = null
  fun open(uri: String) {
    if (file != null && file?.canonicalPath == runCatching { File(java.net.URI(uri)).canonicalPath }.getOrNull()) return
    dispose()
    removeAllViews()
    try {
      val source = File(java.net.URI(uri)).canonicalFile
      require(source.parentFile?.name?.startsWith("nylo-preview-") == true && source.parentFile?.parentFile == context.cacheDir.canonicalFile && source.extension.lowercase() == "pdf")
      file = source
      descriptor = ParcelFileDescriptor.open(source, ParcelFileDescriptor.MODE_READ_ONLY)
      val renderer = PdfRenderer(descriptor!!)
      document = renderer
      require(renderer.pageCount in 1..500)
      val root = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(Color.WHITE); fitsSystemWindows = true }
      val header = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(12, 8, 12, 8) }
      header.addView(TextView(context).apply { text = "${renderer.pageCount} ${if (renderer.pageCount == 1) "page" else "pages"}"; setTextColor(Color.BLACK); textSize = 16f }, LinearLayout.LayoutParams(0, -2, 1f))
      var baseWidth = width.takeIf { it > 0 } ?: resources.displayMetrics.widthPixels
      pages = PDFPages(renderer, baseWidth)
      val vertical = ScrollView(context).apply { addView(pages); setOnScrollChangeListener { _, _, _, _, _ -> pages?.invalidate() } }
      var zoomed = false
      header.addView(Button(context).apply {
        text = "Zoom in"
        setOnClickListener {
          zoomed = !zoomed
          text = if (zoomed) "Zoom out" else "Zoom in"
          pages?.setPaperWidth(baseWidth * if (zoomed) 2 else 1, baseWidth)
        }
      })
      resizePaper = { available ->
        if (available > 0) {
          baseWidth = available
          val paperWidth = baseWidth * if (zoomed) 2 else 1
          pages?.setPaperWidth(paperWidth, baseWidth)
        }
      }
      root.addView(header)
      root.addView(HorizontalScrollView(context).apply {
        addView(vertical, android.widget.FrameLayout.LayoutParams(-2, -1))
        setOnScrollChangeListener { _, _, _, _, _ -> pages?.invalidate() }
      }, LinearLayout.LayoutParams(-1, 0, 1f))
      addView(root, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    } catch (_: Exception) {
      addView(TextView(context).apply { text = "This PDF could not be opened. Save or share is still available." })
    }
  }
  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    resizePaper?.invoke(w)
  }
  fun dispose() {
    resizePaper = null
    pages?.clear(); pages = null
    document?.close(); document = null
    descriptor?.close(); descriptor = null
    file?.parentFile?.deleteRecursively(); file = null
  }
  private inner class PDFPages(private val renderer: PdfRenderer, initialWidth: Int) : View(context) {
    private var paperWidth = initialWidth
    private var viewportWidth = initialWidth
    fun setPaperWidth(value: Int, viewport: Int) {
      viewportWidth = viewport
      if (paperWidth == value) return
      paperWidth = value.coerceAtLeast(1)
      clear()
      requestLayout()
      invalidate()
    }
    private val ratios = (0 until renderer.pageCount).map { index -> renderer.openPage(index).use { it.height.toFloat() / it.width } }
    private var offsets = FloatArray(renderer.pageCount + 1)
    private val cache = linkedMapOf<Int, Bitmap>()
    private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
    init { contentDescription = "PDF document, ${renderer.pageCount} ${if (renderer.pageCount == 1) "page" else "pages"}. Scroll to read." }
    override fun onMeasure(widthSpec: Int, heightSpec: Int) {
      // HorizontalScrollView measures content with UNSPECIFIED width. Use
      // the requested paper width, rather than that parent's width hint.
      val w = paperWidth.coerceAtLeast(1)
      offsets = FloatArray(renderer.pageCount + 1)
      for (i in ratios.indices) offsets[i+1] = offsets[i] + w * ratios[i] + 12
      setMeasuredDimension(w, offsets.last().toInt())
      contentDescription = "PDF document, ${renderer.pageCount} ${if (renderer.pageCount == 1) "page" else "pages"}, zoom ${w * 100 / viewportWidth.coerceAtLeast(1)} percent"
    }
    override fun onDraw(canvas: Canvas) {
      super.onDraw(canvas)
      val visible = Rect(); getLocalVisibleRect(visible)
      val shown = ratios.indices.filter { offsets[it+1] >= visible.top && offsets[it] <= visible.bottom }
      for (key in cache.keys.toList()) if (key !in shown) cache.remove(key)?.recycle()
      for (index in shown) {
        val bitmap = cache[index] ?: renderer.openPage(index).use { page ->
          val w = minOf(width, 1600, (2048 / ratios[index]).toInt().coerceAtLeast(1)).coerceAtLeast(1)
          Bitmap.createBitmap(w, (w * ratios[index]).toInt().coerceIn(1, 2048), Bitmap.Config.ARGB_8888).also { image ->
            image.eraseColor(Color.WHITE); page.render(image, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY); cache[index] = image
          }
        }
        canvas.drawBitmap(bitmap, null, android.graphics.RectF(0f, offsets[index], width.toFloat(), offsets[index+1]-12), paint)
      }
    }
    fun clear() { cache.values.forEach { it.recycle() }; cache.clear() }
  }
}
