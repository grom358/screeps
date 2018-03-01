"use strict";

const STATE_MOVING = 1;
const STATE_COLLECTING = 2;
const STATE_UPGRADING = 3;

function parts(energy) {
    let workEnergy = energy - BODYPART_COST[MOVE] - BODYPART_COST[CARRY];
    let workParts = Math.max(Math.floor(workEnergy / BODYPART_COST[WORK]), 1);
    let noWorkParts = Math.min(workParts, 5);
    let parts = new Array(noWorkParts).fill(WORK);
    parts.push(CARRY);
    parts.push(MOVE);
    return parts;
}

function init(creep) {
    let containers = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE
    });
    if (containers.length > 0) {
        let container = _.max(containers, (c) => c.store.energy);
        creep.memory.tid = container.id;
    }
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            // Move to controller even without energy, as we have transport deliver it.
            let target = Game.getObjectById(creep.memory.tid);
            if (!target) {
                // The target was destroyed.
                delete creep.memory.tid;
            }
            if (target) {
                if (!creep.pos.isNearTo(target)) {
                    // Move so we adjacent to storage.
                    creep.moveTo(target);
                } else {
                    creep.memory.state = STATE_COLLECTING;
                }
            } else {
                if (creep.pos.getRangeTo(creep.room.controller) > 3) {
                    creep.moveTo(creep.room.controller);
                } else {
                    creep.memory.travelTime = Game.time - creep.memory.createdAt;
                    creep.memory.state = STATE_COLLECTING;
                }
            }
            return;
        }
        case STATE_COLLECTING: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_UPGRADING;
                //creep.say('⚡ upgrade');
                run(creep);
                return;
            }

            let collectFrom = Game.getObjectById(creep.memory.tid);
            if (collectFrom) {
                creep.withdraw(collectFrom, RESOURCE_ENERGY);
            } else {
                // The target was destroyed.
                delete creep.memory.tid;

                // We wait for someone to fill us up.
            }
            return;
        }
        case STATE_UPGRADING: {
            if (creep.getActiveBodyparts(CARRY) === 0) {
                return;
            }

            if (creep.ticksToLive < creep.memory.travelTime) {
                creep.memory.dying = true;
            }

            if (creep.carry.energy === 0) {
                creep.memory.state = STATE_COLLECTING;
                //creep.say('🔄 collect');
                run(creep);
                return;
            }

            if (creep.room.memory.upgradePositions) {
                let positions = creep.room.memory.upgradePositions;
                for (let i = 0, n = positions.length; i < n; i++) {
                    let pos = positions[i];
                    if (creep.pos.isEqualTo(pos.x, pos.y)) {
                        break;
                    }
                    if (creep.room.lookForAt(LOOK_CREEPS, pos.x, pos.y).length === 0) {
                        creep.moveTo(pos.x, pos.y);
                        break;
                    }
                }
            }

            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
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