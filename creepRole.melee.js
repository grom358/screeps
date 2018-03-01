"use strict";

const STATE_IDLE = 1;
const STATE_HUNT = 2;
const STATE_RENEW = 3;

function parts(energy) {
    let comboCost = BODYPART_COST[TOUGH] + BODYPART_COST[MOVE] * 2 + BODYPART_COST[ATTACK];
    let comboParts = Math.min(Math.floor(energy / comboCost), 5);
    let parts = [];
    for (let i = 0; i < comboParts; i++) {
        parts.push(TOUGH);
    }
    for (let i = 0; i < comboParts; i++) {
        parts.push(MOVE);
        parts.push(MOVE);
    }
    for (let i = 0; i < comboParts; i++) {
        parts.push(ATTACK);
    }
    return parts;
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
        filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(CLAIM) > 0
    });
    if (!hostileCreep) {
        hostileCreep = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    }
    switch (creep.memory.state) {
        case STATE_IDLE: {
            if (hostileCreep) {
                creep.memory.state = STATE_HUNT;
                run(creep);
                return;
            } else if (creep.memory.renew && creep.ticksToLive < 500 && creep.room.find(FIND_MY_SPAWNS).length > 0) {
                creep.memory.state = STATE_RENEW;
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
            }
            return;
        }
        case STATE_RENEW: {
            if (creep.ticksToLive > 1300) {
                creep.memory.state = STATE_IDLE;
                run(creep);
                return;
            }
            let spawn = creep.getTarget(
                () => creep.pos.findClosestByPath(FIND_MY_SPAWNS),
                undefined,
                'spawnId'
            );
            if (spawn && spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
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
