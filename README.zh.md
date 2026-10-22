# dsh-approval-enter

**在 DeepSeek Harness（DSH）里按 `Enter` 确认权限申请，按 `Esc` 拒绝，全程不用鼠标。**

[English](README.md)

## 它解决什么问题

DSH 的审批卡片其实已经支持 `Enter` = 允许一次、`Esc` = 拒绝，但那段按键处理只在**焦点位于卡片内部**时才生效。审批出现时卡片会顶替输入框，焦点退回 `body`，于是：

- 按 `Enter` 什么也不发生；
- 你只能先用鼠标点一下卡片（或直接点按钮）才能继续。

这个插件补的就是这一步。

## 它做了什么

- 审批卡片一出现，就把焦点移到卡片自身那个可聚焦区域，官方那段 `Enter` / `Esc` 处理立刻生效；
- 如果焦点后来跑到别处（点了对话区、`Tab` 离开、或者根本没焦点），插件在捕获阶段把 `Enter` / `Esc` 转交给卡片自己的处理器；
- **不会替你决定**：没有自动批准、没有超时默认值，回答仍然走 DSH 的待处理请求锁、输入法保护和重复按键保护；
- 不抢输入框的焦点，也不动其它任何按键——输入框里有焦点时，`Enter` 仍然是换行/发送。

## 安装

从 npm（发布后）走插件管理器：

```sh
dsh plugin --profile <profile> add dsh-approval-enter
```

本地开发用软链：

```sh
dsh plugin --profile <profile> add link:/绝对路径/dsh-approval-enter
```

也可以手动放置：把包放进 `<DSH_HOME>/profiles/<profile>/plugins/`，在该 profile 的
`node_modules` 里建立链接，并把 `dsh-approval-enter` 加进 profile `package.json` 的
`dsh.profile.bundles`。

**装完必须重启 DeepSeek Harness。** 宿主只在启动时组合 profile，刷新页面不够。

## 验证

1. 设置 → 插件列表里能看到 **回车批准 / Enter to approve**，且处于启用状态；
2. 触发一次需要授权的操作；
3. 别碰鼠标，直接按 `Enter`——应当立刻「允许一次」；
4. 再来一次按 `Esc`——应当「拒绝」。

审批只在会询问的权限模式下出现。**完全权限**模式下 DSH 根本不会发起审批，所以不会有卡片可确认——这是预期行为，不是插件失效。

## 兼容性

针对 DSH `0.2.1-rc.2`（桌面端 / Web UI）开发并验证。插件依赖
`@deepseek-ai/dsh-client-ui-approval` 发布的两个结构属性：

- `[data-approval-key]`——卡片根节点；
- `[data-approval-scroll]`——卡片上 `tabindex=0` 的那块区域。

如果未来版本改了这两个属性名，`client.js` 顶部的选择器要同步更新。除此之外不改动产品：
不碰 `app.asar`，不改任何产品源码。

## 实现要点

`client.js` 注册一个懒加载的 Client 模块（`dsh.client`，`immediately: true`）。挂载后：

1. 用 `MutationObserver` 监听 DOM，最多每帧扫描一次有没有新的审批卡片；
2. 卡片出现时聚焦 `[data-approval-scroll]`（有文本框正在输入时跳过）；
3. 在捕获阶段监听 `keydown`：只要存在卡片、焦点不在卡片内、且事件目标不是文本控件，就先聚焦卡片再把按键重放给它。

重放是关键：官方处理器会检查 `currentTarget.contains(document.activeElement)`，先聚焦再重放才能让它接住——这样回答仍然走产品自己的逻辑，而不是另写一套。

`index.js` 是一个空的 Host 半身，只为让 bundle 有一个可挂载的行。

## 卸载

用插件管理器移除该行，或删掉包和 `dsh.profile.bundles` 里的条目，然后重启。审批卡片恢复成只能点击。

## 许可证

MIT
