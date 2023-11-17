/*
This is where all of the game code will go. It will be written in typescript.
The modules and the main functions and everything will be here (it may need to be seperated into multiple files later)
The aim of the game, is to walk around a maze like structure that is non-Euclidian and shifting and hunt someone.
The player does this through the web browser and inputs commands through buttons and text box inputs.
I am doing this so that I can learn how to code in javascript and create a functioning web game from it.
*/
//compile using command: tsc gameCode.ts --lib
/*
//This is what the game area should look like
╔═════════════════╗
║.................║
║........V........║
║.@...............║
║.................║
╚═══════/═════#═══╝
*/
//Box drawing characters:
//['═','║','╔','╗','╚','╝','╠','╣','╦','╩','╬'];   
//This needs to go at the very top of the code so that the functions that use these global variables won't spit out errors. 
let player_loc;
let scene; //For telling the code whether the player is at the title screen, in game, at the end of the game, or anything else
let room_index;
let room = [[""]];
let sounds = [new Audio("door.wav"), new Audio("locked.wav"), new Audio("click.wav"), new Audio("metal.wav")];
let info = ["", "", "", "", "", ""]; //Is the array for 
function addToCurrentInfo(newInfo) { info[0] += " | " + newInfo; }
function addInfo(newInfo) { info = info.slice(0, 5); info.unshift(newInfo); }
let room_sizes = [[19, 6], [5, 3]]; //,[],[],[],]
let room_objects = [[{ chr: '@', col: 2, row: 3, color: "red", sound_index: 2, active: false, connects_to_door: 1 }, { chr: '/', col: 8, row: 5, active: false, door_goes_to_room: 1, door_spawn_loc: [1, 2], sound_index: 3 }, { chr: '#', col: 14, row: 5, text_box: "The sign reads 'Welcome to the shifting walls facility. Here, we reserach the future of bigger-on-the-inside technology'" }],
    [{ chr: '/', col: 2, row: 0, door_perma_locked: true }, { chr: '/', col: 4, row: 1, active: true, ends_the_game: true }]
];
function create_room(player_spawn) {
    //Takes string array input, outputs 2D string array. 
    let room_size = room_sizes[room_index];
    let objects = room_objects[room_index];
    let output = [];
    for (let i = 0; i < room_size[1]; i++) { //Loop through every row
        output.push([]); //Add new array for the current line to be added to
        for (let j = 0; j < room_size[0]; j++) { //Loop through every unit of that row 
            if (i == 0) { //If on the top row
                if (j == 0) {
                    output[i].push('╔');
                } //If top left
                else if (j == room_size[0] - 1) {
                    output[i].push('╗');
                } //If top right
                else {
                    output[i].push('═');
                } //If just on the top row
            }
            else if (i == room_size[1] - 1) { //If on the bottom row
                if (j == 0) {
                    output[i].push('╚');
                } //If bottom left
                else if (j == room_size[0] - 1) {
                    output[i].push('╝');
                } //If bottom right
                else {
                    output[i].push('═');
                } //If just on the bottom row
            }
            else if (j == 0 || j == room_size[0] - 1) {
                output[i].push('║');
            } //If on the left or right walls (corners already taken care of)
            else {
                output[i].push('.');
            } //Else, empty space
        }
    }
    output[player_spawn[0]][player_spawn[1]] = 'V'; //Place the player
    for (let thing of objects)
        output[thing.row][thing.col] = thing.chr; //Place the room's objects 
    room = output;
    //return [ ["place","holder"],["out","put"] ]
}
function display_room() {
    //Deep copy the room array so that editing doesn't mess with the room itself
    let using_room = [];
    for (let i = 0; i < room.length; i++) {
        let inner_use = [];
        for (let j = 0; j < room[i].length; j++)
            inner_use.push(room[i][j]);
        using_room.push(inner_use);
    }
    //Apply color step
    for (let thing of room_objects[room_index]) {
        if (thing.color !== undefined) {
            using_room[thing.row][thing.col] = `<span style="color: ${thing.color}">${thing.chr}</span>`;
        }
    }
    //Display step
    let writing = [];
    for (let row of using_room) { //Iterate over every row using for of
        writing.push(row.join(""));
    }
    document.body.innerHTML = writing.join("<br>") + "<br>---------------------<br> ~" + info.join("<br> ~");
    //console.log(writing.join("\n")); //This line exists for error checking in the console
}
function move_character(direction) {
    let target = [-1, -1];
    switch (direction) {
        case "up":
            target = [player_loc[0] - 1, player_loc[1]];
            break; //Decrease row by 1
        case "left":
            target = [player_loc[0], player_loc[1] - 1];
            break; //Decrease col by 1
        case "down":
            target = [player_loc[0] + 1, player_loc[1]];
            break; //Increase row by 1
        case "right":
            target = [player_loc[0], player_loc[1] + 1];
            break; //Increase col by 1
    }
    if (target[0] == -1 && target[1] == -1)
        return; //If the invalid direction error, exit function
    let going_to = room[target[0]][target[1]];
    if (going_to == '.') { //If empty space
        room[target[0]][target[1]] = 'V';
        room[player_loc[0]][player_loc[1]] = '.'; //Replace the characters in the room
        player_loc = target; //Change player position
    }
    else if (going_to == '/') { //If going through a door
        /*
        Door interaction code
        1. Finds the door that is being walked through
        2. Finds and sets the new room_index and finds the spawn location
        3. Sets new player location equal to spawn location, and creates the new room
        */
        /*1*/ let door = { chr: 'invalid', col: 0, row: 0, color: '' };
        /*1*/ for (let thing of room_objects[room_index]) {
            if (thing.row == target[0] && thing.col == target[1])
                door = thing;
        }
        if (door.door_perma_locked)
            addInfo("Don't go back. Keep searching for them.");
        else if (door.ends_the_game !== undefined)
            end_game();
        else if (!door.active) {
            addInfo("Locked door.");
            sounds[1].play();
        }
        else if (door.active) {
            /*2*/ room_index = door.door_goes_to_room; //Has to include 'as number' because the property is 'number | undefined'
            /*2*/ let spawn_loc = door.door_spawn_loc;
            /*3*/ create_room(spawn_loc);
            /*3*/ player_loc = spawn_loc;
            sounds[door.sound_index].play();
        }
        else { }
    }
    else { } //Assume you cannot walk thought any other objects. Therefore do nothing.
}
function find_interaction() {
    //This code assumes that there will only be one interactable within the player's reach, which is how the levels will be made
    let targets = [[], [], [], []];
    targets[0] = [player_loc[0] - 1, player_loc[1]]; //Up a row
    targets[1] = [player_loc[0], player_loc[1] - 1]; //Left a column
    targets[2] = [player_loc[0] + 1, player_loc[1]]; //Down a row
    targets[3] = [player_loc[0], player_loc[1] + 1]; //Right a column
    let target;
    let validInteracts = ['@', '#', '/'];
    for (let i = 0; i < 4; i++) {
        let tempCheck = room[targets[i][0]][targets[i][1]];
        if (validInteracts.includes(tempCheck)) {
            target = targets[i];
            break;
        }
    }
    if (target === undefined)
        return; //If target is undefined, that means that the player is not interacting with anything
    let object = { chr: 'invalid key', col: 0, row: 0, color: '' }; //For 
    let object_index;
    let i = 0;
    for (let thing of room_objects[room_index]) {
        if (thing.row == target[0] && thing.col == target[1]) {
            object_index = i;
            object = thing;
            break;
        }
        else {
            i++;
        }
    }
    if (object.chr == '/') {
        if (object.door_perma_locked)
            addInfo("Don't go back. Keep searching for them.");
        else if (object.ends_the_game !== undefined)
            end_game();
        else if (!object.active) {
            addInfo("Locked door.");
            sounds[1].play();
        }
        else if (object.active) {
            /*2*/ room_index = object.door_goes_to_room; //Has to include 'as number' because the property is 'number | undefined'
            /*2*/ let spawn_loc = object.door_spawn_loc;
            /*3*/ create_room(spawn_loc);
            /*3*/ player_loc = spawn_loc;
            sounds[object.sound_index].play();
        }
        else { }
    }
    else if (object.chr == "#") { //If the object is a sign or some kind of reading thing. Can sometimes interact with things
        if (object.interaction_index !== undefined) { //If there is an interaction, execute that too
            interaction(object.interaction_index);
        }
        addInfo(object.text_box);
    }
    else if (object.chr == "@") { //If the object is a button of some kind 
        sounds[2].play(); //Play for any button
        if (object.connects_to_door !== undefined) { //If the button connects to a door
            //Change button color, change button active status, change the door active status
            let to_door = object.connects_to_door;
            if (object.active) { //If button is on, 
                room_objects[room_index][object_index].color = "red";
                room_objects[room_index][object_index].active = false;
                room_objects[room_index][to_door].active = false;
            }
            else {
                room_objects[room_index][object_index].color = "green";
                room_objects[room_index][object_index].active = true;
                room_objects[room_index][to_door].active = true;
            }
        }
        else
            interaction(object.interaction_index); //If it's not a normal door button, then run the interaction code.
    }
}
function interaction(index) {
}
function process_input(key) {
    let invalidKey = false;
    switch (key) {
        case 'w':
        case 'ArrowUp':
            move_character("up");
            break;
        case 'a':
        case 'ArrowLeft':
            move_character("left");
            break;
        case 's':
        case 'ArrowDown':
            move_character("down");
            break;
        case 'd':
        case 'ArrowRight':
            move_character("right");
            break;
        case 'Enter':
        case ' ': //Represents the spacebar
            find_interaction();
            break;
        default: invalidKey = true;
    }
    if (invalidKey || scene == 'end') { }
    else {
        display_room();
    }
}
function title_screen() {
    scene = "title";
    let title = ["<pre>",
        "███████╗ █████╗  ██████╗██╗██╗     ██╗████████╗██╗   ██╗    ██╗  ██╗██╗   ██╗███╗   ██╗████████╗",
        "██╔════╝██╔══██╗██╔════╝██║██║     ██║╚══██╔══╝╚██╗ ██╔╝    ██║  ██║██║   ██║████╗  ██║╚══██╔══╝",
        "█████╗  ███████║██║     ██║██║     ██║   ██║    ╚████╔╝     ███████║██║   ██║██╔██╗ ██║   ██║",
        "██╔══╝  ██╔══██║██║     ██║██║     ██║   ██║     ╚██╔╝      ██╔══██║██║   ██║██║╚██╗██║   ██║",
        "██║     ██║  ██║╚██████╗██║███████╗██║   ██║      ██║       ██║  ██║╚██████╔╝██║ ╚████║   ██║",
        "╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝╚══════╝╚═╝   ╚═╝      ╚═╝       ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝",
        "",
        "           Move with WASD or the arrow keys. Interact with either Enter or Space.            ",
        "",
        "                               Press Enter to start the game.                                "
    ];
    document.body.innerHTML = title.join("<br>");
}
function start_game() {
    player_loc = [2, 9];
    scene = "game";
    room_index = 0;
    create_room(player_loc);
    display_room();
}
function end_game() {
    sounds[3].play();
    scene = "end";
    document.body.innerHTML = "You couldn't hide from me.";
}
title_screen();
//This is the function where everything goes from when something happens. 
//This runs everytime a key is pressed and will run continously after the initial press if the player holds a key down
//Got code from https://www.codeinwp.com/snippets/detect-what-key-was-pressed-by-the-user/
window.addEventListener('keydown', function (e) {
    if (scene == "end")
        return; //Nothing can be done at the end of the game
    else if (scene == "title") {
        if (e.key == "Enter")
            start_game();
    }
    else
        process_input(e.key);
}, false);
