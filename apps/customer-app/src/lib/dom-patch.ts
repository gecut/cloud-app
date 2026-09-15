/**
 * Patch DOM methods to protect React 19 / TanStack Router from Google Translate,
 * browser extensions, and third-party DOM mutations that cause:
 * "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
 */
export function setupDOMPatch() {
  if (typeof window === "undefined" || typeof Node === "undefined" || !Node.prototype) {
    return;
  }

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
}
