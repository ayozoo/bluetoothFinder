Page({
    data: {
        deviceId: '',
        deviceName: '',
        deviceRssi: 0,
        direction: 0,
        maxRssi: -100,
        maxDirection: 0,
        distance: 0
    },

    onLoad(options) {
        this.setData({
            deviceId: options.deviceId,
            deviceName: options.deviceName || '未知设备'
        })
        // 初始化设备监听
        this.startDeviceWatch()
        // 初始化方向监听
        this.startCompass()
    },

    startDeviceWatch() {
        wx.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,
            success: () => {
                wx.onBluetoothDeviceFound((result) => {
                    const device = result.devices[0]
                    if (device.deviceId === this.data.deviceId) {
                        const distance = this.calculateDistance(device.RSSI).toFixed(2)
                        this.setData({
                            deviceRssi: device.RSSI,
                            distance: distance
                        })
                        if (device.RSSI > this.data.maxRssi) {
                            this.setData({
                                maxRssi: device.RSSI,
                                maxDirection: this.data.direction
                            })
                        }
                    }
                })
            }
        })
    },

    calculateDistance(rssi) {
        const txPower = -59 //这是在1米距离处测得的参考信号强度值
        const n = 2.0
        return Math.pow(10, (txPower - rssi) / (10 * n))
    },

    startCompass() {
        wx.startCompass()
        wx.onCompassChange((res) => {
            this.setData({
                direction: res.direction
            })
        })
    },

    onUnload() {
        wx.stopBluetoothDevicesDiscovery()
        wx.stopCompass()
    }
}) 