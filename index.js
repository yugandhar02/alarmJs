"use strict";

var alarms = {};
var globalAlarmListeners = [];
var timeFactor = 1000;

function createAlarmConfig(name) {
    var alarmObj = {
        name: name,
        scheduledTime: null,
        period: null,
        isFired: false,
        listners: [],
        clearAlarmId: ""
    };

    return alarmObj;
}

function validateAlarmName (name) {
    if (!(typeof name === 'string' || name instanceof String)) {
        throw new Error("Name should be string");
    }
}

function validateAlarmConfig (alarmConfig) {
    if (config.period === undefined && config.delay === undefined) {
        throw new Error("Specify the period or delay");
    }
}

function validateHandler (handler) {
    if (typeof handler !== "function") {
        throw new Error("Alarm handler should be function");
    }
}

function validateCreateAlarm (alarmName, config) {
    validateAlarmName(alarmName);
    validateAlarmConfig(config);
}

function createAlarm(alarmName, config) {
    var methodToUse;
    var delay;        
    var clearAlarmId;
    var alarmConfig;

    validateCreateAlarm(alarmName, config);

    alarmConfig = alarms[alarmName];

    if (!alarmConfig) {
        alarmConfig = createAlarmConfig(alarmName);
    }

    if (config.period) {
        methodToUse = setInterval;
        delay = config.period;
        alarmConfig.period = delay;
    } else {
        methodToUse = setTimeout;
        delay = config.delay;
    }

    alarmConfig.scheduledTime = getScheduletime(delay);

    clearAlarmId = methodToUse(onTimerTick, delay*timeFactor);

    alarmConfig.clearAlarmId = clearAlarmId;
    alarms[alarmName] = alarmConfig;
    return getAlarmObj(alarmConfig);
}

function onTimerTick (alarmName) {
    var alarmConfig = alarms[alarmName];
    fireAlarm(alarmName);
    if (alarmConfig && alarmConfig.period) {
        alarmConfig.scheduledTime = getScheduletime(alarmConfig.period);
    }
}

function getScheduletime (delay) {
    return Date.now() + delay*timeFactor;
}

function fireAlarm (alarmName) {
    var alarmConfig = alarms[alarmName];

    if (!alarmConfig) {
        return;
    }

    var alarmObj = getAlarmObj(alarmConfig);
    var listners = alarmConfig.listners;

    listners.forEach((alarmHandler) => {
        alarmHandler(alarmObj);
    });

    globalAlarmListeners.forEach((alarmHandler) => {
        alarmHandler(alarmObj);
    });

    alarmConfig.fired = true;
}

function listenToAlarm(alarmName, alarmHandler) {
    validateAlarmName(alarmName);
    validateHandler(alarmHandler);

    var alarmObj = alarms[alarmName];
    if (!alarmObj) {
        alarmObj = createAlarmConfig(alarmName);
        alarms[alarmName] = alarmObj;
    }

    alarmObj.listners.push(alarmHandler);
    return function () {
        stopListeningToAlarm(alarmName, alarmHandler);
    }
}

function listenToAllAlarms (callback) {
    validateHandler(callback);
    globalAlarmListeners.push(callback);
    return function () {
        removeFromGlobalAlarmListeners(callback);
    }
}

function removeFromGlobalAlarmListeners (handler) {
    let index = 0;
    for (; index < globalAlarmListeners.length; index++) {
        if (globalAlarmListeners[index] === handler) {
            globalAlarmListeners.splice(index, 1);
            return true;
        }
    }
    return false;
}

function stopListeningToAlarm (alarmName, alarmHandler) {
    var alarmConfig = alarms[alarmName];
    var listners;
    var index = 0;
    if (alarmConfig) {
        listners = alarmConfig.listners;
        for (; index <  listners.length; index++) {
            if (listners[index] === alarmHandler) {
                listners.splice(index, 1);
                return true;
            }
        }
    }
    return false;
}

function clearAlarm (alarmName) {
    var alarmConfig = alarms[alarmName];

    if (!alarmConfig) {
        return false;
    }
    if (alarmConfig.period) {
        clearInterval(alarmConfig.clearAlarmId);
    } else {
        clearTimeout(alarmConfig.clearAlarmId);
    }
    delete alarms[alarmName];
    return true;
}

function clearAllAlarms () {
    Object.keys(alarms).forEach((alarmName) => {
        clearAlarm(alarmName);
    });
    alarms = {};
    globalAlarmListeners = [];
}

function getAlarm (alarmName) {
    var alarmConfig = alarms[alarmName];
    var alarm;

    if (alarmConfig) {
        alarm = getAlarmObj(alarmConfig);
    }
    return alarm;
}

function getAllAlarms () {
    var alarmsArr = [];
    Object.keys(alarms).forEach((alarmName) => {
        alarmsArr.push(getAlarm(alarmName));
    });
    return alarmsArr;
}

function getAlarmObj (alarmConfig) {
    var alarmObj = {
        name: alarmConfig.name,
        scheduledTime: alarmConfig.scheduledTime,
        period: alarmConfig.period,
    };

    return alarmObj;
}

module.exports = {
    createAlarms,
    listenToAlarms,
    clearAlarm,
    getAlarm,
    getAllAlarms,
    clearAllAlarms,
    listenToAllAlarms
};