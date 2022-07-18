import * as a1lib from "@alt1/base";
import * as Chatbox from "@alt1/chatbox";
import { EncounterManager } from "./encountermanager";

//tell webpack to add index.html and appconfig.json to output
require("!file-loader?name=[name].[ext]!./index.html");
require("!file-loader?name=[name].[ext]!./appconfig.json");

//loads all images as raw pixel data async, images have to be saved as *.data.png
//this also takes care of srgb header bullshit
//this is async to cant acccess them instantly but generally takes <20ms
var imgs = a1lib.ImageDetect.webpackImages({
	homeport: require("./homebutton.data.png")
});

let reader = new Chatbox.default();
reader.readargs = {
  colors: [
    a1lib.mixColor(153,255,153),    // Green (Zamorak's voice)
    a1lib.mixColor(232,4,4)         // Red (Zamorak)
  ]
};
var encounter = new EncounterManager();

function start() {
	var chatBoxFound = false;
	var zammyEncounterStarted = false;

	var chatboxFinder = setInterval(function () {
		var found = reader.find();
		if (found != null) {
			chatBoxFound = true;
			reader.pos.mainbox = reader.pos.boxes[0];
	    	showSelectedChat(reader.pos);
			console.log("Found chatbox ");
			clearInterval(chatboxFinder);
		}
	}, 600);

	// var zammyFinder = setInterval(function () {

	// 	if (encounter.foundEnrage) {
	// 		zammyEncounterStarted = true;
	// 		console.log("Started fight");
	// 		clearInterval(zammyFinder);
	// 	}
	// }, 600);

	// encounter.findEnrageLocations();

    console.log("Looking for zammy stuff!");
	setInterval(function(time) {
		if (chatBoxFound) {
			readChatbox();
		};
	}, 200);
}

function showSelectedChat(chat) {
	//Attempt to show a temporary rectangle around the chatbox.  skip if overlay is not enabled.
	try {
	  alt1.overLayRect(
		a1lib.mixColor(255, 255, 255),
		chat.mainbox.rect.x,
		chat.mainbox.rect.y,
		chat.mainbox.rect.width,
		chat.mainbox.rect.height,
		2000,
		5
	  );
	} catch { }
  }

function highlightNextAttack() {
	var nextAttack = encounter.nextAttack;

	for (var i = 1; i < 6; i++) {
		var tableRow = document.getElementById('mech_' + i);
		var tableName = tableRow!.innerText;

		console.log(nextAttack);
		tableRow!.style.backgroundColor = tableName.toLowerCase() === nextAttack.toLowerCase() ? "green" : "";

		var next_attack = document.getElementById('next_attack');
   		next_attack!.innerHTML = '<strong>NEXT</strong>&nbsp;- <strong>' + nextAttack.toUpperCase() + ' (P' + encounter.phase + ')</strong>';
	}
}

function setupMechanicTables() {
	var mechs = encounter.specialAttacks[encounter.phase];

	var tableNames = ["","","","",""];
	var keyIndex = 0;
	for (var key in mechs) {
		tableNames[keyIndex] = key;
		keyIndex++;
	}

	for (var i = 1; i < 6; i++) {
		var tableRow = document.getElementById('mech_' + i);
		var tableRowStyle = tableRow!.style;
		var tableName = tableNames[i-1];

		tableRow!.innerText = tableName.toUpperCase();
		tableRowStyle!.visibility = tableName == "" ? "hidden" : "visible";
	}
}

document.write(`
	<hr />
	<p style="font-size: 1em;"><strong>Mechanics:</strong></p>
	<p style="font-size: 1em;" id="next_attack"><strong>NEXT</strong>&nbsp;- <strong>FLAMES (P1)</strong></p>
	<table style="height: 35px;" width="400">
	<tbody>
	<tr>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_1" bgcolor="">FLAMES</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_2" bgcolor="">ADRENCAGE</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_3" bgcolor="">CHAOSBLAST</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_4" bgcolor="">TOMB</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_5" bgcolor="">RUNES</td>
	</tr>
	</tbody>
	</table>
`);

var old_freedom = [];
var old_vuln 	= [];
var old_insta   = [];
var old_attacks = [];
var old_lines 	= [];
var old_phase = 0;
var old_enrage = -1;
var stamps_used = false;
function readChatbox() {
	reader.diffRead = !stamps_used;
	var minoverlap 	= 50;
	var new_lines 	= [];
	var opts 		= reader.read() 		|| [];
	var phase 		= encounter.phase;

	// Update next attack
	if (old_phase != phase) {
		old_phase = phase;
		setupMechanicTables();
		highlightNextAttack();
	}

	// if (old_enrage < 0) {
	// 	encounter.readEnrage();
	// 	old_enrage = encounter.enrage;
	// }
	
	// Filter old readings
	if (stamps_used) {
		//console.log('stamps found!');
		for (var a = 0; a < opts.length; a++) {
			//console.log("unfiltered: " + opts[a].text);
			var match = false;
			for (var i = 0; i < old_lines.length; i++) {
				if (reader.matchLines(opts[a].text, old_lines[i].text)) {
					match = true;
					break;
				}
			}
			if (!match) {
				old_lines.push(opts[a]);
				new_lines.push(opts[a]);
			}
		}
		if (old_lines.length > minoverlap) old_lines.splice(0, old_lines.length - minoverlap); 
		opts = new_lines;
	}

	for (var a = 0; a < opts.length; a++) {
		// Get the timestamp of the line
		var stamp = opts[a].text.match(/(\d\d:\d\d:\d\d)/);
		if (stamp) stamps_used = true;
		// Instance made

		if (opts[a].text.indexOf("You made it. But this is as far as you go") !== -1) {
			encounter.phase = 1;
			encounter.lastAttack = ["1", "N/A"];
			encounter.nextAttack = "flames";
		}
		
		// Get enrage
		// var m = opts[a].text.match(/(\d{1,4})% enrage/);
		// if (m) {
		// 	encounter.enrage = +m[1];
		// 	console.log("Enrage: " + encounter.enrage);
		// }
		
		// Update attack, if stamps are used, check if not an old attack
		function update(attack) {
			if (stamp) {
				if (old_attacks.indexOf(stamp[1]) == -1) {
					encounter.lastAttack = [phase, attack];
					encounter.updateNextAttack();
					highlightNextAttack();
					old_attacks.push(stamp[1]);
				}
			} else {
				encounter.lastAttack = [phase, attack];
				encounter.updateNextAttack();
				highlightNextAttack();
			}
		}
	
		console.log("Looking for attack");
		// Special attacks
		if (opts[a].text.indexOf("This world will burn") !== -1) {
			update("flames");
		}
		if (opts[a].text.indexOf("CHAOS, UNFETTERED") !== -1) {
			update("adrencage");
		}
		if (opts[a].text.indexOf("I will tear you asunder") !== -1) {
			update("chaosblast");
		}
		if (opts[a].text.indexOf("Step into the dark") !== -1) {
			update("tomb");
		}
		if (opts[a].text.indexOf("You're already dead") !== -1) {
			update("runes");
		}
		if (opts[a].text.indexOf("HEED MY CALL") !== -1) {
			encounter.updatePhase();
		}
	}
}

if (window.alt1) {
	alt1.identifyAppUrl("./appconfig.json");
}

start();