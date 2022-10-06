export type FailedEntry = {
    name: string;
    timeIn: number;
    timeOut: number;
    activity: string;
}
export type LoggedIn = {
    [key:string]:number
}

export type Member = {
    name: string;
    firstname: string;
    img: string;
    certs:Certification[];
}

export type SpreadsheetMemberInfo = {
    name: string;
    goodPhoto: boolean;
    certs:string[];
}

export type Certification = {
    id: string;
    name: string;
}

export type HTMLMemberButtonElement = HTMLElement & {
	loggedIn:boolean;
}