# 实现说明

## 与课件的关系

参考材料为用户本地的《BVH文件解析.ppt》。其中第 10–12 页描述 HIERARCHY/MOTION 及通道数据顺序，第 26–28 页提醒缩放骨架时同步处理平移。原课件使用 MFC 类与 WM_TIMER，本工程改用 Electron、JavaScript、Three.js。文档内的“拷贝 BVH.cpp”“设置消息响应”等是材料中的教学内容，不是本项目必须执行的命令。

## 数据与正向运动学

解析结果包含 `joints[]`、`channelCount`、`frameCount`、`frameTime`、一维 `Float64Array frames`。每个 joint 存储 `parent`、`offset`、`channels`、`channelOffset`。关节 f 帧第 c 个通道从 `frames[f * channelCount + channelOffset + c]` 读取。

列向量约定下，令 offset 对应平移矩阵为 `T_offset`，声明的通道操作依次为 `C0..Cn`：

```text
M_local = T_offset × C0 × C1 × ... × Cn
M_world(root) = M_local(root)
M_world(joint) = M_world(parent) × M_local(joint)
p_world = M_world × (0,0,0,1)
```

例如常见 `Zrotation Xrotation Yrotation` 在本实现中为 `Rz × Rx × Ry`，不会交换成 `Rx × Ry × Rz`。End Site 没有动画通道，但参与末端骨骼绘制。

为避免 350° 到 10° 插值错误，先得到局部矩阵，再分解得到位置和四元数，位置用 LERP、旋转用最短路径 SLERP。采样在整数帧时不做额外插值。

## 时间与控制

```text
time += deltaSeconds × playbackSpeed
frame = floor(time / frameTime)
alpha = time / frameTime - frame
```

`requestAnimationFrame` 只负责更新显示，原数据的 `Frame Time` 才决定动作速度。暂停不累加时间；逐帧操作先暂停；拖进度条期间临时暂停，释放后恢复拖动前的播放状态。取消循环后到末尾自动暂停，再次播放从首帧开始。

## 显示变换

所有计算首先在源文件坐标系中完成。最终显示时统一执行可选向上轴旋转、初始原点平移与统一缩放：

```text
p_display = scale × (R_up × p_source - initialOrigin)
```

这使 offset、根平移和其他节点的平移自动遵循相同单位。首帧最低关节对齐地面；摄像机可跟随根节点的水平位移，但不取消角色本身的运动。

## 桌面安全与离线运行

Electron renderer 不启用 Node.js，启用 `contextIsolation`、`sandbox`、`webSecurity`。preload 只暴露 `openBVH()`，不暴露任意文件读写。主进程通过系统文件对话框获得用户选择，验证发送方、扩展名和大小后返回文本。禁止新窗口、页面导航及额外权限请求。

前端、字体、示例均被打包到本地，没有 CDN / 在线接口 / 遥测。生产运行不需要登录账号。后台 Worker 用于解析，渲染与播放控制留在主界面线程。

## 测试设计

- parser / playback 单元测试覆盖无效输入、通道顺序、旋转插值、速度、循环、帧精度。
- 使用独立的 Three.js `BVHLoader` 与 `AnimationMixer` 对课程数据的首帧、中间帧和接近末帧做位置对照，防止自写解析器和自写渲染逻辑相互掩盖错误。
- Electron smoke test 通过真实 DOM 控件、文件输入与拖放事件操作生产 renderer，验证进度、暂停、倍速、异常恢复；截图确认三维视图。测试中的自动文件输入/拖放不等同于人工点击系统原生对话框，此差异在验证记录中明确说明。

## 上游技术资料

- Three.js 官方 API 文档与 `examples/jsm/loaders/BVHLoader.js`（安装到 node_modules，版本由 lockfile 锁定）。
- Electron 官方 API 类型定义（BrowserWindow、ipcMain、dialog、contextBridge）随 electron 包安装。
- BVH 格式来源参考 Wisconsin Graphics Laboratory 的 Biovision BVH 格式说明。
