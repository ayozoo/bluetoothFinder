const bluetooth = {
  devices: [],

  initBluetooth() {
    wx.openBluetoothAdapter({
      success: () => console.log('蓝牙模块初始化成功'),
      fail: (err) => console.error('蓝牙模块初始化失败', err),
    });

    wx.onBluetoothAdapterStateChange((res) => {
      console.log('蓝牙适配器状态变化', res);
    });

    wx.onBluetoothDeviceFound((res) => {
      const newDevices = res.devices.map((device) => ({
        name: device.name || device.localName || '未知设备',
        deviceId: device.deviceId,
      }));
      this.devices = [...this.devices, ...newDevices];
    });
  },

  startDiscovery(callback) {
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: false,
      success: () => {
        console.log('开始搜索蓝牙设备');
        callback(this.devices);
      },
      fail: (err) => console.error('搜索蓝牙设备失败', err),
    });
  },

  stopDiscovery() {
    wx.stopBluetoothDevicesDiscovery({
      success: () => console.log('停止搜索蓝牙设备成功'),
      fail: (err) => console.error('停止搜索蓝牙设备失败', err),
    });
  },

  connectDevice(deviceId, callback) {
    wx.createBLEConnection({
      deviceId,
      success: () => {
        console.log('连接蓝牙设备成功');
        callback(deviceId);
      },
      fail: (err) => console.error('连接蓝牙设备失败', err),
    });
  },

  cleanup() {
    wx.closeBluetoothAdapter({
      success: () => console.log('蓝牙模块已关闭'),
      fail: (err) => console.error('关闭蓝牙模块失败', err),
    });
  },
};

module.exports = bluetooth;
