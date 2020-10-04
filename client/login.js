function setCookie(name, value, days) {
	var expires = "";

	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toUTCString();
	}

	document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];

		while (c.charAt(0) == ' ') {
			c = c.substring(1, c.length);
		}

		if (c.indexOf(nameEQ) == 0) {
			return c.substring(nameEQ.length, c.length);
		}
	}

	return null;
}

function loadScript(name) {
	var script = document.createElement("script");
	script.src = name;
	document.head.appendChild(script);
}

var name = getCookie("name")

function loadLibs() {
	loadScript("index.js");
}

if (name != null && name != "null") {
	loadLibs();
} else {
	document.getElementById("chat-container").classList.add("hidden")
	document.getElementById("overlay").classList.remove("hidden")
	document.getElementById("overlay-login").classList.remove("hidden")
	document.getElementById("overlay-message").classList.add("hidden")

	var input = document.getElementById("nick")
	var jjoin = document.getElementById("join")

	jjoin.addEventListener("click", () => {
		if (/\S/.test(input.value) && input.value.length < 32) {
			setCookie("name", input.value);

			document.getElementById("chat-container").classList.remove("hidden")
			document.getElementById("overlay").classList.add("hidden")
			document.getElementById("overlay-login").classList.add("hidden")
			document.getElementById("overlay-message").classList.remove("hidden")

			loadLibs();
			return;
		}
	});

	nick.addEventListener("keyup", (event) => {
		if (event.keyCode === 13) {
			event.preventDefault();
			jjoin.click();
		}
	});
}