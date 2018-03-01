"use strict";

// This is called during global reset to set up structure memory,
// because it doesn't need to be called often.
if (!Memory.structures) {
    Memory.structures = {};
}

// Adds structure memory to Structure things.
// Easier to reason about garbage collection in this implementation.
Object.defineProperty(Structure.prototype, "memory", {
    get: function () {
        if (!Memory.structures[this.id])
            Memory.structures[this.id] = {};
        return Memory.structures[this.id];
    },
    set: function (v) {
        return _.set(Memory, 'structures.' + this.id, v);
    },
    configurable: true,
    enumerable: false
});

/**
 * Garbage collect structure memory.
 *
 * Call this periodically to garbage collect structure memory (every 10k ticks is fine).
 */
global.GCStructureMemory = function () {
    for (let id in Memory.structures)
        if (!Game.structures[id]) {
            delete Memory.structures[id];
        }
};

/**
 * Garbage collect creep memory.
 */
global.GCCreepMemory = function() {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
};