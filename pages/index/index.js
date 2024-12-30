const bluetooth = require('../../utils/bluetooth');

Page({
  data: {
    devices: [], // 蓝牙设备列表
    connectedDeviceId: null, // 当前连接的设备
  },

  onLoad() {
    bluetooth.initBluetooth();
  },

  // 开始搜索蓝牙设备
  startBluetooth() {
    bluetooth.startDiscovery((newDevices) => {
      this.setData({
        devices: newDevices,
      });
    });
  },

  // 停止搜索蓝牙设备
  stopBluetooth() {
    bluetooth.stopDiscovery();
  },

  // 连接蓝牙设备
  connectBluetooth(e) {
    const deviceId = e.currentTarget.dataset.id;
    bluetooth.connectDevice(deviceId, (connectedDeviceId) => {
      this.setData({ connectedDeviceId });
      wx.showToast({
        title: '连接成功',
        icon: 'success',
      });
    });
  },

  // 页面卸载时清理蓝牙连接
  onUnload() {
    bluetooth.cleanup();
  },
});
