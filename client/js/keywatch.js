/**
 * Funkce pouze mapuje klávesy do vstupního seznamu.
 * Zpracování je pak v "client.js"
 * 
 * bude to na upravení, chová se to celkem divně
 */


// pohyb po mape? + zkratky.. ?
function setKeyDownList(code, value) {

    if (code == 38 || code == 87) // W || UP
        client.keyDownList.up = value;

    if (code == 40 || code == 83) // S || DOWN
        client.keyDownList.down = value;

    if (code == 37 || code == 65) // A || LEFT
        client.keyDownList.left = value;

    if (code == 39 || code == 68) // D || RIGHT
        client.keyDownList.right = value;

    if (code == 82 || code == 8) // R || BCKSPACE
        client.keyDownList.respawn = value;

    if (code == 16) // Shift
        client.keyDownList.boost = value;

        if (code == 32) // Space
        ; // client.keyDownList.break = value;

// console.log(code)

}


$(function () {
    $(document).keyup((event) => {
        setKeyDownList(event.keyCode, false);
    });

    $(document).keydown((event) => {
        setKeyDownList(event.keyCode, true);
        //event.preventDefault();
    });

});




