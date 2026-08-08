// src/UndoManager.js
/**
 * UndoManager - small bounded undo/redo stack manager
 * @module UndoManager
 */
export default class UndoManager {
    /**
     * @param {number} maxSize
     */
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Push a state to undo stack
     * @param {string} state
     */
    push(state) {
        if (state === undefined || state === null) return;
        const stack = this.undoStack;
        if (stack.length > 0 && stack[stack.length - 1] === state) return;
        stack.push(state);
        if (stack.length > this.maxSize) stack.shift();
        this.redoStack = [];
    }

    canUndo() { return this.undoStack.length > 1; }
    canRedo() { return this.redoStack.length > 0; }

    /**
     * Undo and return restored state or null
     * @returns {string|null}
     */
    undo() {
        if (!this.canUndo()) return null;
        const popped = this.undoStack.pop();
        this.redoStack.push(popped);
        return this.undoStack[this.undoStack.length - 1] || null;
    }

    /**
     * Redo and return restored state or null
     * @returns {string|null}
     */
    redo() {
        if (!this.canRedo()) return null;
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        return state;
    }

    /**
     * Reset manager seeds stacks
     * @param {string} [initial]
     */
    reset(initial = '') {
        this.undoStack = initial ? [initial] : [];
        this.redoStack = [];
    }
}
