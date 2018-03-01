"use strict";

function parts(energy) {
    return [MOVE];
}

function init(creep) {

}

function run(creep) {
    if (creep.memory.remoteRoom && creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    if (creep.signController(creep.room.controller, creep.memory.message)) {
        creep.moveTo(creep.room.controller);
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
