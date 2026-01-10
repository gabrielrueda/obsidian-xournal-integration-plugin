import {TFile, App} from "obsidian";
import {ungzip} from "node-gzip"
import XournalDrawing from "src/types/XournalDrawing";
import XournalPage from "src/types/XournalPage";
import XournalText from "src/types/XournalText";
import XournalImage from "src/types/XournalImage";
import XournalLine from "src/types/XournalLine";



export function isNumber(value: string) {
    return !isNaN(parseFloat(value));
}

// Return a map datastructure of {tagName: tagValue}
export function extractTags(text: string, tags: string[]): Map<string, any>{
    let dict = new Map();

    const regex = /([a-zA-Z]*)="([^"]*)"/g;
    
    text = shrinkTag(text)

    for(let match of text.matchAll(regex)){
        const value = isNumber(match[2]) ? parseFloat(match[2]) : match[2]
        dict.set(match[1], value)
    }

    validateTags(tags, dict)

    return dict
}

function shrinkTag(text: string) {
    return text.substring(0, text.indexOf('>') + 1);
}

function validateTags(tags: string[], tagMap: Map<string, any>): void{
    for (const tag of tags) {
        if (!tagMap.has(tag)) {
            throw new Error("Could not extract tag: " + tag)
        }
    }
}

export function extractRawData(text: string): string{
    const raw_start = text.indexOf('>') + 1;
    return text.substring(raw_start, text.lastIndexOf('<'));
}

export async function unzipContent(file: TFile, app: App): Promise<string[]> {

    // return (await (ungzip(await app.vault.readBinary(file)))).toString().split('\n')

    console.time("read time")
    const x = unzipContentTest(file, app)
    console.timeEnd("read time")
    return x
}

async function unzipContentTest(file: TFile, app: App): Promise<string[]> {
    
    return ungzip(await app.vault.readBinary(file))
    .then(buf => buf.toString().split('\n'))
    // return (await (ungzip(await app.vault.readBinary(file)))).toString().split('\n')
}


export async function writeOutputFile(app: App, path: string, content: string) {
    const newFile = app.vault.getAbstractFileByPath(path)

    if(newFile) {
        await app.vault.delete(newFile)
    }

    await app.vault.create(path, content)
}


function parseAttributes(attrString: string): Map<string, string> {
    const map = new Map<string, string>()
    const attrRegex = /([\w:-]+)="([^"]*)"/g

    let match: RegExpExecArray | null
    while ((match = attrRegex.exec(attrString)) !== null) {
        map.set(match[1], match[2])
    }

    return map
}


export async function unzipContent2(file: TFile, app: App): Promise<string> {
    return ungzip(await app.vault.readBinary(file))
    .then(buf => buf.toString())
}

// export async function parseXournalXML(drawing: XournalDrawing, file: TFile, app: App): Promise<void> {
//     const tagRegex =
//         /<([\w:-]+)([^>]*)>([\s\S]*?)<\/\1>|<([\w:-]+)([^/>]*)\/>/g

//     console.log("here")

//     let match: RegExpExecArray | null

//     while ((match = tagRegex.exec(await unzipContent2(file, app))) !== null) {
//         console.log("match")
//         const tagName = match[1] ?? match[4]
//         const attrString = match[2] ?? match[5] ?? ""
//         const value = match[3]?.trim() ?? ""

//         const attrs = parseAttributes(attrString)

//         switch (tagName) {
//             case "page":
//                 const item = new XournalPage(attrs);
//                 this.drawing.addPage(item as XournalPage);
//                 break

//             case "text":
//                 new XournalText(attrs, value, drawing.getLastPage())
//                 break

//             case "image":
//                 new XournalImage(attrs, value, drawing.getLastPage())
//                 break

//             case "stroke":
//                 new XournalLine(attrs, value, drawing.getLastPage())
//                 break
//         }
//     }

// }


