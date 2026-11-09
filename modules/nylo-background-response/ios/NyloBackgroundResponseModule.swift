import ExpoModulesCore
import UIKit

public final class NyloBackgroundResponseModule: Module {
  private var tasks: [String: UIBackgroundTaskIdentifier] = [:]

  public func definition() -> ModuleDefinition {
    Name("NyloBackgroundResponse")
    Events("expired")

    AsyncFunction("begin") { (token: String) -> Bool in
      guard self.tasks[token] == nil else { return false }
      let task = UIApplication.shared.beginBackgroundTask(withName: "Nylo response") { [weak self] in
        guard let self else { return }
        // End the native task immediately; JS may be suspended before it runs.
        self.end(token)
        self.sendEvent("expired", ["token": token])
      }
      guard task != .invalid else { return false }
      self.tasks[token] = task
      NSLog("[NyloBackgroundResponse] began active=%lu", self.tasks.count)
      return true
    }.runOnQueue(.main)

    AsyncFunction("end") { (token: String) in
      self.end(token)
    }.runOnQueue(.main)

    OnDestroy {
      DispatchQueue.main.async { [self] in
        for token in Array(tasks.keys) { end(token) }
      }
    }
  }

  private func end(_ token: String) {
    guard let task = tasks.removeValue(forKey: token) else { return }
    UIApplication.shared.endBackgroundTask(task)
    NSLog("[NyloBackgroundResponse] ended active=%lu", tasks.count)
  }
}
