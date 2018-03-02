"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;

function parts(energy) {
    let comboCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    let comboParts = Math.min(Math.floor(energy / comboCost), 10);
    comboParts = Math.max(comboParts, 3);
    let parts = [];
    for (let i = 0; i < comboParts; i++) {
        parts.push(CARRY);
        parts.push(MOVE);
    }
    return parts;
}

function init(creep) {
    creep.memory.state = STATE_COLLECT;
}

function run(creep) {
    if (creep.carryCapacity === 0) {
        creep.recycle();
        return;
    }

    if (creep.memory.remoteRoom && creep.room.name !== creep.memory.remoteRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.remoteRoom);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    switch (creep.memory.state) {
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.memory.state = STATE_DELIVER;
                // Clear the collection point as we wish to reselect collection target for next collection.
                delete creep.memory.collectFrom;
                run(creep);
                return;
            }
            creep.collectEnergy();
            return;
        }
        case STATE_DELIVER: {
            if (creep.carry.energy === 0) {
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            let {target, type} = creep.getTargetUnion({
                spawn: {
                    selector: () => creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType === STRUCTURE_SPAWN ||
                            s.structureType === STRUCTURE_EXTENSION) && s.energy < s.energyCapacity
                    }),
                    validator: (s) => s.energy < s.energyCapacity,
                },
                tower: {
                    selector: () => _.max(
                        creep.room.find(FIND_MY_STRUCTURES, {
                            filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity
                        }),
                        (s) => s.energyCapacity - s.energy),
                    validator: (s) => s.energy < s.energyCapacity,
                },
                container: {
                    selector: () => _.max(
                        creep.room.findDestinationContainers(),
                        (container) => container.storeCapacity - _.sum(container.store)) ,
                    validator: (container) => _.sum(container.store) < container.storeCapacity - 50,
                },
                upgrader: {
                    selector: () => {
                        if (!creep.room.controller) {
                            return null;
                        }
                        // If controller has a container or storage then we don't deliver to upgraders.
                        if (creep.room.findControllerContainer()) {
                            return null;
                        }
                        // Otherwise deliver to upgrader near controller
                        let upgraders = creep.room.controller.pos.findInRange(FIND_MY_CREEPS, 3, {
                            filter: (c) => c.memory.role === 'upgrader' && _.sum(c.carry) < c.carryCapacity
                        });
                        if (upgraders.length > 0) {
                            return _.max(upgraders, (c) => c.carryCapacity - _.sum(c.carry));
                        }
                        return null;
                    },
                    validator: (c) => _.sum(c.carry) < c.carryCapacity,
                },
                lab: {
                    selector: () => _.min(
                        creep.room.find(FIND_MY_STRUCTURES, {
                            filter: (s) => s.structureType === STRUCTURE_LAB && s.energy < s.energyCapacity
                        }),
                        (lab) => lab.energy
                    ),
                    validator: (lab) => lab.energy < lab.energyCapacity,
                },
                storage: {
                    selector: () => creep.room.storage,
                    validator: (storage) => _.sum(storage.store) < storage.storeCapacity,
                },
            }, 'deliverTo');
            let ret = creep.transfer(target, RESOURCE_ENERGY);
            if (ret === OK) {
                // We transferred all we could, pick a new target.
                delete creep.memory.deliverTo;
            } else if (ret === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
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