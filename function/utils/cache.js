// 获取、 设置、删除 Session
function getSession(name) {
  if (!name) return
  return window.sessionStorage.getItem(name)
}
function setSession(name, content) {
  if (!name) return
  if (typeof content !== 'string') {
    content = JSON.stringify(content)
  }
  window.sessionStorage.setItem(name, content)
}
function removeSession(name) {
  if (!name) return
  window.sessionStorage.removeItem(name)
}
// 获取、 设置、删除 local
function getLocal(name) {
  if (!name) return
  return window.localStorage.getItem(name)
}
function setLocal(name, content) {
  if (!name) return
  if (typeof content !== 'string') {
    content = JSON.stringify(content)
  }
  window.localStorage.setItem(name, content)
}
function removeLocal(name) {
  if (!name) return
  window.localStorage.removeItem(name)
}

export {
  getSession,
  setSession,
  removeSession,
  getLocal,
  setLocal,
  removeLocal,
}
