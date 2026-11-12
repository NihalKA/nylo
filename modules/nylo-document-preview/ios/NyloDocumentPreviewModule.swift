import ExpoModulesCore
import QuickLook

private final class LocalPDFPreview: QLPreviewController, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  let file: URL
  init(file: URL) {
    self.file = file
    super.init(nibName: nil, bundle: nil)
    dataSource = self
    delegate = self
  }
  required init?(coder: NSCoder) { fatalError("Not supported") }
  func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { file as NSURL }
  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    try? FileManager.default.removeItem(at: file.deletingLastPathComponent())
  }
}

public final class NyloDocumentPreviewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NyloDocumentPreview")
    AsyncFunction("openPdf") { (uri: String) in
      guard let raw = URL(string: uri), raw.isFileURL else { throw NSError(domain: "NyloPreview", code: 1) }
      let file = raw.standardizedFileURL.resolvingSymlinksInPath()
      let cache = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].standardizedFileURL.resolvingSymlinksInPath()
      guard file.pathExtension.lowercased() == "pdf",
            file.deletingLastPathComponent().lastPathComponent.hasPrefix("nylo-preview-"),
            file.deletingLastPathComponent().deletingLastPathComponent().path == cache.path,
            FileManager.default.fileExists(atPath: file.path),
            let presenter = self.appContext?.utilities?.currentViewController(),
            presenter.presentedViewController == nil else { throw NSError(domain: "NyloPreview", code: 2) }
      presenter.present(LocalPDFPreview(file: file), animated: true)
    }.runOnQueue(.main)
  }
}
