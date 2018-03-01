"use strict";

const STATE_MOVING = 1;
const STATE_RESERVING = 2;

function parts(energy) {
    return [CLAIM, MOVE];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            if (creep.room.name !== creep.memory.remoteRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            } else {
                creep.memory.state = STATE_RESERVING;
                //run(creep);
                creep.moveIntoRoom();
                return;
            }
            return;
        }
        case STATE_RESERVING: {
            if (creep.ticksToLive < creep.memory.travelTime) {
                creep.memory.dying = true;
            }
            if (creep.room.name !== creep.memory.remoteRoom) {
                creep.memory.state = STATE_MOVING;
                run(creep);
                return;
            }
            let ret = creep.reserveController(creep.room.controller);
            if (ret === OK) {
                if (!creep.memory.travelTime) {
                    creep.memory.travelTime = Game.time - creep.memory.createdAt;
                }
            } else if (ret === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
