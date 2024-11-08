# Obsidian Xournal Integration Plugin

An obsidian plugin to seemlessly integrate Xournal(++) files into your Obdidian workflow. 

## Features

- Render Xournal Drawing directly in obsidian
- Auto-crop content so smaller drawings can be used in notes
- Creating new Xournal files from the folder context menu / command palette in obsidian
- Creating templates for Xournal files with placeholders
- Converting PDFs to Xournal files right in obsidian
- Searching through all Xournal files in your vault

## Demo

### Multiple commands for working with Xournal:
![image](https://github.com/user-attachments/assets/84a958a9-c5c0-4c8a-aac2-22b071ce0c47)

### How do I embed an xournal drawing
You can either
1. Run the "Embed Drawing" command from the command pallete
2. You enter the embed string manually in the format: `![[_xournal/week8_comp4250.xopp.md|xournal-embed]]`

### Create file from template:

https://github.com/Joshyx/obsidian-xournal-integration-plugin/assets/69637774/7985e44c-9efd-4243-8360-b8fb3d318e16

> You can use ${title} and ${date} in your template to automatically insert those values when creating a file

## How the renderer works
- every time a file is saved it will convert the xournal++ content to svg content, and save that into a file called `file_name.xopp.md`
- the file extension `xopp.md` will be hidden from the user
- to embed a xournal drawing, use format: `![[_xournal/week8_comp4250.xopp.md|xournal-embed]]`

### Render Fallback 
- if xournal++ file is an annotated PDF - it will fallback to exporting the drawing as a pdf and embed that (only on linux or macOS)

## FAQ
1. How do update my xournal++ changes in obsidian? You don't it will automatically do so when an xournal++ file is updated and when you load obsidian
2. What are the fallbacks with Windows? The plugin works with windows EXCEPT you cannot render any xournal++ drawings that an annotated PDF
3. How do I add my template for new drawings? You add 
4. What is the new xournal file folder? This is the folder where any new xournal drawings that you create will be added to

## Install Plugin
- Create folder in plugins directory called "xournal-integration"
  - path: `.obsidian/plugins/xournal-integration`
- Go to the releases tab and download main.js, mainfest.json and styles.css to that new folder  

## Setup Dev Environemnt/Build on Local Machine

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.
