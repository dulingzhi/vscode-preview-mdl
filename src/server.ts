import * as browserSync from "browser-sync";
import { UiOption } from "./utility";
import * as http from "http";
import * as path from "path"
import * as fs from 'fs';
var PNG = require("pngjs");
var decode = require('war3-model/blp/decode');

class ServerData {
    bs:browserSync.BrowserSyncInstance;
    opt:browserSync.Options;

    constructor(_bs:browserSync.BrowserSyncInstance, _opt:browserSync.Options) {
        this.bs = _bs;
        this.opt = _opt;
    }
}

export class Server {

    static bsArray = new Array<ServerData>();

    public static Middleware(req: http.IncomingMessage, res: http.ServerResponse, next: Function) {
        res.setHeader("Access-Control-Allow-Origin", "*");

        var port = req.headers.host ? req.headers.host.split(":")[1] : 0
        var ext = req.url ? req.url.substr(req.url.lastIndexOf(".")) : ""
        if (port == Server.bsArray[0].opt.port && ext == ".blp")
        {
            let p = path.join(Server.bsArray[0].opt.server.baseDir as string, req.url)
            
            let blp = decode.decode(new Uint8Array(fs.readFileSync(p)).buffer)
            let imageData = decode.getImageData(blp, 0);
            let png = new PNG.PNG({ width: blp.width, height: blp.height, inputHasAlpha: true });

            // I don't know how to create PNG with existing data, so...
            for (let i = 0; i < imageData.data.length; ++i) {
                png.data[i] = imageData.data[i];
            }

            res.end(PNG.PNG.sync.write(png));
        }
        else
        {
            next();
        }
    }

    public static start(rootPath: string, port: number, isSync: boolean, proxy = "", ui: UiOption = null) {
        // get browserSync instance.
        
        let options: browserSync.Options;

        if (proxy === "") {
            options = {
                server: {
                    baseDir: rootPath,
                    directory: true,
                    middleware: [ this.Middleware ]
                },
                open: false,
                port: port,
                codeSync: isSync
            };
        } else {
            options = {
                proxy: proxy,
                serveStatic: ["."]
            };
        }

        if (ui.port && ui.weinrePort) {
            options.ui = {
                port: ui.port,
                weinre: {
                    port: ui.weinrePort
                }
            };
        }

        let bs: browserSync.BrowserSyncInstance;
        if (!browserSync.has("vscode-preview-server-" + port)) {
            bs = browserSync.create("vscode-preview-server-" + port);
            Server.bsArray.push(new ServerData(bs, options))
        } else {
            bs = browserSync.get("vscode-preview-server-" + port);
        }

        bs.init(options, (err) => {
            if (err) {
                console.log(err);
                bs.notify("Error is occured.");
            }

        });
    }

    public static stop() {
        for (var i = Server.bsArray.length - 1; i >= 0; --i)
        {
            Server.bsArray.pop().bs.exit();
        }
        // if (browserSync.has("vscode-preview-server")) {
        //     browserSync.get("vscode-preview-server").exit();
        // }
    }

    public static reload(fileName: string) {
        if (Server.bsArray.length > 0)
        {
            Server.bsArray[0].bs.reload(fileName)
        }
        // if (browserSync.has("vscode-preview-server")) {
        //     browserSync.get("vscode-preview-server").reload(fileName);
        // }
    }
}
