const gridstyle = document.querySelector('meta[name="gridstyle"]')?.getAttribute("content") ?? "default" as "void" | "default"

export const getClockEndpoint = () => {
	switch (gridstyle) {
		case "void":
			return "/void"
		default:
			return "/clock"
	}
}
const normalButtonStates = {
	false: [
		{ styleName: "filter", val: "grayscale(100%)" },
		{
			styleName: "box-shadow",
			val: "inset 0 0 0 1000px rgba(255, 255, 255, 0.4), 0px 0px 10px rgba(255, 0, 0,.5)",
		},
	],
	true: [
		{ styleName: "filter", val: "grayscale(0%)" },
		{
			styleName: "box-shadow",
			val: "inset 0 0 0 1000px rgba(255, 255, 255, 0.0), 0px 0px 15px 7px rgb(0, 255, 136)",
		},
	],
}

const voidButtonStates = {
	false: [
		{styleName:"transition-duration",val:"2s"},
		{ styleName: "filter", val: "grayscale(100%)" },
		{
			styleName: "box-shadow",
			val: "inset 0 0 0 1000px rgba(255, 255, 255, 0.4), 0px 0px 10px rgba(255, 0, 0,.5)",
		},
		{styleName:"transform",val:"rotate(0)"},
		
	],
	true: [
		{styleName:"transition-duration",val:"0s"},
		{ styleName: "filter", val: "grayscale(0%)" },
		{
			styleName: "box-shadow",
			val: "inset 0 0 0 1000px rgba(255, 255, 255, 0.0), 0px 0px 15px 7px rgb(255, 0, 0)",
		},
		{styleName:"transform",val:"rotate(0)"},
		
	],
}
export const getButtonState = (loggedIn:boolean) => {
	switch (gridstyle) {
		case "void":
			return voidButtonStates[loggedIn.toString()]
		default:
			return normalButtonStates[loggedIn.toString()]
	}
}
