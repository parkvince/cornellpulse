// tsx asks Windows for the account name only to create a temporary directory.
// Some restricted CI hosts deny that OS call; provide a fixed, non-sensitive fallback.
const os = require("node:os")
const originalUserInfo = os.userInfo
os.userInfo = function safeUserInfo(...args) {
  try {
    return originalUserInfo.apply(os, args)
  } catch {
    return { uid: -1, gid: -1, username: "cornellpulse-ci", homedir: os.tmpdir(), shell: null }
  }
}
