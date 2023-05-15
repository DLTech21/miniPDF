// index.js
// 获取应用实例

const app = getApp()
Page({
    data: {
    },

    onShareAppMessage(options) {

    },

    onLoad() {
        wx.showShareMenu()
    },

    checkPDF() {
        this.data.type = 1
        let that = this
            wx.chooseMessageFile({
                count: 1,
                type: 'file',
                extension: ['pdf'],
                success(res) {
                    console.log(res)
                    let title = res.tempFiles[0].name
                    wx.navigateTo({
                        url: `/packageMupdf/pages/logs/logs?path=${res.tempFiles[0].path}&title=${title}`
                    })
                }
            });
    },


})
