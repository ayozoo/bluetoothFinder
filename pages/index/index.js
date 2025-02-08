Page({
    data: {
        isBluetoothEnabled: false,  // 蓝牙是否可用
        isScanning: false,          // 是否正在搜索
        devicesList: [],            // 设备列表
    },

    onLoad() {
        // 页面加载时检查蓝牙状态
        this.checkBluetoothStatus()
    },

    onShow() {
        // 页面显示时检查蓝牙状态
        this.checkBluetoothStatus()
    },

    checkBluetoothStatus() {
        // 获取系统信息
        wx.getSystemInfo({
            success: (res) => {
                const isEnabled = res.bluetoothEnabled
                this.setData({
                    isBluetoothEnabled: isEnabled
                })

                if (isEnabled) {
                    this.initBluetooth()
                }
            }
        })
    },

    // 打开蓝牙设置页面
    openBluetoothSetting() {
        wx.openSystemBluetoothSetting({
            success: (res) => {
                wx.showToast({
                    title: '请开启蓝牙',
                    icon: 'none'
                })
            }
        })
    },

    // 初始化蓝牙模块
    initBluetooth() {
        // 用于初始化蓝牙模块
        wx.openBluetoothAdapter({
            mode: 'central',// 作为中央设备模式
            success: (res) => {
                console.log('蓝牙初始化成功', res)
                this.setData({
                    isBluetoothEnabled: true
                })

                // 监听蓝牙状态变化
                this.watchBluetoothStatus()
            },
            fail: (err) => {
                console.error('蓝牙初始化失败', err)
                this.setData({
                    isBluetoothEnabled: false
                })
            }
        })
    },

    // 监听蓝牙状态
    watchBluetoothStatus() {
        wx.onBluetoothAdapterStateChange((res) => {
            this.setData({
                isBluetoothEnabled: res.available
            })

            if (!res.available) {
                this.setData({
                    devicesList: [],
                    isScanning: false
                })
            }
        })
    },

    // 开始扫描
    startScan() {
        if (!this.data.isBluetoothEnabled) {
            wx.showToast({
                title: '请先开启蓝牙',
                icon: 'none'
            })
            return
        }

        this.setData({
            isScanning: true,
            devicesList: []
        })

        // 先停止之前的搜索
        wx.stopBluetoothDevicesDiscovery({
            complete: () => {
                // 开始新的搜索
                wx.startBluetoothDevicesDiscovery({
                    allowDuplicatesKey: false,// 不允许发现同一个设备
                    interval: 0,// 搜索频率
                    success: (res) => {
                        // 监听发现新设备事件
                        this.onDeviceFound()
                    },
                    fail: (err) => {
                        console.error('搜索失败', err)
                        this.setData({
                            isScanning: false
                        })
                        wx.showToast({
                            title: '搜索失败',
                            icon: 'none'
                        })
                    }
                })
            }
        })
    },

    // 监听发现新设备
    onDeviceFound() {
        // 监听发现新设备的事件
        wx.onBluetoothDeviceFound((result) => {
            if (result.devices && result.devices[0]) {
                const newDevice = result.devices[0]
                // 计算距离
                newDevice.distance = this.calculateDistance(newDevice.RSSI).toFixed(2)

                // 更新设备列表
                const devicesList = [...this.data.devicesList]
                const idx = devicesList.findIndex(d => d.deviceId === newDevice.deviceId)

                if (idx === -1) {
                    devicesList.push(newDevice)
                } else {
                    devicesList[idx] = newDevice
                }

                this.setData({
                    devicesList: devicesList.sort((a, b) => b.RSSI - a.RSSI)
                })
            }
        })
    },

    // 停止扫描
    stopScan() {
        wx.stopBluetoothDevicesDiscovery({
            success: (res) => {
                this.setData({
                    isScanning: false
                })
            }
        })
    },

    // 选择设备
    selectDevice(e) {
        const device = e.currentTarget.dataset.device
        console.log('选择设备:', device)

        // 这里可以添加设备连接逻辑
        wx.showToast({
            title: '选择设备：' + (device.name || '未知设备'),
            icon: 'none'
        })
        wx.navigateTo({
            url: `/pages/device-radar/device-radar?deviceId=${device.deviceId}&deviceName=${device.name || '未知设备'}`
        })
    },

    // 计算距离
    // 根据RSSI信号强度计算估算距离
    /**
     * 
     * @param {*} rssi 
     *  使用RSSI（接收信号强度指示）计算距离
        txPower: 在1米距离处测得的信号强度
        n: 环境衰减因子，不同环境有不同的值
           在自由空间中理论值是2.0
           在室内可能是3.0-4.0
           在有障碍物的环境可能更高
           这个值需要根据实际环境调整
        RSSI = -10n * log(d) + A
        n = 2 (环境衰减因子)
        A = -59 (发射功率)
     */
    calculateDistance(rssi) {
        const txPower = -59 //这是在1米距离处测得的参考信号强度值
        const n = 2.0
        return Math.pow(10, (txPower - rssi) / (10 * n))
    },

    onUnload() {
        // 页面卸载时清理
        this.stopScan()
        wx.closeBluetoothAdapter()
    }
})