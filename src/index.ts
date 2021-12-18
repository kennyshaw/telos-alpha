import * as a1lib from "@alt1/base";
import ChatBoxReader from "@alt1/chatbox";

//tell webpack to add index.html and appconfig.json to output
require("!file-loader?name=[name].[ext]!./index.html");
require("!file-loader?name=[name].[ext]!./appconfig.json");

//loads all images as raw pixel data async, images have to be saved as *.data.png
//this also takes care of srgb header bullshit
//this is async to cant acccess them instantly but generally takes <20ms
var imgs = a1lib.ImageDetect.webpackImages({
	homeport: require("./homebutton.data.png"),
	phase: require("./phase.data.png"),
	enrage: require("./enrage.data.png")
});

var reader = new ChatBoxReader();
var readTelos = new TelosReader();

a1lib.PasteInput.listen(ref => {
	var pos = ref.findSubimage(imgs.homeport);
	document.write("find result: " + JSON.stringify(pos));
});

export function capture() {

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
		var img = a1lib.captureHoldFullRs();
		var phaseLoc = img.findSubimage(imgs.phase);
		var enrageLoc = img.findSubimage(imgs.enrage);

		if (phaseLoc.length != 0 && enrageLoc.length != 0) {
			telosEncounterStarted = true;
			console.log("Started fight");
			clearInterval(telosFinder);
		}
	}, 600);

	readTelos.find();
	setInterval(function(time) {
		if (chatBoxFound && telosEncounterStarted) {
			readChatbox();
		};
	}, 200);
}

// document.write(`
// 	<div class="crty-header">Telos Helper</div>
// 	<div class="crty-story" style="z-index: -1; position:relative;">
// 	<table><tbody style="font-size:14px;">
// 	<tr id="last_attack"><td>Last attack: </td><td>P1 N/A </td>
// 	<tr id="next_attack"><td>Next attack: </td><td>P1 Tendril </td>
// 	</tbody></table>
// 	</div>
// 	<div class="nisseperator"></div>
// 	<button onclick='TEST.capture()'>Capture</button>`
// );


