package expo.modules.nylodocumentpreview
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
class NyloDocumentPreviewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NyloDocumentPreview")
    View(NyloPdfView::class) {
      Prop("uri") { view: NyloPdfView, uri: String -> view.open(uri) }
      OnViewDestroys { view: NyloPdfView -> view.dispose() }
    }
  }
}
