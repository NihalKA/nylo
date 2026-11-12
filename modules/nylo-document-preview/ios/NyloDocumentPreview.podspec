Pod::Spec.new do |s|
  s.name = 'NyloDocumentPreview'
  s.version = '1.0.0'
  s.summary = 'Local in-app PDF preview'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Nylo'
  s.homepage = 'https://github.com/NihalKA/nylo'
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.source = { :git => 'https://github.com/NihalKA/nylo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'QuickLook'
  s.source_files = '**/*.swift'
end
