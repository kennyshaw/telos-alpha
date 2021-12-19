import * as a1lib from "@alt1/base";

var telos_imgs = a1lib.ImageDetect.webpackImages({
	phase: require("./phase.data.png"),
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
	this.nextAttack = "tendril";
	
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

	
	this.findPhaseAndEnrageLocations = function(img) {
		if (!img) img = a1lib.captureHoldFullRs();
		if (!img) return null;
		
		var phaseImg = img.findSubimage(telos_imgs.phase);
		if (phaseImg.length != 0) {
			this.phase_pos = {
				x: phaseImg[0].x - 5,
				y: phaseImg[0].y - 5,
				w: 60,
				h: 24,
				xos: 10,
				yos: 12
			}
		}

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
		if (!this.phase_pos) {
			this.findPhaseAndEnrageLocations();
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
			}

		}
	}

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
		
		return this.phase;
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

	this.foundEnrage = function() {
		var img = a1lib.captureHoldFullRs();
		var loc = img.findSubimage(telos_imgs.enrage);
		return loc.length != 0
	}

	this.foundPhase = function() {
		var img = a1lib.captureHoldFullRs();
		var loc = img.findSubimage(telos_imgs.phase);
		return loc.length != 0
	}
}