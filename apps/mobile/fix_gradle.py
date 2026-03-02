import re

# Fix root build.gradle
with open("build.gradle", "r") as f:
    content = f.read()

content = re.sub(
    r"url\(new File\(\['node', '--print', \"require\.resolve\('react-native/package\.json'\)\"\]\.execute\(null, rootDir\)\.text\.trim\(\), '\.\./android'\)\)",
    'url(new File("/root/cashflow/apps/mobile/node_modules/react-native", "../android"))',
    content
)

content = re.sub(
    r"url\(new File\(\['node', '--print', \"require\.resolve\('jsc-android/package\.json', \{ paths: \[require\.resolve\('react-native/package\.json'\)\] \}\)\"\]\.execute\(null, rootDir\)\.text\.trim\(\), '\.\./dist'\)\)",
    'url(new File("/root/cashflow/apps/mobile/node_modules/jsc-android", "../dist"))',
    content
)

with open("build.gradle", "w") as f:
    f.write(content)

print("Fixed root build.gradle")

# Fix app/build.gradle
with open("app/build.gradle", "r") as f:
    content = f.read()

# Replace the react block
old_react = '''react {
    entryFile = file(["node", "-e", "require('expo/scripts/resolveAppEntry')", projectRoot, "android", "absolute"].execute(null, rootDir).text.trim())
    reactNativeDir = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()
    hermesCommand = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/sdks/hermesc/%OS-BIN%/hermesc"
    codegenDir = new File(["node", "--print", "require.resolve('@react-native/codegen/package.json', { paths: [require.resolve('react-native/package.json')] })"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()

    // Use Expo CLI to bundle the app, this ensures the Metro config
    // works correctly with Expo projects.
    cliFile = new File(["node", "--print", "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })"].execute(null, rootDir).text.trim())
    bundleCommand = "export:embed"
}'''

new_react = '''react {
    entryFile = file("../../App.tsx")
    reactNativeDir = file("../node_modules/react-native")
    hermesCommand = "../node_modules/react-native/sdks/hermesc/linux64-bin/hermesc"
    codegenDir = file("../node_modules/@react-native/codegen")
    cliFile = file("../node_modules/@expo/cli/build/bin/cli")
    bundleCommand = "export:embed"
}'''

content = content.replace(old_react, new_react)

with open("app/build.gradle", "w") as f:
    f.write(content)

print("Fixed app/build.gradle")
