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
            if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage);
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
            let terminal = creep.room.terminal;
            if (creep.memory.destinationRoom && _.sum(terminal.store) === terminal.storeCapacity) {
                // have the terminal send energy.
                let cost = Game.market.calcTransactionCost(terminal.store.energy, creep.room.name, creep.memory.destinationRoom);
                let ret = terminal.send(RESOURCE_ENERGY, terminal.store.energy - cost, creep.memory.destinationRoom);
                console.log('Sending energy to ' + creep.memory.destinationRoom + ': ' + ret);
            }
            if (creep.transfer(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(terminal);
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
