// logs.js
import init from '../../lib/libmupdf.js'

const app = getApp()
Page({
    data: {
        doc: null,
        counts: null,
        src: null,
        currentPage: 1,
        array: [],
        progress: 0
    },
    onLoad(options) {
        let screenWidth = wx.getSystemInfoSync().windowWidth;
        if (options && options.path) {
            this.data.path = options.path
            this.data.title = options.title
        }
        let that = this
        init({
            instantiateWasm(info, callback) {
                WXWebAssembly.instantiate('packageMupdf/lib/libmupdf.wasm', info).then(({instance}) => {
                    callback(instance)
                })
                return {}
            }
        }).then(Module => {
            Module.ccall('initContext');
            app.globalData.Module = Module
            app.globalData.wasm_openDocumentFromBuffer = Module.cwrap('openDocumentFromBuffer', 'number', ['number', 'number', 'string']);
            app.globalData.countPages = Module.cwrap('countPages', 'number', ['number']);
            app.globalData.pageWidth = Module.cwrap('pageWidth', 'number', ['number', 'number', 'number']);
            app.globalData.pageHeight = Module.cwrap('pageHeight', 'number', ['number', 'number', 'number']);
            app.globalData.getLastDrawData = Module.cwrap('getLastDrawData', 'number', []);
            app.globalData.getLastDrawSize = Module.cwrap('getLastDrawSize', 'number', []);
            app.globalData.doDrawPageAsPNG = Module.cwrap('doDrawPageAsPNG', 'null', ['number', 'number', 'number']);
            wx.getFileSystemManager().readFile({
                filePath: this.data.path,
                success(res) {
                    that.data.doc = that.openDocumentFromBuffer(res.data, that.data.title)
                    that.data.counts = app.globalData.countPages(that.data.doc);
                    let array = []
                    for (let i = 0; i < that.data.counts; i++) {
                        const width = app.globalData.pageWidth(that.data.doc, i + 1, 96);
                        const h = app.globalData.pageHeight(that.data.doc, i + 1, 96)
                        const height = h * (screenWidth - 10) / width
                        let data = that.drawPageAsPNG(that.data.doc, i + 1, 96)
                        let base64 = wx.arrayBufferToBase64(data)
                        array.push({width: screenWidth - 10, height, base64})
                        that.setData({
                            progress: ((i + 1) / that.data.counts * 100).toFixed(0)
                        })
                    }
                    that.setData({
                        array: array
                    })
                }
            })
        })

    },

    openDocumentFromBuffer(data, magic) {
        let n = data.byteLength;
        let ptr = app.globalData.Module._malloc(n);
        let src = new Uint8Array(data);
        app.globalData.Module.HEAPU8.set(src, ptr);
        return app.globalData.wasm_openDocumentFromBuffer(ptr, n, magic);
    },

    drawPageAsPNG(doc, page, dpi) {
        app.globalData.doDrawPageAsPNG(doc, page, dpi);
        let n = app.globalData.getLastDrawSize();
        let p = app.globalData.getLastDrawData();
        return app.globalData.Module.HEAPU8.buffer.slice(p, p + n);
    },

    preview(event) {
        let currentUrl = event.currentTarget.dataset.src
        wx.previewImage({
            current: currentUrl, // 当前显示图片的http链接
            urls: [currentUrl]
        })
    }
})
