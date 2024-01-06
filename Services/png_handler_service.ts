import XournalIntegrationPlugin from "../main";

import { inflateSync } from "zlib";

import { buf } from 'crc-32';
import { App, TFile, normalizePath } from "obsidian";

const { exec } = require('child_process');


const BYTES_PER_PIXEL = 4

export class PNGHandlerService {
    app: App
    plugin: XournalIntegrationPlugin
    Recon: number[]

    constructor(app: App, plugin: XournalIntegrationPlugin) {
        this.app = app
        this.plugin = plugin
        this.Recon = []
    }

    Recon_a(row: number, col: number, stride: number): number {
        return col >= BYTES_PER_PIXEL ? this.Recon[row * stride + col - BYTES_PER_PIXEL] : 0;
      }
    
      Recon_b(row: number, col: number, stride: number): number {
          return row > 0 ? this.Recon[(row - 1) * stride + col] : 0;
      }
    
      Recon_c(row: number, col: number, stride: number): number {
          return (row > 0 && col >= BYTES_PER_PIXEL) ? this.Recon[(row - 1) * stride + col - BYTES_PER_PIXEL] : 0;
      }
    
      PaethPredictor(a: number, b: number, c: number): number {
        const p: number = a + b - c;
        const pa: number = Math.abs(p - a);
        const pb: number = Math.abs(p - b);
        const pc: number = Math.abs(p - c);
    
        let Pr: number;
    
        if (pa <= pb && pa <= pc) {
            Pr = a;
        } else if (pb <= pc) {
            Pr = b;
        } else {
            Pr = c;
        }
    
        return Pr;
      }

      async cropImage(file: TFile){

        const coords = await this.getDimenstions(file)

        const basePath = (this.app.vault.adapter as any).basePath

        const filePath = normalizePath("\"" + basePath + "/" + file.path + "\"");

        const command = "convert " + filePath + " -crop " + coords[0] + "x" + coords[1] + "+" + coords[2] + "+" + coords[3] + " " + filePath;

        exec(command, (err: Error, output: string) => {
            // once the command has completed, the callback function is called
            if (err) {
                // log and return if we encounter an error
                console.error("could not execute command: ", err)
                return
            }
            // log the output received from the command
            console.log("Output: \n", output)
            })
      }
    
