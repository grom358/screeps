"use strict";

const STATE_MOVING = 1;
const STATE_COLLECT = 2;
const STATE_DELIVER = 3;

function parts(energy) {
    return [CARRY, MOVE];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            let targetPos = new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName);
            if (creep.pos.isEqualTo(targetPos)) {
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            creep.moveTo(targetPos);
            return;
        }
        case STATE_COLLECT: {
            let link = Game.getObjectById(creep.memory.sourceLinkId);
            creep.withdraw(link, RESOURCE_ENERGY);
            creep.memory.state = STATE_DELIVER;
            return;
        }
        case STATE_DELIVER: {
            creep.transfer(creep.room.storage, RESOURCE_ENERGY);
            creep.memory.state = STATE_COLLECT;
            return;
        }
    }
}

module.exports = {
    parts: parts,
    init: init,
    run: run,
};
