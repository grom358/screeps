"use strict";

const STATE_MOVING = 1;
const STATE_UPGRADING = 2;
const STATE_COLLECT = 3;

function parts(energy) {
    return [WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, ];
}

function init(creep) {
    creep.memory.state = STATE_MOVING;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_MOVING: {
            /*
            if (_.sum(creep.carry) < creep.carryCapacity) {
                if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage);
                }
                return;
            }
            */

            if (creep.room.name !== creep.memory.remoteRoom) {
                const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
                const exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
            } else {
                if (creep.pos.getRangeTo(creep.room.controller) > 3) {
                    creep.moveTo(creep.room.controller);
                } else {
                    creep.memory.state = STATE_UPGRADING;
                }
            }
            return;
        }
        case STATE_UPGRADING: {
            if (creep.carry.energy === 0) {
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
            return;
        }
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_UPGRADING;
                // Clear the collection point as we wish to reselect collection target for next collection.
                delete creep.memory.collectFrom;
                run(creep);
                return;
            }
            if (!creep.collectEnergy()) {
                let source = creep.getTarget(
                    () => {
                        let source = creep.pos.findClosestByPath(FIND_SOURCES, {
                            filter: (source) => _.sum(Game.creeps, (creep) => source.id === creep.memory.sourceId) === 0
                        });
                        if (source) {
                            return source;
                        }
                        // Fallback to source with least builders.
                        let sources = creep.room.find(FIND_SOURCES);
                        if (sources.length) {
                            return _.min(sources, (s) => _.sum(Game.creeps, (c) => s.id === c.memory.sourceId));
                        }
                        return null;
                    },
                    undefined,
                    'sourceId'
                );
                if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
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