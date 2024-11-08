import {App, debounce, TFile, normalizePath, Notice} from "obsidian";
import {ungzip} from "node-gzip"

export default class XournalFileContext {
    private app: App
    private window: number[]
    rawContent: string
    tag_inds: number[]
    curr_tag: number

    constructor(app: App) {
        this.app = app
        this.window = []
        this.curr_tag = 0
    }

    public async deserialize(file: TFile) {
        this.rawContent = (await (ungzip(await this.app.vault.readBinary(file)))).toString()
        this.findTags()
    }


    private findTags() {
        // let i = 0
        for (var a=[],i=this.rawContent.length;i--;) if (this.rawContent[i]=="<") a.push(i+1);
        
        a.reverse()
        this.tag_inds = a
    }

    public nextTag() : boolean{
        this.curr_tag++
        if(this.curr_tag >= this.tag_inds.length){
            return false
        }
        return true
    }

    public getFileIndex() {
        return this.tag_inds[this.curr_tag]
    }


    public update_window(x: number, y: number) {
        if(this.window.length === 0){
            this.window = [x, y, x, y]
            return
        }

        if (x < this.window[0]) {
            this.window[0] = x
        } 
        else if (x > this.window[2]) {
            this.window[2] = x
        }

        if (y < this.window[1]) {
            this.window[1] = y
        }
        else if (y > this.window[3]) {
            this.window[3] = y
        }

    }

    public resetWindow() {
        this.window = []
    }

    public getWindowMinWidth() {
        return this.window[0]
    }

    public getWindowMinHeight() {
        return this.window[1]
    }

    public getWindowMaxWidth() {
        return this.window[2]
    }

    public getWindowMaxHeight() {
        return this.window[3]
    }

    
    

}