const KEY = 'wish-a-list:friend-name'

// localStorage can throw (private mode, storage disabled); the name is only a convenience.

/** The name the friend last reserved with, or '' when there is none. */
export function loadFriendName() {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveFriendName(name) {
  try {
    localStorage.setItem(KEY, name.trim())
  } catch {
    // Not remembering the name is fine.
  }
}
