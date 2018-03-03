"use strict";

const STATE_MOVING = 1;
const STATE_DEFENDING = 2;

function parts(energy) {
    return [
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
    ];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            let targetPos = new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName);
            if (creep.pos.isEqualTo(targetPos)) {
                creep.memory.state = STATE_DEFENDING;
                creep.memory.travelTime = Game.time - creep.memory.createdAt;
            } else {
                creep.moveTo(targetPos);
            }
            return;
        }
        case STATE_DEFENDING: {
            if (creep.ticksToLive < creep.memory.travelTime) {
                creep.memory.dying = true;
            }
            let [hostileCreep] = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
            if (hostileCreep) {
                creep.attack(hostileCreep);
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
