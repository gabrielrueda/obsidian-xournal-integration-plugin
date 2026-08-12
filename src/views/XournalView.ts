import { FileView, ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import XournalParserService from 'src/services/XournalParserService';
const { performance } = require('perf_hooks');


export const VIEW_TYPE = 'xournal-view';

export class XournalView extends FileView {
  private parser: XournalParserService;

  constructor(leaf: WorkspaceLeaf, parser: XournalParserService) {
    super(leaf);
    this.parser = parser;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    if (this.file) {
      return this.file.name;
    }
    return 'Xournal File';
  }

  async onOpen() {
   
  }

  async onLoadFile(file: TFile): Promise<void> {
      const container = this.contentEl;
      container.empty();

      // await parseXournalXML3(file, this.app, drawing)

      const starttime = performance.now()
      const drawing = await this.parser.renderDrawing(file, container)
      const endtime = performance.now()

      console.log(`Time to read all ${endtime - starttime}ms`)


      // console.time("serialize timer")

      // drawing.serializeToCanvas(container)

      // console.timeEnd("serialize timer")

  }

  modify(x: string[]) {
    x.push("success")
  }

  async onClose() {
    // Nothing to clean up.
  }
}


// See here for the embed: https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/master/src/view/components/CustomEmbeddable.tsx
// basically we return an iframe that references the obsidian view