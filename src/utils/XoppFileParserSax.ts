// import { ungzip } from "node-gzip"
// import { App, TFile } from "obsidian"
// import { SAXParser } from "sax"
// import XournalDrawing from "src/types/XournalDrawing"
// import XournalImage from "src/types/XournalImage"
// import XournalLine from "src/types/XournalLine"
// import XournalPage from "src/types/XournalPage"
// import XournalText from "src/types/XournalText"
// const { performance } = require('perf_hooks');



// async function unzipContent2(file: TFile, app: App): Promise<string> {
//     console.time("read file")
//     const x = ungzip(await app.vault.readBinary(file))
//     .then(buf => buf.toString())
//     console.timeEnd("read file")
//     return x
// }

// export async function parseXournalXML2(file: TFile, app: App, drawing: XournalDrawing) {
//     const parser = new SAXParser(true, {});
//     const xml = await unzipContent2(file, app)


//     let currentTag: string | null = null
//     let currentAttrs: Map<string, string> | null = null
//     let textBuffer: string[] = []
//     let currentPage: XournalPage | null = null
//     let totalTime: number = 0

//     parser.onopentag = (node) => {
//         currentTag = node.name
//         currentAttrs = attrsToMap(node.attributes)
//         textBuffer = []

//         if (node.name === "page") {
//             currentPage = new XournalPage(currentAttrs)
//             // console.log("page created")
//             drawing.addPage(currentPage)
//         }
//     }

//     parser.ontext = (text) => {
//         textBuffer.push(text)
//     }

//     parser.oncdata = (text) => {
//         textBuffer.push(text)
//     }

//     parser.onclosetag = (tagName) => {
//         if (!currentAttrs || !currentPage) return

//         switch (tagName) {
//             case "text":
//                 const startTime = performance.now()
//                 new XournalText(currentAttrs, textBuffer, drawing.getLastPage())
//                 const endTime = performance.now()
//                 totalTime += (endTime - startTime)
//                 // console.log("text created")
//                 break

//             case "image":
//                 const startTime1 = performance.now()
//                 new XournalImage(currentAttrs, textBuffer, drawing.getLastPage())
//                 const endTime1 = performance.now()
//                 totalTime += (endTime1 - startTime1)
//                 // console.log("image created")
//                 break

//             case "stroke":
//                 const stratTime2 = performance.now()
//                 new XournalLine(currentAttrs, textBuffer, drawing.getLastPage())
//                 const endTime2 = performance.now()

//                 totalTime += (endTime2 - stratTime2)
//                 // console.log("line created")
//                 break
//         }

//         currentTag = null
//         currentAttrs = null
//         textBuffer = []
//     }

//     parser.write(xml).close()

//     console.log(`Creating objects time: ${totalTime}`)
// }


// export async function parseSinglePage(xml: string, drawing: XournalDrawing) {
//     const parser = new SAXParser(true, {});


//     let currentTag: string | null = null
//     let currentAttrs: Map<string, string> | null = null
//     let textBuffer: string[] = []
//     let currentPage: XournalPage | null = null

//     parser.onopentag = (node) => {
//         currentTag = node.name
//         currentAttrs = attrsToMap(node.attributes)
//         textBuffer = []

//         if (node.name === "page") {
//             currentPage = new XournalPage(currentAttrs)
//             // console.log("page created")
//             drawing.addPage(currentPage)
//         }
//     }

//     parser.ontext = (text) => {
//         textBuffer.push(text)
//     }

//     parser.oncdata = (text) => {
//         textBuffer.push(text)
//     }

//     parser.onclosetag = (tagName) => {
//         if (!currentAttrs || !currentPage) return

//         console.time(`parse item ${tagName}`)
//         switch (tagName) {
//             case "text":
//                 new XournalText(currentAttrs, textBuffer, currentPage)
//                 // console.log("text created")
//                 break

//             case "image":
//                 new XournalImage(currentAttrs, textBuffer, currentPage)
//                 // console.log("image created")
//                 break

//             case "stroke":
//                 new XournalLine(currentAttrs, textBuffer, currentPage)
//                 // console.log("line created")
//                 break
//         }
//         console.timeEnd(`parse item ${tagName}`)

//         currentTag = null
//         currentAttrs = null
//         textBuffer = []
//     }

//     parser.write(xml).close()
// }

// function attrsToMap(attrs: Record<string, any>): Map<string, string> {
//     const map = new Map<string, string>()
//     for (const [key, val] of Object.entries(attrs)) {
//         map.set(key, String(val))
//     }
//     return map
// }

// function splitPages(xml: string): string[] {
//     const pages: string[] = []
//     let depth = 0
//     let start = 0

//     for (let i = 0; i < xml.length; i++) {
//         if (xml.startsWith("<page", i)) {
//             if (depth === 0) start = i
//             depth++
//         } else if (xml.startsWith("</page>", i)) {
//             depth--
//             if (depth === 0) {
//                 pages.push(xml.slice(start, i + 7))
//             }
//         }
//     }

//     return pages
// }

// export async function parseXournalXML3(file: TFile, app: App, drawing: XournalDrawing) {
//     const pages = splitPages(await unzipContent2(file, app))
//     await Promise.all(
//         pages.map(pageXML =>
//             parseSinglePage(pageXML, drawing)
//         )
//     )
//     // for(const pageXML of pages) {
//     //     await parseSinglePage(pageXML, drawing)
//     // }
// }


