# 小说助手 · 安卓版打包说明

现有 Web 功能已通过 **Capacitor** 封装为安卓 App，代码与浏览器版共用，功能一致。

## 你需要先安装的环境

本机目前还没有 Java / Android SDK，请先安装：

1. **Android Studio**（推荐，自带 SDK）  
   https://developer.android.com/studio
2. 安装时勾选：
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device（可选，用于模拟器）
3. 打开 Android Studio → Settings → Languages & Frameworks → Android SDK  
   安装 **Android 14 (API 34)** 或更高
4. 安装 **JDK 21**（Android Studio 一般已自带）

安装完成后，把 SDK 路径记下来（常见为）：
`C:\Users\你的用户名\AppData\Local\Android\Sdk`

## 日常开发（改功能后同步到安卓）

在项目根目录执行：

```bash
# 1. 构建网页资源并同步到 android 工程
npm run android:sync

# 2. 用 Android Studio 打开工程
npm run android:open
```

在 Android Studio 里：

- 连接手机（开启开发者选项 + USB 调试），或启动模拟器
- 点击绿色 ▶ Run，即可安装运行

## 打可安装的 APK（给别人安装）

1. `npm run android:sync`
2. `npm run android:open`
3. 菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. 生成的文件一般在：
   `android/app/build/outputs/apk/debug/app-debug.apk`

把 APK 拷到手机安装即可（需允许「未知来源」）。

## 上架应用商店（正式签名包）

1. 在 Android Studio：**Build → Generate Signed Bundle / APK**
2. 选择 **Android App Bundle (.aab)**（多数商店要求）
3. 创建并妥善保管 keystore（丢失无法更新同包名应用）
4. 提交到：应用宝 / 华为 / 小米 / Google Play 等

包名：`com.novelassistant.app`  
应用名：小说助手

## 安卓版相对浏览器的增强

- 返回键：有历史则后退，否则退出
- 导出 TXT / PNG：调用系统分享面板，可保存到文件管理器
- 状态栏 / 安全区适配
- 离线可用（资源打进 APK；AI 功能仍需网络 + API Key）

## 常用命令一览

| 命令                   | 作用                     |
| ---------------------- | ------------------------ |
| `npm run dev`          | 浏览器开发（和以前一样） |
| `npm run build`        | 仅构建网页               |
| `npm run android:sync` | 构建并同步到安卓工程     |
| `npm run android:open` | 打开 Android Studio      |
| `npm run android:run`  | 同步后尝试直接跑到设备   |

## 注意

- 改了前端代码后，必须再执行一次 `npm run android:sync`，安卓里才会更新
- 浏览器版（`npm run dev`）仍然可用，互不影响
- 数据仍保存在 App 内本地存储；卸载 App 会清空数据，请定期导出备份
