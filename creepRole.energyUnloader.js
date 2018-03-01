"use strict";

const STATE_COLLECT = 1;
const STATE_DELIVER = 2;

function parts(energy) {
    /*
    return [
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
        CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
    ];
    */
    return [
        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE,
    ];
}

function init(creep) {
    creep.memory.state = STATE_COLLECT;
}

function run(creep) {
    switch (creep.memory.state) {
        case STATE_COLLECT: {
            if (_.sum(creep.carry) === creep.carryCapacity) {
                creep.say('⚡ deliver');
                creep.memory.state = STATE_DELIVER;
                run(creep);
                return;
            }
            let terminal = creep.room.terminal;
            if (terminal.store.energy === 0) {
                if (creep.room.memory.spawnSettings.energyUnloader) {
                    creep.room.memory.spawnSettings.energyUnloader.max = 0;
                }
                if (creep.carry.energy === 0) {
                    creep.recycle();
                } else if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage);
                }
                return;
            }
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(terminal);
            }
            return;
        }
        case STATE_DELIVER: {
            if (creep.carry.energy === 0) {
                creep.say('🔄 collect');
                creep.memory.state = STATE_COLLECT;
                run(creep);
                return;
            }
            if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage);
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
