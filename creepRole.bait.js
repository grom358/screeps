"use strict";

const STATE_IDLE = 1;
const STATE_HUNT = 2;

function parts(energy) {
    return [MOVE, ATTACK];
}

function init(creep) {
    creep.memory.state = STATE_IDLE;
}

function run(creep) {
    if (creep.memory.remoteRoom && creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    let hostileCreep = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
        filter: (c) => c.getActiveBodyparts(MOVE) > 0
    });
    switch (creep.memory.state) {
        case STATE_IDLE: {
            if (hostileCreep) {
                creep.memory.state = STATE_HUNT;
                run(creep);
                return;
            } else {
                let flag = creep.getFlag(
                    () => creep.pos.findClosestByPath(FIND_FLAGS, {
                        filter: (f) => f.name.startsWith("Defend")
                    })
                );
                if (flag) {
                    if (creep.pos.getRangeTo(flag) > 2) {
                        creep.moveTo(flag);
                    }
                } else {
                    creep.moveTo(new RoomPosition(25, 25, creep.room.name));
                }
            }
            return;
        }
        case STATE_HUNT: {
            if (!hostileCreep) {
                creep.memory.state = STATE_IDLE;
                run(creep);
                return;
            }

            if (creep.attack(hostileCreep) === ERR_NOT_IN_RANGE) {
                creep.moveTo(hostileCreep);
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