      async getDimenstions(file: TFile){
        const pngString = await this.app.vault.readBinary(file)
    
        const data = new Uint8Array(pngString)
    
    
        // Check if the file is a png
        if (data[0] !== 0x89) throw new Error('Invalid .png file header')
        if (data[1] !== 0x50) throw new Error('Invalid .png file header')
        if (data[2] !== 0x4E) throw new Error('Invalid .png file header')
        if (data[3] !== 0x47) throw new Error('Invalid .png file header')
        if (data[4] !== 0x0D) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?')
        if (data[5] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?')
        if (data[6] !== 0x1A) throw new Error('Invalid .png file header')
        if (data[7] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?')
      
    
        let idx = 8
        let uint8 = new Uint8Array(4)
        let int32 = new Int32Array(uint8.buffer)
        let uint32 = new Uint32Array(uint8.buffer)
    
        let height = 0
        let width = 0
        const BYTES_PER_PIXEL = 4
        let idat = []
    
        while (idx < data.length)  {
    
          uint8[3] = data[idx++]
          uint8[2] = data[idx++]
          uint8[1] = data[idx++]
          uint8[0] = data[idx++]
    
          let length = uint32[0] + 4
    
          let chunk = new Uint8Array(length)
          chunk[0] = data[idx++]
          chunk[1] = data[idx++]
          chunk[2] = data[idx++]
          chunk[3] = data[idx++]
    
    
          var name = String.fromCharCode(chunk[0], chunk[1], chunk[2], chunk[3])
    
          if(name === 'IHDR'){
            uint8[3] = data[idx]
            uint8[2] = data[idx+1]
            uint8[1] = data[idx+2]
            uint8[0] = data[idx+3]
            width = uint32[0]
    
            uint8[3] = data[idx+4]
            uint8[2] = data[idx+5]
            uint8[1] = data[idx+6]
            uint8[0] = data[idx+7]
            height = uint32[0]
          }
          
          else if (name === 'IEND') {
            break
          }else if(name === 'IDAT'){
            if(idat == null){
              throw new Error('IDAT chunk came before IHDR chunk')
            }
            for (let i = 0; i+4 < length; i++) {
              idat.push(data[idx+i] & 0xff)
            }
          }
    
          for (let i = 4; i < length; i++) {
            chunk[i] = data[idx++]
          }
    
          uint8[3] = data[idx++]
          uint8[2] = data[idx++]
          uint8[1] = data[idx++]
          uint8[0] = data[idx++]
      
          // Check if expected CRC matches the actual CRC
          if (buf(chunk) !== int32[0]) {
            throw new Error(
              'CRC values for ' + name + ' header do not match, PNG file is likely corrupted'
            )
          }
    
        }
    
    
        const stride = width * BYTES_PER_PIXEL
        const idat_decompressed = await inflateSync(Buffer.from(idat))
    
        let recon_x = 0
    
        let i = 0
    
    
        for (let row =0; row< height; row++){
          let filter_type = idat_decompressed[i++]
          for (let col = 0; col < stride; col++){
            let x = idat_decompressed[i++]
            if(filter_type == 0){
              recon_x = x
            }else if(filter_type == 1){
              recon_x = x + this.Recon_a(row, col, stride)
            }else if(filter_type == 2){
              recon_x = x + this.Recon_b(row, col, stride)
            }else if(filter_type == 3){
              recon_x = x + Math.floor((this.Recon_a(row, col,stride) + this.Recon_b(row, col, stride)) / 2)
            }else if(filter_type == 4){
              recon_x = x + this.PaethPredictor(this.Recon_a(row, col, stride), this.Recon_b(row, col, stride), this.Recon_c(row, col, stride))
            }else{
              throw new Error("Invalid filter type " + filter_type)
            }
            this.Recon.push(recon_x & 0xff);
          }
        }
    
        // Find min_x
        let col: number = 1;
        let min_x: number | null = null;
    
        while (col < width && min_x === null) {
            for (let row: number = 0; row < height; row++) {
                if (this.Recon[(col * BYTES_PER_PIXEL - 1) + (row * stride)] !== 0) {
                    min_x = col;
                    break;
                }
            }
            col++;
        }
    
    
        // // Find max_x
        col = width - 1;
        let max_x: number | null = null;
    
        while (col >= 0 && max_x === null) {
            for (let row: number = 0; row < height; row++) {
                if (this.Recon[(col * BYTES_PER_PIXEL - 1) + (row * stride)] !== 0) {
                    max_x = col;
                    break;
                }
            }
            col--;
        }
    
        // Find min_y
        let row: number = 1;
        let min_y: number | null = null;
    
        while (row < height && min_y === null) {
            for (let col: number = 0; col < width; col++) {
                if (this.Recon[(col * BYTES_PER_PIXEL - 1) + (row * stride)] !== 0) {
                    min_y = row;
                    break;
                }
            }
            row++;
        }
    
        // Find max_y
        row = height - 1;
        let max_y: number | null = null;
    
        while (row >= 0 && max_y === null) {
            for (let col: number = 0; col < width; col++) {
                if (this.Recon[(col * BYTES_PER_PIXEL - 1) + (row * stride)] !== 0) {
                    max_y = row;
                    break;
                }
            }
            row--;
        }
    
        if(min_x == null || max_x == null || min_y == null || max_y == null || min_x > max_x || min_y > max_y){
          return [0, 0, height, width]
        }
    
        // [width, height, offset_x, offset_y]
        return [(max_x - min_x + 1), (max_y - min_y + 1), min_x, min_y]
      }
}
