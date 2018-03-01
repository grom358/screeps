"use strict";

const STATE_MOVING = 1;
const STATE_BUSTER = 2;
const STATE_HEAL = 3;

function parts(energy) {
    return [
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, WORK, WORK, WORK, WORK, WORK,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, HEAL,
    ];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    if (creep.ticksToLive < creep.memory.travelTime) {
        creep.memory.dying = true;
    }

    switch (creep.memory.state) {
        case STATE_MOVING: {
            let startPos = new RoomPosition(creep.memory.startPos.x, creep.memory.startPos.y, creep.memory.startPos.roomName);
            if (creep.pos.isEqualTo(startPos)) {
                creep.memory.state = STATE_BUSTER;
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
            } else {
                creep.moveTo(startPos);
            }
            return;
        }
        case STATE_BUSTER: {
            if (creep.hits < creep.hitsMax) {
                creep.memory.state = STATE_HEAL;
                run(creep);
                return;
            }
            if (creep.room.name !== creep.memory.remoteRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
                return;
            }
            let target = Game.getObjectById(creep.memory.targetId);
            if (creep.dismantle(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }
        case STATE_HEAL: {
            if (creep.hits === creep.hitsMax) {
                creep.memory.state = STATE_BUSTER;
                run(creep);
                return;
            }
            let startPos = new RoomPosition(creep.memory.startPos.x, creep.memory.startPos.y, creep.memory.startPos.roomName);
            creep.moveTo(startPos);
            creep.heal(creep);
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
