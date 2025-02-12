Page({
    data: {
        deviceId: '',
        deviceName: '',
        deviceRssi: 0,
        direction: 0,
        maxRssi: -100,
        maxDirection: 0,
        distance: 0,
        arrowRotation: 0,
        relativePosition: '正前方',
        lastCompassValue: 0,
        compassBuffer: []
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
                        const rssi = this.calculateAverageRSSI(device.RSSI)
                        const distance = this.calculateDistance(rssi).toFixed(2)
                        
                        this.setData({
                            deviceRssi: rssi,
                            distance: distance
                        })
                        
                        if (rssi > this.data.maxRssi + 2) {
                            // 修正：使用相对于北方的角度
                            const absoluteDirection = this.data.direction
                            this.setData({
                                maxRssi: rssi,
                                maxDirection: absoluteDirection,
                                // 箭头旋转角度需要是相对于当前方向的角度
                                arrowRotation: 0
                            })
                        }
                    }
                })
            }
        })
    },

    startCompass() {
        wx.startCompass()
        wx.onCompassChange((res) => {
            // 使用缓冲区平滑罗盘数据
            this.updateCompassBuffer(res.direction)
            const smoothedDirection = this.calculateSmoothedDirection()
            
            // 计算相对方向
            const deviceDirection = this.data.maxDirection
            const phoneDirection = smoothedDirection
            
            // 计算设备相对于手机的角度
            let relativeAngle = (deviceDirection - phoneDirection)
            
            // 确保角度在 0-360 范围内
            relativeAngle = ((relativeAngle % 360) + 360) % 360
            
            // 获取相对位置描述
            const position = this.getRelativePosition(relativeAngle)
            
            this.setData({
                direction: smoothedDirection,
                arrowRotation: relativeAngle,
                relativePosition: position
            })
        })
    },

    updateCompassBuffer(direction) {
        const buffer = this.data.compassBuffer
        buffer.push(direction)
        if (buffer.length > 5) {
            buffer.shift()
        }
        this.setData({ compassBuffer: buffer })
    },

    calculateSmoothedDirection() {
        const buffer = this.data.compassBuffer
        if (buffer.length === 0) return 0
        
        // 处理角度突变
        const sorted = [...buffer].sort((a, b) => a - b)
        const median = sorted[Math.floor(buffer.length / 2)]
        
        // 计算加权平均
        let sum = 0
        let weightSum = 0
        buffer.forEach((value, index) => {
            // 更新权重，最新的数据权重最大
            const weight = (index + 1)
            // 处理角度突变
            let adjustedValue = value
            if (Math.abs(value - median) > 180) {
                adjustedValue = value > median ? value - 360 : value + 360
            }
            sum += adjustedValue * weight
            weightSum += weight
        })
        
        let smoothedDirection = sum / weightSum
        // 确保结果在 0-360 范围内
        return ((smoothedDirection % 360) + 360) % 360
    },

    getRelativePosition(angle) {
        // 定义更精确的方位扇区
        const sectors = [
            { min: 337.5, max: 22.5, name: '正前方' },
            { min: 22.5, max: 67.5, name: '右前方' },
            { min: 67.5, max: 112.5, name: '右方' },
            { min: 112.5, max: 157.5, name: '右后方' },
            { min: 157.5, max: 202.5, name: '正后方' },
            { min: 202.5, max: 247.5, name: '左后方' },
            { min: 247.5, max: 292.5, name: '左方' },
            { min: 292.5, max: 337.5, name: '左前方' }
        ]
        
        // 查找当前角度所在的扇区
        const sector = sectors.find(s => {
            if (s.min > s.max) { // 处理跨越360度的情况
                return angle >= s.min || angle < s.max
            }
            return angle >= s.min && angle < s.max
        })
        
        return sector ? sector.name : '正前方'
    },

    calculateDistance(rssi) {
        const txPower = -59 //这是在1米距离处测得的参考信号强度值
        const n = 2.0
        return Math.pow(10, (txPower - rssi) / (10 * n))
    },

    calculateAverageRSSI(newRssi) {
        if (!this.rssiBuffer) {
            this.rssiBuffer = []
        }

        this.rssiBuffer.push(newRssi)
        if (this.rssiBuffer.length > 5) {
            this.rssiBuffer.shift()
        }

        return this.rssiBuffer.reduce((a, b) => a + b) / this.rssiBuffer.length
    },

    onUnload() {
        wx.stopBluetoothDevicesDiscovery()
        wx.stopCompass()
    }
}) 