const fs = require("fs");

function getShiftDuration(startTime, endTime) {

    function toSeconds(time) {
        time = time.trim();
        let parts = time.split(" ");
        let timePart = parts[0];
        let period = parts[1];

        let t = timePart.split(":");
        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);

        if (period === "pm" && h !== 12) {
            h += 12;
        }

        if (period === "am" && h === 12) {
            h = 0;
        }

        return h * 3600 + m * 60 + s;
    }

    function toTime(seconds) {
        let h = Math.floor(seconds / 3600);
        seconds = seconds % 3600;

        let m = Math.floor(seconds / 60);
        let s = seconds % 60;

        if (m < 10) m = "0" + m;
        if (s < 10) s = "0" + s;

        return h + ":" + m + ":" + s;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let diff = end - start;

    return toTime(diff);
}


function getIdleTime(startTime, endTime) {

    function toSeconds(time) {
        time = time.trim();
        let parts = time.split(" ");
        let timePart = parts[0];
        let period = parts[1];

        let t = timePart.split(":");
        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);

        if (period === "pm" && h !== 12) {
            h += 12;
        }

        if (period === "am" && h === 12) {
            h = 0;
        }

        return h * 3600 + m * 60 + s;
    }

    function toTime(seconds) {
        let h = Math.floor(seconds / 3600);
        seconds = seconds % 3600;

        let m = Math.floor(seconds / 60);
        let s = seconds % 60;

        if (m < 10) m = "0" + m;
        if (s < 10) s = "0" + s;

        return h + ":" + m + ":" + s;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let startDelivery = 8 * 3600;   // 8:00 AM
    let endDelivery = 22 * 3600;    // 10:00 PM

    let idle = 0;

    if (start < startDelivery) {
        idle += Math.min(end, startDelivery) - start;
    }

    if (end > endDelivery) {
        idle += end - Math.max(start, endDelivery);
    }

    return toTime(idle);
}

function getActiveTime(shiftDuration , idleTime){

    function toSeconds(t){
        let parts = t.split(":");
        let h = parseInt(parts[0]);
        let m = parseInt(parts[1]);
        let s = parseInt(parts[2]);

        return h*3600 + m*60 + s;
    }

    function toTime(sec){

        let h = Math.floor(sec/3600);
        sec = sec % 3600;

        let m = Math.floor(sec/60);
        let s = sec % 60;

        if(m < 10) m = "0" + m;
        if(s < 10) s = "0" + s;

        return h + ":" + m + ":" + s;
    }

    let shift = toSeconds(shiftDuration);
    let idle = toSeconds(idleTime);

    let active = shift - idle;

    return toTime(active);

}

function metQuota(date , activeTime){

    function toSeconds(t){
        let p = t.split(":");
        let h = parseInt(p[0]);
        let m = parseInt(p[1]);
        let s = parseInt(p[2]);

        return h*3600 + m*60 + s;
    }

    let parts = date.split("-");
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[2]);

    let active = toSeconds(activeTime);

    let quota;

    if(year == 2025 && month == 4 && day >= 10 && day <= 30){
        quota = 6 * 3600;
    }
    else{
        quota = 8*3600 + 24*60;
    }

    if(active >= quota){
        return true;
    }
    else{
        return false;
    }

}

const fs = require("fs");

function addShiftRecord(textFile , shiftObj){

    let data = fs.readFileSync(textFile , "utf8");
    let lines = data.trim().split("\n");

    for(let i = 0 ; i < lines.length ; i++){

        let cols = lines[i].split(",");

        if(cols[0] == shiftObj.driverID && cols[2] == shiftObj.date){
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime , shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime , shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration , idleTime);
    let quota = metQuota(shiftObj.date , activeTime);

    let newObj = {
        driverID : shiftObj.driverID ,
        driverName : shiftObj.driverName ,
        date : shiftObj.date ,
        startTime : shiftObj.startTime ,
        endTime : shiftObj.endTime ,
        shiftDuration : shiftDuration ,
        idleTime : idleTime ,
        activeTime : activeTime ,
        metQuota : quota ,
        hasBonus : false
    };

    let newLine =
        newObj.driverID + "," +
        newObj.driverName + "," +
        newObj.date + "," +
        newObj.startTime + "," +
        newObj.endTime + "," +
        newObj.shiftDuration + "," +
        newObj.idleTime + "," +
        newObj.activeTime + "," +
        newObj.metQuota + "," +
        newObj.hasBonus;

    let lastIndex = -1;

    for(let i = 0 ; i < lines.length ; i++){
        let cols = lines[i].split(",");
        if(cols[0] == shiftObj.driverID){
            lastIndex = i;
        }
    }

    if(lastIndex == -1){
        lines.push(newLine);
    }
    else{
        lines.splice(lastIndex + 1 , 0 , newLine);
    }

    let newData = lines.join("\n");

    fs.writeFileSync(textFile , newData);

    return newObj;

}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
