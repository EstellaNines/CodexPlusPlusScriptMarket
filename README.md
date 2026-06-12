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
| Codex Main Transparency | 0.1.1 | 让 Codex 主界面使用接近侧边栏的透明玻璃材质；安装即生效，不额外写入位置或开关状态。 | https://github.com/EstellaNines/CodexPlusPlusScriptMarket |

## 使用方式

在 Codex++ 管理工具的脚本市场中刷新并安装脚本；市场条目的 `script_url` 均指向本仓库内的改版脚本，`homepage` 保留原始上游来源。

脚本位置规则：

- Token Usage 固定随最新 Codex 回复显示。
- Context Used Meter 初次安装显示在页面上方偏下位置，不再贴近最上沿。
- Context Used Meter 点击右侧锁形图标后进入解锁移动状态。
- Context Used Meter 拖动到目标位置后，再次点击图标锁定。
- Context Used Meter 的位置保存在浏览器 `localStorage` 中，重启 Codex 后继续沿用。
- Codex Main Transparency 只覆盖主界面、消息流、输入区与浮层材质，尽量保留侧边栏原有外观。

## 文件

- `index.json`: Codex++ 脚本市场索引。
- `scripts/codex-token-usage.js`: Codex Token Usage 改版脚本。
- `scripts/codex-context-used-meter.js`: Codex Context Used Meter 改版脚本。
- `scripts/codex-main-transparency.js`: Codex Main Transparency 主界面透明材质脚本。
- `tests/`: 市场脚本契约测试。
