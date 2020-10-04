const messages = [
	"Welcome to this weird place.",
	"What is it, you ask?",
	"Well, we are in a time paradox.",
	"You see, Ludum Dare themes\nwere really good in the\nbeginning.",
	"But with each jam, they\ngot worse and worse.",
	"People were hoping,\nthat the time will fix it.",
	"But it never did.",
	"...",
	"And this time around, it\ngot so bad, that the time\nhas collapsed on itself.",
	"And now we all are stuck here,\nin this time loop.",
	"Forever.",
	"...",
	"I even managed to grow a beard!",
	"They say there are always pluses)",
	"Anyway, you ask where we are?",
	"We are nowhere and everywhere,\nat the same time.",
	"This place is very wild.",
	"It appears to have nothing\nbut text on the floor.",
	"And I was even able to\nsome text too.",
	"You should try doing it\nlater, using SPACE",
	"Sometimes other people appear",
	"I've hidden a bunch of messages\naround this place.",
	"But my internet connection is failing",
	"See you around!",
	"baguette"
]

class Man {
	constructor() {
		this.x = 0
		this.y = 0
		this.time = 0
		this.closeEnough = false
		this.text = ""
		this.understood = false
		this.step = 0;
	}

	sayNext() {
		this.step++;

		if (this.step <= messages.length) {
			this.say(messages[this.step - 1]);
			return;
		}

		localPlayer.talking = false;
		man = null;
		document.getElementById("chat-container").classList.remove("hidden");
		setCookie("man", "baguette");
	}

	update(dt) {
		this.time += dt

		if (!localPlayer) {
			return;
		} else if (!this.set) {
			this.x = localPlayer.x - 4
			this.y = localPlayer.y - 30
			this.set = true
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

		if (d <= 32) {
			this.closeEnough = true
			localPlayer.talking = true

			this.say(`Hello, ${localPlayer.getData().name}!`)

			setTimeout(() => {
				if (this.understood) {
					return;
				}

				this.say("(Press SPACE to continue)")
			}, 5000);
		}
	}

	say(str) {
		this.text = ""
		this.doneSaying = false;

		for (var i = 0; i < str.length; i++) {
			let c = str.charAt(i);

			setTimeout(() => {
				this.text += c
			}, i * 70);
		}

		setTimeout(() => {
			this.doneSaying = true;
		}, str.length * 70);
	}

	render() {
		colorMode(HSB)
		tint(this.time * 100 % 360, 100, 100);
		image(assets["man"], this.x, this.y, 8, 8, (Math.floor(this.time * 7) % 5) * 8, 0, 8, 8);
		colorMode(RGB)

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
}