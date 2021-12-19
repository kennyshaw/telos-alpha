import * as a1lib from "@alt1/base";
import ChatBoxReader from "@alt1/chatbox";
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

var reader = new ChatBoxReader();
var encounter = new EncounterManager();

function start() {
	var chatBoxFound = false;
	var telosEncounterStarted = false;

	var chatboxFinder = setInterval(function () {
		var found = reader.find();
		if (found != null) {
			chatBoxFound = true;
			console.log("Found chatbox ");
			clearInterval(chatboxFinder);
		}
	}, 600);

	var telosFinder = setInterval(function () {

		if (encounter.foundEnrage && encounter.foundPhase) {
			telosEncounterStarted = true;
			console.log("Started fight");
			clearInterval(telosFinder);
		}
	}, 600);

	encounter.findPhaseAndEnrageLocations();

	setInterval(function(time) {
		if (chatBoxFound && telosEncounterStarted) {
			readChatbox();
		};
	}, 200);
}

function highlightNextAttack() {
	var nextAttack = encounter.nextAttack;

	for (var i = 1; i < 6; i++) {
		var tableRow = document.getElementById('mech_' + i);
		var tableName = tableRow!.innerText;

		tableRow!.style.backgroundColor = tableName.toLowerCase() === nextAttack.toLowerCase() ? "green" : "";
	}
}

function highlightNextHPThreshold() {
	var phase = encounter.phase;

	for (var i = 1; i < 4; i++) {
		var tableRow = document.getElementById('p' + i + '_hp');
		tableRow!.style.backgroundColor = i == phase ? "green" : "";
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
	<p style="font-size: 1em;" id="thresholds"><strong>Thresholds:</strong>&nbsp;</p>
	<table style="height: 35px;" width="225">
	<tbody>
	<tr>
	<td style="width: 75px; text-align: center; outline: thin solid;" id="p1_hp" bgcolor="">300000</td>
	<td style="width: 75px; text-align: center; outline: thin solid" id="p2_hp" bgcolor="">200000</td>
	<td style="width: 75px; text-align: center; outline: thin solid" id="p3_hp" bgcolor="">100000</td>
	</tr>
	</tbody>
	</table>
	<p style="font-size: 1em;" id="p4_hp">Phase 4 - [75000] [50000] [25000]</p>
	<hr />
	<p style="font-size: 1em;"><strong>Mechanics:</strong></p>
	<p style="font-size: 1em;" id="last_attack"><strong>Last</strong> - None</p>
	<p style="font-size: 1em;" id="next_attack"><strong>NEXT</strong>&nbsp;- <strong>Tendrils (P1)</strong></p>
	<table style="height: 35px;" width="400">
	<tbody>
	<tr>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_1" bgcolor="">TENDRILS</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_2" bgcolor="">ONSLAUGHT</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_3" bgcolor="">STUN</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_4" bgcolor="">VIRUS</td>
	<td style="width: 60px; text-align: center; outline: thin solid" id="mech_5" bgcolor="">CHARGE</td>
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
	var phase 		= encounter.readPhase() || encounter.phase;

	// Update next attack
	if (old_phase != phase) {
		old_phase = phase;
		encounter.updateNextAttack();
		setupMechanicTables();
		highlightNextAttack();
		highlightNextHPThreshold();
	}

	if (old_enrage < 0) {
		encounter.readEnrage();
		old_enrage = encounter.enrage;
	}
	
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
		if (opts[a].text.indexOf("Telos, the Warden") !== -1) {
			encounter.phase = 1;
			encounter.lastAttack = ["1", "N/A"];
			encounter.nextAttack = "tendril";
		}
		
		// Get enrage
		var m = opts[a].text.match(/(\d{1,4})% enrage/);
		if (m) {
			encounter.enrage = +m[1];
			console.log("Enrage: " + encounter.enrage);
		}
		
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
	
		// Special attacks
		if (opts[a].text.indexOf("Gielinor, give me strength") !== -1) {
			update("uppercut");
		}
		if (opts[a].text.indexOf("Your anima will return to the source") !== -1) {
			update("tendril");
		}
		if (opts[a].text.indexOf("Hold still, invader") !== -1) {
			update("stun");
		}
		if (opts[a].text.indexOf("The anima stream cleanses you") !== -1) {
			update("virus");
		}
		if (opts[a].text.indexOf("the anima consume you") !== -1) {
			update("anima");
		}

		var last_attack = document.getElementById('last_attack');
		last_attack!.innerHTML = '<strong>Last</strong> - ' + encounter.lastAttack[1].toUpperCase() + '</p>';

   		var next_attack = document.getElementById('next_attack');
   		next_attack!.innerHTML = '<strong>NEXT</strong>&nbsp;- <strong>' + encounter.nextAttack.toUpperCase() + ' (P' + encounter.phase + ')</strong>';
	}
}

if (window.alt1) {
	alt1.identifyAppUrl("./appconfig.json");
}

start();