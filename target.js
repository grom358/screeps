"use strict";

/**
 * Generalized target locking function for actors with memory.
 *
 * Valid actors include creeps, flags, and structures if you assign them memory.
 *
 * The selector function picks the target, but only runs during
 * the target selection phase. This is where your CPU heavy work should go.
 *
 * The validator function is ran once per call to ensure the target is still
 * valid for use, so you want this function to be as cheap as possible.
 *
 * The prop parameter is the key used to store the target's id in memory. This
 * optionally allows us to have multiple target locks with different names.
 *
 * @param selector Select the target
 * @param validator Check if a target is still valid
 * @param prop Property name in memory to store the target
 * @returns {object|null}
 */
RoomObject.prototype.getTarget = function (selector, validator = _.identity, prop = 'targetId') {
    let tid = this.memory[prop];
    let target = Game.getObjectById(tid);
    if (target == null || !validator(target)) {
        target = selector.call(this, this);
        if (target && target.id && validator(target)) {
            this.memory[prop] = target.id;
        } else {
            delete this.memory[prop];
            target = null;
        }
    }
    return target;
};

RoomObject.prototype.getFlag = function (selector, validator = _.identity, prop = 'flag') {
    let fname = this.memory[prop];
    let target = Game.flags[fname]
    if (target == null || !validator(target)) {
        target = selector.call(this, this);
        if (target && target.name && validator(target)) {
            this.memory[prop] = target.name;
        } else {
            delete this.memory[prop];
            target = null;
        }
    }
    return target;
};

/**
 * Get target out of union of possible target types.
 *
 * The types is map of possible target types to objects containing the
 * selector and validator. Refer to RoomObject.prototype.getTarget
 *
 * @param types Map of types with object containing selector and validator
 * @param prop Property name in memory to store target information
 * @returns {*}
 */
RoomObject.prototype.getTargetUnion = function(types, prop = 'target') {
    let union = this.memory[prop];
    // If we have an existing target and its valid then return it.
    if (union && union.type in types) {
        let target = Game.getObjectById(union.tid);
        let validator = types[union.type].validator || _.identity;
        if (target == null || !validator(target)) {
            delete this.memory[prop];
        } else {
            return { target: target, type: union.type };
        }
    } else {
        delete this.memory[prop];
    }

    // Else we select new target.
    for (let type in types) {
        let params = types[type];
        let selector = params.selector;
        let validator = types[type].validator || _.identity;
        let target = selector.call(this, this);
        if (target && target.id && validator(target)) {
            this.memory[prop] = { tid: target.id, type: type };
            return { target: target, type: type };
        }
    }
    return { target: null, type: null };
};