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
}

export type SpreadsheetMemberInfo = {
    name: string,
    goodPhoto: boolean,
}