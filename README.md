# Codex++ Script Market

EstellaNines 的个人 Codex++ 用户脚本市场。此仓库只分发主人选定的两支改版脚本，不收录额外脚本。

## 市场索引

```text
https://raw.githubusercontent.com/EstellaNines/CodexPlusPlusScriptMarket/main/index.json
```

## 脚本清单

| 脚本 | 版本 | 改版内容 | 上游 |
| --- | --- | --- | --- |
| Codex Token Usage | 0.1.8 | 彩色 token 指标；新增锁定/解锁按钮；解锁后可拖动位置并持久化保存。 | https://github.com/kokotao/codex-token-usage-script |
| Codex Context Used Meter | 34 | 彩色上下文用量文字、进度提示与轻量状态展示。 | https://github.com/Minghou-Lei/codex-context-used-meter |

## 使用方式

在 Codex++ 管理工具的脚本市场中刷新并安装脚本；市场条目的 `script_url` 均指向本仓库内的改版脚本，`homepage` 保留原始上游来源。

Token Usage 的位置控制在 Codex App 页面内完成：

- 初次安装仍随最新 Codex 回复显示。
- 点击 badge 右侧的“锁”按钮后进入解锁移动状态。
- 拖动 badge 到目标位置，再点击“移”按钮锁定。
- 位置保存在浏览器 `localStorage` 中，重启 Codex 后继续沿用。

## 文件

- `index.json`: Codex++ 脚本市场索引。
- `scripts/codex-token-usage.js`: Codex Token Usage 改版脚本。
- `scripts/codex-context-used-meter.js`: Codex Context Used Meter 改版脚本。
- `tests/`: 市场脚本契约测试。
