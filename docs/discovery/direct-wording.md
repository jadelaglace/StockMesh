# Direct wording evidence

Purpose: retain selected exact user language needed to detect drift. This is recovery evidence, not the current requirements authority.

## DW-001 — Initial StockMesh brief

- Source: direct user instruction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; interpreted by [current requirements](../product/requirements.md)
- Retrieval phrases: “往网络里一丢”, “结合上下文立刻照妖镜”, “实用主义社交网络分析”

> 项目 StockMesh ，仓库 gh 新建
>
> 简介：
> 我打算建模 类似网络分析，跨部门的人关系 行为偏好 时间线 事件 言论立场分析透视出来 这样 以后就没新鲜事，往网络里一丢，结合上下文立刻照妖镜，然后我慢慢学慢慢悟
>
> 狭义背景：
> 公司场景下 实用主义社交网络分析
>
> 广义：
> 社交网络 社群网络 宏观网络（人 利益体 物质能源上的 甚至生物群居的 甚至未来AI机械族群 宇宙星团分析）分析
>
> 基于上述背景 快速组织仓库init 组织product-docs结构 并且agent 跟随观察 看看skill在init阶段有什么可以优化的点记录下来

The external conversations supplied with the same instruction are governed by the [external material register](source-register.md); no locator or conversation content is retained in this public repository.

## DW-002 — Public repository and case-data boundary

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; supersedes retention of Kimi locators and governs public-repository content
- Retrieval phrases: “致敬 StockFish”, “链接也不要保存”, “案例要解耦”

> StockMesh 致敬 StockFish ，并且StockMesh gh上public 但是kimi对话证据和案例要解耦脱敏 kimi链接也不要保存 只拿内容。以后也都注意 案例要解耦，除非作为模板 明确允许才脱敏后上传

## DW-003 — Tribute and licensing boundary

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; governs attribution, source independence, and repository license
- Retrieval phrases: “不引用stockfish源码”, “MIT 协议”

> 如果你要加致敬 要说清楚但是不引用stockfish源码  ；stockMesh本身MIT 协议；

## DW-004 — Keep the tribute lightweight

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; narrows how DW-003 is presented
- Retrieval phrases: “不用写这么细”, “一句话带过”

> 你不用写这么细 一句话带过致敬甚至先不写都行

## DW-005 — Name-only tribute

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; further narrows DW-003 and DW-004
- Retrieval phrases: “纯名字致敬”

> 纯名字致敬

## DW-006 — Chess-like domain, simulation, UI, and Agent interface

- Source: direct user instruction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; candidate product direction awaiting structured review
- Retrieval phrases: “广义的棋盘”, “pawn 棋子”, “局势”, “盘面评分系统”, “决策回溯引擎”, “精准的军师”

> domain先规划好了 举个例子 像stcokfish一样 首先是一个广义的棋盘 广场 payground也好
> 然后是pawn 棋子   棋子就是狭义的一个人 或者一个分析节点 例如 公司啊 组织啊 等 。pawn带一堆属性 比如人 那就是性格  处事风格 能力 外在内在 位置等等
> 然后就是棋盘事件 当下 谁登场了加入了（棋里面可能少见） 谁暂时退出啊 在场的什么关系 设么职位 什么事 在微信啊 打字啊 还是视频啊 还是会议室啊 还是研发现场啊 还是销售现场啊 balabla 说简单点 局势 也就是下棋里的一个盘面
>
> 然后就是时间线 比如谁拉了个群 都谁 说了啥 立场咋变 气氛咋变 下一步建议怎么说话 谁会干啥的预测 像下棋预测一样 局势之间怎么变动的 预测 分析 建议
>
> 盘面评分系统 对每一个局势 盘面 分析评分 。决策回溯引擎 下棋里历史招数不咋影响盘面 现实里还是有点影响的 不过也可以把历史信息作为当前盘面要素来对待 那其实就还是盘面概念 给盘面评分
>
> 然后 盘面能怎么发展 下一步 谁说什么话 谁什么反应 连锁几步 推演 每一步如果什么盘面 什么评分 找出10步20步最优解 好了 大概就是这玩意 其实很像下棋 只不过这个就是多方博弈 信息可能更抽象点。
>
> 这个更多是 预测小时级别啊 天月级别 季度年级别的 太碎的 几秒这种级别的 瞬间的 微妙的 这个要靠真人的 他没法。他就像一个识别精准 计策精准的军师。
>
> 这个大概率要有ui的 网页web就像个下棋软件一样 怎么走下一步 其实也就是主要靠打字对话 类似控制台输入 或者是导入对话表啊 历史截图啊 agent要分析的 ui大概就是一个我描述的盘面 时间线 这种 然后有个对话框 可以输入信息，然后pawn有些子对话框啊 记录啊这些
>
> 也做好给外面agent用的skill 接口 规划下吧 我看看

## DW-007 — Preserve the unfinished A-perspective case as a private game record

- Source: direct user instruction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; authorizes private case staging but not public-repository publication
- Retrieval phrases: “完整保留作为一次棋谱”, “正谱”, “分支预测”, “还没下完”, “备选数据”

> Kimi会话 开始有两个小例子 先不管 后面以A为视角的系列过程 你完整保留作为一次“棋谱” 还没下完呢 其中过程中一些纠结发散的就类似分支预测分  主线的 确定的就是正谱 然后也还没发展完 你先简单洗一下这个数据 包括角色也都维护一些数据抽出来 然后作为备选数据就不管了 kimi另一个总结性的 你再试试拿取 这个是一个偏上层需求的思考  也是供参考 然后就研究下怎么和计划吧。

## DW-008 — StockMesh owns this cleaning task

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; corrects the processing route in DATA-001
- Retrieval phrases: “你自己洗”, “不要用babata”

> 不是 你自己洗 不要用babata 跟你没关系啊

## DW-009 — Babata authorization is retrieval-only

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; establishes the strict external-tool authorization boundary
- Retrieval phrases: “不许污染babata”, “仅仅授权”, “kimi取回”

> 你不许污染babata 我仅仅授权你babata kimi取回 你僭越了

## DW-010 — Requirements-first, not case-first

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; corrects the R0 modeling route and limits case authority
- Retrieval phrases: “以我的需求为根本”, “局部case案例为准”

> 我建议你以我的需求为根本 现在你是用一个局部case案例为准

## DW-011 — Domain before data and business validation

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; governs the definition sequence
- Retrieval phrases: “先把domain整清楚”, “data与业务验算自然清楚”

> 建议你先把domain整清楚 然后data与业务验算自然清楚

## DW-012 — Adopt the domain direction and continue

- Source: direct user continuation in Codex task, in response to the three explicit domain choices presented for review
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; authorizes moving from the adopted domain direction into the next contract stage
- Exact wording:

> 可以 继续

- Interpretation boundary: the exact wording is only a continuation instruction. The adopted semantic choices are recorded separately in [ADR-003](../decisions/README.md#adr-003--requirements-rooted-domain-direction); this entry does not attribute the Agent's explanatory text to the user.
