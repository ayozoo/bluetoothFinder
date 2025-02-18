Page({
    // 页面的初始数据
    data: {
        deviceId: '',          // 蓝牙设备ID
        deviceName: '',        // 蓝牙设备名称
        deviceRssi: 0,         // 当前设备的信号强度
        direction: 0,          // 当前设备方向
        maxRssi: -100,        // 记录最大信号强度
        maxDirection: 0,       // 记录最大信号强度时的方向
        distance: 0,           // 估算的设备距离
        arrowRotation: 0,      // 箭头旋转角度
        lastCompassValue: 0,   // 上一次的罗盘数值
        compassBuffer: []      // 罗盘数据缓冲区，用于平滑处理
    },

    // 页面加载时执行的函数
    onLoad(options) {
        // 设置设备ID和名称
        this.setData({
            deviceId: options.deviceId,
            deviceName: options.deviceName || '未知设备'
        })
        // 启动设备监听和方向监听
        this.startDeviceWatch()
        this.startCompass()
    },

    // 开始监听蓝牙设备
    startDeviceWatch() {
        wx.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,  // 允许重复上报设备
            success: () => {
                // 监听发现新设备事件
                wx.onBluetoothDeviceFound((result) => {
                    const device = result.devices[0]
                    // 只处理目标设备的数据
                    if (device.deviceId === this.data.deviceId) {
                        // 计算平均信号强度和估算距离
                        const rssi = this.calculateAverageRSSI(device.RSSI)
                        const distance = this.calculateDistance(rssi).toFixed(2)

                        // 更新数据
                        this.setData({
                            deviceRssi: rssi,
                            distance: distance
                        })

                        // 如果发现信号强度明显增强，更新最大值和方向
                        if (rssi > this.data.maxRssi + 2) {
                            const absoluteDirection = this.data.direction
                            this.setData({
                                maxRssi: rssi,
                                maxDirection: absoluteDirection,
                                arrowRotation: 0
                            })
                        }
                    }
                })
            }
        })
    },

    // 启动罗盘监听
    startCompass() {
        wx.startCompass()
        // 监听罗盘数据变化
        wx.onCompassChange((res) => {
            // 使用缓冲区平滑罗盘数据
            this.updateCompassBuffer(res.direction)
            const smoothedDirection = this.calculateSmoothedDirection()

            // 计算设备相对于手机的方向
            const deviceDirection = this.data.maxDirection
            const phoneDirection = smoothedDirection

            // 计算相对角度并确保在0-360度范围内
            let relativeAngle = (deviceDirection - phoneDirection)
            relativeAngle = ((relativeAngle % 360) + 360) % 360

            // 更新方向数据
            this.setData({
                direction: 0,
                arrowRotation: relativeAngle,
            })
        })
    },

    // 更新罗盘数据缓冲区
    updateCompassBuffer(direction) {
        const buffer = this.data.compassBuffer
        buffer.push(direction)
        // 保持缓冲区最多5个数据
        if (buffer.length > 5) {
            buffer.shift()
        }
        this.setData({ compassBuffer: buffer })
    },

    // 计算平滑后的方向值
    calculateSmoothedDirection() {
        const buffer = this.data.compassBuffer
        if (buffer.length === 0) return 0

        // 使用中位数来处理异常值
        const sorted = [...buffer].sort((a, b) => a - b)
        const median = sorted[Math.floor(buffer.length / 2)]

        // 使用加权平均计算平滑方向
        let sum = 0
        let weightSum = 0
        buffer.forEach((value, index) => {
            const weight = (index + 1)
            // 处理角度突变（如从359度到0度）
            let adjustedValue = value
            if (Math.abs(value - median) > 180) {
                adjustedValue = value > median ? value - 360 : value + 360
            }
            sum += adjustedValue * weight
            weightSum += weight
        })

        // 计算最终方向并确保在0-360度范围内
        let smoothedDirection = sum / weightSum
        return ((smoothedDirection % 360) + 360) % 360
    },

    // 根据RSSI计算估算距离
    calculateDistance(rssi) {
        const txPower = -59 // 1米处的参考信号强度
        const n = 2.0      // 环境衰减因子
        return Math.pow(10, (txPower - rssi) / (10 * n))
    },

    // 计算RSSI的平均值
    calculateAverageRSSI(newRssi) {
        // 初始化RSSI缓冲区
        if (!this.rssiBuffer) {
            this.rssiBuffer = []
        }

        // 更新RSSI缓冲区
        this.rssiBuffer.push(newRssi)
        if (this.rssiBuffer.length > 5) {
            this.rssiBuffer.shift()
        }

        // 计算平均值
        return this.rssiBuffer.reduce((a, b) => a + b) / this.rssiBuffer.length
    },

    // 页面卸载时清理资源
    onUnload() {
        wx.stopBluetoothDevicesDiscovery()
        wx.stopCompass()
    }
}) 