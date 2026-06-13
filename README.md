# Codex++ Script Market

EstellaNines 的个人 Codex++ 用户脚本市场。此仓库只分发主人选定的三支改版脚本，不收录额外脚本。

## 市场索引

```text
https://raw.githubusercontent.com/EstellaNines/CodexPlusPlusScriptMarket/main/index.json
```

## 脚本清单

| 脚本 | 版本 | 改版内容 | 上游 |
| --- | --- | --- | --- |
| Codex Token Usage | 0.1.12 | 彩色 token 指标；固定随最新 Codex 回复显示，并修复徽标空框不显示文字。 | https://github.com/kokotao/codex-token-usage-script |
| Codex Context Used Meter | 38 | 彩色上下文用量文字；自动跟随 Codex 浅色/深色主题；默认从顶部下移显示；支持锁定/解锁图标按钮与持久化拖动位置。 | https://github.com/Minghou-Lei/codex-context-used-meter |
| Codex Main Transparency | 0.2.3 | 修复图片背景层被压到页面画布背后、或早于 body 注入时不可见的问题；本地背景图上限 32 MiB，并用 IndexedDB 保存导入图片。 | https://github.com/EstellaNines/CodexPlusPlusScriptMarket |

## 使用方式

在 Codex++ 管理工具的脚本市场中刷新并安装脚本；市场条目的 `script_url` 均指向本仓库内的改版脚本，`homepage` 保留原始上游来源。

脚本位置规则：

- Token Usage 固定随最新 Codex 回复显示。
- Context Used Meter 初次安装显示在页面上方偏下位置，不再贴近最上沿。
- Context Used Meter 点击右侧锁形图标后进入解锁移动状态。
- Context Used Meter 拖动到目标位置后，再次点击图标锁定。
- Context Used Meter 的位置保存在浏览器 `localStorage` 中，重启 Codex 后继续沿用。
- Codex Main Transparency 默认清除主界面、消息流、输入区与主区浮层的遮罩、阴影、blur 与大块背景；透明度滑块中 100% 表示完全透明，0% 表示显示调试材质，侧边栏仍尽量保留原有外观。
- Codex Main Transparency 的右下角入口可展开“透明与背景”面板，支持 background image URL、本地 `png/jpeg/webp/gif` 导入、背景透明度、铺满/完整/拉伸、背景模糊与自定义 shortcut；背景层位于页面画布之上、Codex 内容之下，并兼容早于 body 的注入时序，本地导入上限为 32 MiB，默认背景开关快捷键为 `Alt+B`。

## 文件

- `index.json`: Codex++ 脚本市场索引。
- `scripts/codex-token-usage.js`: Codex Token Usage 改版脚本。
- `scripts/codex-context-used-meter.js`: Codex Context Used Meter 改版脚本。
- `scripts/codex-main-transparency.js`: Codex Main Transparency 主界面透明材质脚本。
- `tests/`: 市场脚本契约测试。
