import { cluckApiUrl, cluckBasepath, cluckBaseurl } from "../../consts";
import type { LoggedIn, Member } from "../../types";
import { checkAuth, clock, cluckedIn, refreshMemberList } from "./clockapi";
import { getButtonState } from "./style";

declare global {
    interface Window { 
		skipAuth:boolean;
	}
}

type HTMLMemberButtonElement = HTMLElement & {
	loggedIn:boolean;
}



let members:Member[];
export async function run(memberlist:Member[]) {
	// Fetch Members
	members = memberlist;
	redrawRows();

	// Setup Randomized Button Style Options
	const horizPos = {
		left: [
			{ styleName: "right", val: "auto" },
			{ styleName: "border-top-left-radius", val: 0 },
			{ styleName: "border-bottom-left-radius", val: 0 },
		],
		right: [
			{ styleName: "left", val: "auto" },
			{ styleName: "border-top-right-radius", val: 0 },
			{ styleName: "border-bottom-right-radius", val: 0 },
		],
		center: [],
	};
	const verticalPos = {
		// top: [
		// 	{ styleName: "border-top-right-radus", val: 0 },
		// 	{ styleName: "border-top-left-radus", val: 0 },
		// ],
		bottom: [
			{ styleName: "bottom", val: 0 },
			{ styleName: "border-bottom-right-radius", val: 0 },
			{ styleName: "border-bottom-left-radius", val: 0 },
		],
	};
	const font = {
		gilroy: [{ styleName: "font-family", val: "gilroy" }],
		cocogoose: [{ styleName: "font-family", val: "cocogoose" }],
		tcm: [{ styleName: "font-family", val: "tcm" }],
		basics: [{ styleName: "font-family", val: "basics-serif" }],
	};
	const styleCatagories = [horizPos, verticalPos, font];

	// Button toggling on and off styling

	// Make member buttons
	document.getElementById("button-grid").replaceChildren();
	members.forEach((member) => {
		// Init button
		const memberButton = document.createElement("person-button");
		memberButton.id = member.name;

		// Set click toggle
		if (!window.skipAuth) {
			memberButton.onclick = async (click) => {
				// fullscreen()
				let button = click.target as HTMLMemberButtonElement;
				if (button.classList.contains("button-text")) {
					button = button.parentElement as HTMLMemberButtonElement;
				}

				// Toggle logged in
				button.loggedIn =  !button.loggedIn
				// Update style
				getButtonState(button.loggedIn).forEach((styleSpec) => {
					button.style.setProperty(styleSpec.styleName, styleSpec.val);
				});
				// Cluck API Call

				const res = await clock(button.id, button.loggedIn);
				if (!res.ok) {
					await refreshLoggedIn();
				}
			};
		}

		// Add name text
		const text = document.createElement("person-name");
		text.className = "button-text";
		text.innerHTML = member.firstname;

		// Randomize mix and match text styles
		styleCatagories.forEach((styleCatagory) => {
			const styleOptions = Object.values(styleCatagory);
			if (styleOptions.length == 0) {
				return;
			}
			const toSet = styleOptions[Math.floor(Math.random() * styleOptions.length)];
			toSet.forEach((attribute) => {
				text.style.setProperty(attribute.styleName, attribute.val);
			});
		});

		// Do other adding and styling things
		memberButton.appendChild(text);
		memberButton.style.setProperty("background-image", `url(${member.img})`);
		if (!member.img) {
			memberButton.style.setProperty(
				"background-image",
				`url(${cluckBaseurl}/assets/img/defaultpicture.jpg)`
			);
		}
		memberButton.className = "button-in";

		// Add button
		document.getElementById("button-grid").appendChild(memberButton);
	});
    refreshLoggedIn();
}

(async () => {
	const authed = await checkAuth();
	if (!authed) {
		document.location.assign(cluckBasepath + "/grid/login");
	}
	await run(await (await fetch(cluckApiUrl + "/members")).json());
	addEventListener("resize", redrawRows);
})();

async function refreshLoggedIn() {
	let membersIn:LoggedIn;
	const noconnect = document.getElementById("noconnect");
	try {
		membersIn = await cluckedIn();
		noconnect.style.setProperty("visibility", "hidden");
	} catch (err) {
		noconnect.style.setProperty("visibility", "visible");
        return;
	}

	// Update buttons
	const buttons = document.getElementsByTagName("person-button") as HTMLCollectionOf<HTMLMemberButtonElement>;
	for (let i = 0; i < buttons.length; i++) {
		const button = buttons[i];
		button.loggedIn = button.id in membersIn;
		getButtonState(button.loggedIn).forEach((styleSpec) => {
			button.style.setProperty(styleSpec.styleName, styleSpec.val);
		});
	}
	redrawRows();
}

export function redrawRows() {
	// Compute number of rows and columns, and cell size
	const n = members.length;
	const x = document.documentElement.clientWidth;
	const y = document.documentElement.clientHeight;
	const ratio = x / y;
	const ncolsFloat = Math.sqrt(n * ratio);
	const nrowsFloat = n / ncolsFloat;

	// Find best option filling the whole height
	let nrows1 = Math.ceil(nrowsFloat);
	let ncols1 = Math.ceil(n / nrows1);
	while (nrows1 * ratio < ncols1) {
		nrows1++;
		ncols1 = Math.ceil(n / nrows1);
	}
	const cellSize1 = y / nrows1;

	// Find best option filling the whole width
	let ncols2 = Math.ceil(ncolsFloat);
	let nrows2 = Math.ceil(n / ncols2);
	while (ncols2 < nrows2 * ratio) {
		ncols2++;
		nrows2 = Math.ceil(n / ncols2);
	}
	const cellSize2 = x / ncols2;

	// Find the best values
	let nrows, ncols;
	if (cellSize1 < cellSize2) {
		nrows = nrows2;
		ncols = ncols2;
	} else {
		nrows = nrows1;
		ncols = ncols1;
	}

	document.documentElement.style.setProperty("--width", ncols);
	document.documentElement.style.setProperty("--height", nrows);
}

setInterval(refreshMemberList, 60 * 60 * 1000);
setInterval(refreshLoggedIn, 5 * 1000);
