Pod::Spec.new do |s|
  s.name = 'NyloBackgroundResponse'
  s.version = '1.0.0'
  s.summary = 'Finite background time for an in-progress Nylo response'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Nylo'
  s.homepage = 'https://github.com/NihalKA/nylo'
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.source = { :git => 'https://github.com/NihalKA/nylo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
