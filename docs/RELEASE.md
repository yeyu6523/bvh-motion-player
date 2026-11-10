# Windows EXE 发布记录

验证日期：2026-11-10（Asia/Shanghai）。

## 最终产物

- 文件名：`BVH-Motion-Player-1.0.0-win-x64.exe`
- 大小：111257771 bytes
- SHA256：`17b8e68f338efe427c55be59a60a037400e387c41afe4e255791d1d046e3d689`
- 类型：Windows x64 portable EXE，未签名。
- 源码直接存放于公开仓库，EXE 只作为 Release 附件，不替代源码。

## 实际验证

1. 生产构建与 electron-builder 打包成功，退出码 0。
2. 直接启动上述最终 portable EXE，传入 `--smoke-test`，不是仅启动开发环境。
3. 最终 EXE 内运行 29 项检查，含 11 个原始 BVH 文件，退出码 0，rendererErrors 为 0。
4. 最终 EXE 的文件指纹在运行后重新计算。

原始结构化结果见 [portable-report.json](validation/portable-report.json)。截图为同一构建内 renderer 的真实截图。

## 构建命令与依赖修复

```powershell
npm ci
npm test
npm run test:desktop
npm run dist:win
```

本机首次下载 Electron 的 Node 网络请求失败，改从官方 electron/electron Release 获取同版本运行库，并与 electron 包自带 checksums.json 的 SHA256 核对成功。随后使用已校验的本地运行库执行：

```powershell
npm run dist:win -- --config.electronDist=node_modules/electron/dist
```

这只改变运行库来源，不修改应用功能或最终打包配置。原 Electron zip 仅在本机 output/runtime 中作为构建缓存，未加入源码仓库或要求用户提交。

## 发布边界与恢复

- GitHub 登录凭据缺少 workflow scope，因此自动构建 YAML 作为 `docs/ci-windows.yml` 模板保留，未激活 Actions；不宣称远程 CI 已运行。
- 代码、字体、渲染库、内置示例均本地打包。用户课件、课程原始 motion 文件、视频不发布。
- 重新获得源码可克隆公开仓库并检出 `v1.0.0` 标签；原始用户文件未被修改，无需还原。
- 移除本程序只需退出并删除 EXE；portable 临时运行目录由打包运行器管理。
