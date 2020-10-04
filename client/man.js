const messages = [
	"Welcome to this weird place.",
	"Wwe are in a time paradox.",
	"You see, Ludum Dare themes\nwere really good in the\nbeginning.",
	"But with each jam, they\ngot worse and worse.",
	"People were hoping,\nthat the time will fix it.",
	"But it never did.",
	"And this time around, it\ngot so bad, that the time\nhas collapsed on itself.",
	"And now we all are stuck here,\nin this time loop.",
	"I even managed to grow a beard!",
	"They say there are always pluses)",
	"We are nowhere and everywhere,\nat the same time.",
	"It appears to have nothing\nbut text on the floor.",
	"And I was even able to\nsome text too.",
	"You should try doing it\nlater, using SPACE",
	"See you around!",
	"baguette"
]

class Npc {
	constructor() {
		this.x = 0
		this.y = 0
		this.time = 0
		this.closeEnough = false
		this.farEnough = true
		this.text = ""
		this.step = 0;
		this.sprite = "player"
		this.messages = []
	}

	start() {

	}

	update(dt) {
		this.time += dt

		if (!localPlayer) {
			return;
		}

		if (this.closeEnough) {
			if (this.doneSaying) {
				if (keyIsDown(32) || keyIsDown(88) || keyIsDown(13)) {
					this.understood = true;
					this.sayNext();
				}
			}

			return;
		}

		var dx = this.x - localPlayer.x;
		var dy = this.y - localPlayer.y;

		var d = Math.sqrt(dx * dx + dy * dy);

		if (!this.farEnough) {
			if (d >= 64) {
				this.farEnough = true;
			}
		} else if (d <= 32) {
			this.closeEnough = true
			localPlayer.talking = true
			localPlayer.talkingTo = this

			this.start()
		}
	}

	drawSprite() {
		tint(255)
		image(assets[this.sprite], this.x, this.y, 8, 8, (Math.floor(this.time * 7) % 5) * 8, 0, 8, 8);
	}

	render() {
		this.drawSprite();

		if (this.closeEnough) {
			textSize(4);
			textAlign(CENTER, BOTTOM);
			
			var w = textWidth(this.text)
			
			fill(0, 0, 0, 150);
			rect(this.x + 4 - w * 0.5, this.y - 3 - 3, w, 4)

			fill(255, 255, 255, 255);
			
			text(this.text, this.x + 4, this.y - 2)
		}
	}

	say(str) {
		this.text = ""
		this.doneSaying = false;

		for (let i = 0; i < str.length; i++) {
			let c = str.charAt(i);

			setTimeout(() => {
				this.text += c

				if (i % 2 == 0) {
					assets["talk"].stop();
					assets["talk"].play(0, Math.max(0.5, Math.min(2, ((c.charCodeAt(0) - 'a'.charCodeAt(0)) / 26) * 1.5) - 0.2));
				}
			}, i * 40);
		}

		setTimeout(() => {
			this.doneSaying = true;
		}, str.length * 40);
	}

	stopTalking() {
		localPlayer.talking = false;
		localPlayer.talkingTo = null
		this.closeEnough = false;
		this.farEnough = false;
		this.text = "";
		this.step = 0;

		this.finishTalking();
	}

	sayNext() {
		this.step++;

		if (this.step <= this.messages.length) {
			this.say(this.messages[this.step - 1]);
			return;
		}

		this.stopTalking();
	}

	finishTalking() {

	}
}

class Man extends Npc {
	constructor() {
		super()

		this.messages = messages
		this.understood = false
		this.sprite = "man"
	}

	finishTalking() {
		man = null;
		document.getElementById("chat-container").classList.remove("hidden");
		setCookie("man", "baguette");
	}

	start() {
		this.say(`Hello, ${localPlayer.getData().name}!`)

		setTimeout(() => {
			if (this.understood) {
				return;
			}

			this.say("(Press SPACE to continue)")
		}, 5000);
	}

	drawSprite() {
		colorMode(HSB)
		tint(this.time * 100 % 360, 100, 100);
		image(assets[this.sprite], this.x, this.y, 8, 8, (Math.floor(this.time * 7) % 5) * 8, 0, 8, 8);
		colorMode(RGB)
		tint(255)
	}

	update(dt) {
		super.update(dt)

		if (!localPlayer) {
			return;
		} else if (!this.set) {
			this.x = localPlayer.x
			this.y = localPlayer.y - 30
			this.set = true
		}
	}
}

const baguetteMessages = [
	"Baguette!",
	"!",
	"Yeah, silly, I know",
	"Egor was too tired to think\nof anything at this point",
	"But at least I exist",
	"Right?",
	"I hope?",
	"..."
]

class Baguette extends Npc {
	constructor() {
		super()

		this.messages = baguetteMessages
		this.sprite = "baguette"
	}

	start() {
		this.say(`Sup, ${localPlayer.getData().name}!`)
	}
}


const dinoMessages = [
	"I hope you are having fun!",
	"This is made by @egordorichev",
	"..."
]

class Dino extends Npc {
	constructor() {
		super()

		this.messages = dinoMessages
		this.sprite = "dino"
	}

	start() {
		this.say(`Pssst!`)
	}
}