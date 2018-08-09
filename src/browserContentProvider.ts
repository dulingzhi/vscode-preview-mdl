"use strict";
import * as vscode from "vscode";
import { Utility } from "./utility";
import * as path from "path";

export class BrowserContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    public provideTextDocumentContent() {
        const editor = vscode.window.activeTextEditor;
        const uri = Utility.getUriOfActiveEditor();
        const htmlUri = Utility.getUriOfHtml();
        const ext = path.extname(editor.document.fileName);

        if (ext != ".mdl" && ext != ".blp") {
            return `
				<body>
					Active editor doesn't show a HTML document
				</body>`;
        }

        return `<style>iframe { background-color: white } </style>
                <iframe src="${htmlUri}?${uri}" frameBorder="0" width="100%" height="1000px" />`;
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }
}
