import * as a1lib from "@alt1/base";

var telos_imgs = a1lib.ImageDetect.webpackImages({
	enrage: require("./enrage.data.png")
});

export function EncounterManager() {
	var me = this;
	
	this.phase = 1;
	this.enrage = -1;

	this.enrage_pos = null;
	this.phase_pos = null;

	this.totalHP = -1;

	this.lastAttack = ["1", "N/A"];
	this.nextAttack = "flames";

	this.firstSpec = {
		"1": {
			"N/A": "flames"
		},
		"2": {
			"N/A": "flames",
			"flames": "tomb",
			"tomb": "adrencage",
			"runes": "flames"
		},
		"3": {
			"N/A": "chaosblast",
			"runes": "chaosblast",
			"flames": "tomb",
			"tomb": "adrencage",
			"adrencage": "chaosblast"
		},
		"4": {
			"N/A": "chaosblast",
			"runes": "chaosblast",
			"flames": "runes",
			"tomb": "adrencage",
			"adrencage": "chaosblast",
			"chaosblast": "runes"
		},
		"5": {
			"N/A": "chaosblast",
			"runes": {
				"1": "chaosblast",
				"4": "flames"
			},
			"flames": "runes",
			"tomb": "flames",
			"adrencage": "chaosblast",
			"chaosblast": "runes"
		},
		"6": {
			"N/A": "tomb",
			"runes": {
				"1": "tomb",
				"4": "flames",
				"5": "flames"
			},
			"flames": {
				"1": "runes",
				"2": "runes",
				"5": "tomb"
			},
			"tomb": "flames",
			"adrencage": "tomb",
			"chaosblast": "runes"
		},
	}
	
	this.specialAttacks = {
		"1": {
			"flames": "tomb",
			"tomb": "runes",
			"runes": "flames"
		},
		"2": {
			"flames": "tomb",
			"tomb": "adrencage",
			"adrencage": "flames"
		},
		"3": {
			"chaosblast": "tomb",
			"tomb": "adrencage",
			"adrencage": "chaosblast"
		},
		"4": {
			"chaosblast": "runes",
			"runes": "adrencage",
			"adrencage": "chaosblast"
		},
		"5": {
			"flames": "chaosblast",
			"chaosblast": "runes",
			"runes": "flames"
		},
		"6": {
			"flames": "tomb",
			"tomb": "runes",
			"runes": "flames"
		}
	}

	this.setFirstSpec = function() {
		var selectedPhase = me.firstSpec[me.phase]
		var nextSpec = selectedPhase[me.lastAttack[1]]
		if (nextSpec.constructor == Object ) {
			this.nextAttack = nextSpec[me.lastAttack[1]]
		} else {
			this.nextAttack = nextSpec
		}
	}

	
	this.findEnrageLocations = function(img) {
		if (!img) img = a1lib.captureHoldFullRs();
		if (!img) return null;

		var enrageImg = img.findSubimage(telos_imgs.enrage);
		if (enrageImg.length != 0) {
			this.enrage_pos = {
				x: enrageImg[0].x + 5,
				y: enrageImg[0].y + 1,
				w: 100,
				h: 40,
				xos: 11,
				yos: 13
			}
		}
	}
	
	this.updateNextAttack = function() {
		this.nextAttack = me.specialAttacks[me.phase][me.lastAttack[1]];
	}

	this.updatePhase = function() {
		this.phase += 1;

		var mechs = this.specialAttacks[this.phase];

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
		
		this.setFirstSpec();
	}

	this.readEnrage = function() {
		if (!this.enrage_pos && !this.phase_pos) {
			this.findPhaseAndEnrageLocations();
		}
		if (!this.enrage_pos) {
			return null;
		};
		var pos = this.enrage_pos;
		var img = a1lib.captureHold(pos.x, pos.y, pos.w, pos.h);

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
		this.enrage = +m[1]; + ']';
		
		return this.enrage;
	}

	this.foundEnrage = function() {
		var img = a1lib.captureHoldFullRs();
		var loc = img.findSubimage(telos_imgs.enrage);
		return loc.length != 0
	}
}