document.write(`
	<button onclick='TEST.capture()'>Start Encounter</button>
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

if (window.alt1) {
	alt1.identifyAppUrl("./appconfig.json");
}

function highlightNextAttack() {
	var nextAttack = readTelos.nextAttack;

	for (var i = 1; i < 6; i++) {
		var tableRow = document.getElementById('mech_' + i);
		var tableName = tableRow!.innerText;

		tableRow!.style.backgroundColor = tableName.toLowerCase() === nextAttack.toLowerCase() ? "green" : "";
	}
}

function highlightNextHPThreshold() {
	var phase = readTelos.phase;

	for (var i = 1; i < 4; i++) {
		var tableRow = document.getElementById('p' + i + '_hp');
		tableRow!.style.backgroundColor = i == phase ? "green" : "";
	}
}

function TelosReader() {
	var me = this;
	
	this.phase = 1;
	this.enrage = -1;

	this.totalHP = -1;

	this.lastAttack = ["1", "N/A"];
	this.nextAttack = "tendril";
	this.P5count = 0;

	// Beam changes in 1/10th of a second. First value is on phase start. The second value is every other beam after that
	// Maybe changing this to time until first beam
	
	this.beamchange = {
		"2": [320, 210],
		"3": [320, 210],
		"5": [331, 372]
	}
	
	// First number is last phase. Second number the current phase
	this.specialAttacks = {
		"1": {
			"N/A": {
				"1": "tendril",
				"2": "tendril"
			},
			"tendril": {
				"1": "uppercut",
				"2": "onslaught"
			},
			"uppercut": {
				"1": "stun",
				"2": "stun"
			},
			"stun": {
				"1": "tendril",
				"2": "tendril"
			}
		},
		"2": {
			"tendril": {
				"2": "onslaught",
				"3": "stun"
			},
			"onslaught": {
				"2": "stun",
				"3": "virus"
			},
			"stun": {
				"2": "virus",
				"3": "uppercut"
			},
			"virus": {
				"2": "uppercut",
				"3": "uppercut"
			},
			"uppercut": {
				"2": "tendril",
				"3": "uppercut"
			}
		},
		"3": {
			"uppercut": {
				"3": "stun", 
				"4": "uppercut"
			},
			"stun": {
				"3": "virus", 
				"4": "anima"
			},
			"virus": {
				"3": "uppercut", 
				"4": "stun"
			}
		},
		"4": {
			"uppercut": {
				"4": "anima",
				"5": "virus"
			},
			"anima": {
				"4": "stun",
				"5": "virus"
			},
			"stun": {
				"4": "uppercut",
				"5": "virus"
			}
		},
		"5": {
			"virus": {
				"5": "Insta kill"
			},
			"N/A": {
				"1": "tendril",
				"5": "tendril"
			}
		}
	}


	// Freedom cooldown after freeing - Telos breaks free from its bindings.
	// Telos will be immune for 6 seconds after freeing on phase 5 at 250% enrage and above
	// Values are in 1/10th seconds (seconds * 10)
	this.freedomCooldown = function() {
		if (this.enrage < 250) {
			return 300;
		}
		if (this.enrage <= 999) {
			return 186; 
		}
		if (this.enrage >= 1000) {
			return 96;
		}
	}

	// Still unsure how this works but these values seem to work on different resolutions
	this.enrage_pos = null;
	this.phase_pos = null;
	this.find = function(img) {
		if (!img) img = a1lib.captureHoldFullRs();
		if (!img) return null;
		
		var phaseImg = img.findSubimage(imgs.phase);
		if (phaseImg.length != 0) {
			this.phase_pos = {
				x: phaseImg[0].x - 5,
				y: phaseImg[0].y - 5,
				w: 60,
				h: 24,
				xos: 10,
				yos: 12
			}
			console.log(this.phase_pos);
		}

		var enrageImg = img.findSubimage(imgs.enrage);
		if (enrageImg.length != 0) {
			this.enrage_pos = {
				x: enrageImg[0].x + 5,
				y: enrageImg[0].y + 1,
				w: 100,
				h: 40,
				xos: 11,
				yos: 13
			}
			console.log(this.enrage_pos);
		}
	}
	
	this.updateNextAttack = function() {
		if (!this.phase_pos) {
			this.find();
		}
		if (!this.phase_pos) {
			return null;
		}
		me.readPhase();
		var lastPhase = me.lastAttack[0];
		var lastAttack = me.lastAttack[1];
		if (lastPhase && lastAttack) {
			if (me.specialAttacks[lastPhase][lastAttack]) {
				me.nextAttack = me.specialAttacks[lastPhase][lastAttack][me.phase];
				console.log("Next attack is: " + me.nextAttack);
			} else {
				console.log("last phase: " + lastPhase + " Lastattack: " + lastAttack);
			}

		}
	}

	// this.countP5 = function () {
	// 	if (!this.phase_pos) {
	// 		return null;
	// 	}
	// 	var pos = this.phase_pos;
		
	// 	if (this.phase == 5) {
	// 		var width = 160
	// 		var buffer = a1lib.wrappedGetRegion(pos.x + pos.w + 30, pos.y - 4, 200, 5);
			
	// 		var b;
	// 		for (b = 0; b < 200; b++) {
	// 			var i = buffer.pixelOffset(b + 7, 2);
	// 			if (coldiff(buffer.data[i], buffer.data[i + 1], buffer.data[i + 2], 18, 22, 22) < 20) {
	// 				break;
	// 			}
	// 		}
	// 		// Removing minion spawn
	// 		var atk = [0,4,10,/*17,*/ 23,30,36,42,49,55,62,68,74,81,87,94,100,106,113,119,126,132,138,145,151,158].indexOf(b);
	// 		if (atk != -1) {
	// 			this.P5count = atk;
	// 			return this.P5count;
	// 		}
			
	// 	}
	// 	return null;
	// }

	this.readPhase = function() {
		if (!this.phase_pos) {
			return null;
		}
		var pos = this.phase_pos;
		var img = a1lib.captureHold(pos.x, pos.y, pos.w, pos.h);

		// Find the string in the region
		var str = alt1.bindReadColorString(img.handle, "chat", a1lib.mixColor(255, 255, 255), pos.xos, pos.yos);
		var m = str.match(/Phase: (\d{1})/);
		
		if (!m) {
			return null;
		}
		this.phase = +m[1];

		var mechs = readTelos.specialAttacks[this.phase];

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
		
		return this.phase;
	}

	this.readEnrage = function() {
		if (!this.enrage_pos && !this.phase_pos) {
			this.find();
		}
		if (!this.enrage_pos) {
			return null;
		};
		var pos = this.enrage_pos;
		var img = a1lib.captureHold(pos.x, pos.y, pos.w, pos.h);
		//drawImg(a1lib.getregion(x, y, w, h)); // Debug info

		// Find the string in the region
		var str = alt1.bindReadColorString(img.handle, "chat", a1lib.mixColor(255, 255, 255), pos.xos, pos.yos);
		console.log(str);
		var m = str.match(/Enrage: (\d{1,4})%/);
		if (!m) {
			m = str.match(/Rage: (\d{1,4})/);
		}
		if (!m) {
			return null;
		}
		this.enrage = +m[1];
		this.totalHP = Math.min(600000,400000+this.enrage*1000);

		var p1_hp = document.getElementById('p1_hp');
		p1_hp!.innerText = '' + (this.totalHP * 0.75);

		var p2_hp = document.getElementById('p2_hp');
		p2_hp!.innerText = '' + (this.totalHP * 0.5);

		var p3_hp = document.getElementById('p3_hp');
		p3_hp!.innerText = '' + (this.totalHP * 0.25);

		var p4_hp = document.getElementById('p4_hp');
		p4_hp!.innerText = 'Phase 4 - [' + (this.totalHP * 0.25 * 0.75) + '] [' + (this.totalHP * 0.25 * 0.5) + '] [' + (this.totalHP * 0.25 * 0.25) + ']';
		
		return this.enrage;
	}
}

var old_freedom = [];
var old_vuln 	= [];
var old_insta   = [];
var old_attacks = [];
var old_lines 	= [];
var old_phase = 1;
var old_enrage = -1;
var stamps_used = false;
function readChatbox() {
	reader.diffRead = !stamps_used;
	var minoverlap 	= 50;
	var new_lines 	= [];
	var opts 		= reader.read() 		|| [];
	var phase 		= readTelos.readPhase() || readTelos.phase;

	// Update next attack
	if (old_phase != phase) {
		old_phase = phase;
		readTelos.updateNextAttack();
		highlightNextAttack();
		highlightNextHPThreshold();
	}

	if (old_enrage < 0) {
		readTelos.readEnrage();
		old_enrage = readTelos.enrage;
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
			readTelos.phase = 1;
			readTelos.lastAttack = ["1", "N/A"];
			readTelos.nextAttack = "tendril";
		}
		
		// Get enrage
		var m = opts[a].text.match(/(\d{1,4})% enrage/);
		if (m) {
			readTelos.enrage = +m[1];
			console.log("Enrage: " + readTelos.enrage);
		}
		
		// Update attack, if stamps are used, check if not an old attack
		function update(attack) {
			if (stamp) {
				if (old_attacks.indexOf(stamp[1]) == -1) {
					readTelos.lastAttack = [phase, attack];
					readTelos.updateNextAttack();
					highlightNextAttack();
					old_attacks.push(stamp[1]);
				}
			} else {
				readTelos.lastAttack = [phase, attack];
				readTelos.updateNextAttack();
				highlightNextAttack();
			}
		}
		/*********
		// Special attacks
		if (opts[a].text.indexOf("me strength") !== -1) {
			update("uppercut");
		}
		if (opts[a].text.indexOf("to the source") !== -1) {
			update("tendril");
		}
		if (opts[a].text.indexOf("invader") !== -1) {
			update("stun");
		}
		if (opts[a].text.indexOf("cleanses you") !== -1) {
			update("virus");
		}
		if (opts[a].text.indexOf("consume you") !== -1) {
			update("anima");
		}
		
		// Telos used Freedom
		if (opts[a].text.indexOf("free from its bindings") !== -1) {
			
			readTelos.readEnrage(); // Update enrage
			if (stamp) {
				if (old_freedom.indexOf(stamp[1]) == -1) {
					FreedomTimer.reset(readTelos.freedomCooldown());
					FreedomTimer.start(UI.settings['stepless'] == 1 ? 10 : 100);
					old_freedom.push(stamp[1]);
				}
			} else {
				FreedomTimer.reset(readTelos.freedomCooldown());
				FreedomTimer.start(UI.settings['stepless'] == 1 ? 10 : 100);
			}
		}
		
		// Vuln has been used
		if (opts[a].text.indexOf("hex to your target") !== -1) {
			if (stamp) {
				if (old_freedom.indexOf(stamp[1]) == -1) {
					vulnTimer.reset(600);
					vulnTimer.start(UI.settings['stepless'] == 1 ? 10 : 100);
					old_vuln.push(stamp[1]);
				}
			} else {
				vulnTimer.reset(600);
				vulnTimer.start(UI.settings['stepless'] == 1 ? 10 : 100);
			}
		}		
		**********/
		
	
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
		
		// Telos used Freedom
		if (	opts[a].text.indexOf("Telos breaks free from its bindings") !== -1
			 || opts[a].text.indexOf("Telos entkommt") !== -1 ) {
			
			readTelos.readEnrage(); // Update enrage
		}

		var last_attack = document.getElementById('last_attack');
		last_attack!.innerHTML = '<strong>Last</strong> - ' + readTelos.lastAttack[1] + '</p>';

   		var next_attack = document.getElementById('next_attack');
   		next_attack!.innerHTML = '<strong>NEXT</strong>&nbsp;- <strong>' + readTelos.nextAttack + ' (P' + readTelos.phase + ')</strong>';
	}
}