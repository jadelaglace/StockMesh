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

## DW-013 — A sentence is a strategy step between complete positions

- Source: direct user refinement in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; changes the transition granularity and the relation between dialogue, strategy, and Position
- Retrieval phrases: “每一句话是一个策略”, “每一步前后的上下文domain都是都有个完整的”, “类似git 或者说状态机”

> 说白了 就是每个形势 你找个domain 还是domain 然后找到一种办法 把domain 之间区别 用策略 串成线 这就是所谓的下了一步。最后你domain 规则都弄好了 那么分支 主干 预测分 时间线自然而然就串起来了 最后套个ui  或者skill。其实还是原来那一长串对话 只不过 之前是一句一句 你一句我一句一句话里就包含一个行动。现在 每一句话是一个策略 是一步棋 。然后 每一步前后的上下文domain都是都有个完整的，是一个局势 。其实呢 就是原来的你一句，我一句 变成出招了 变成策略了，然后与隐含在上下文里的局势关系 每一句话之间清晰的建模了。说白了 就算还是原来你一句我一句的ui形势也完全可以，但是后台已经把上下文 字段 建模啥的完整包住维护了 一个类似git 或者说状态机还是什么的也好的 维护起来的时间线了。

## DW-014 — Score and search reachable multi-party positions

- Source: direct user clarification in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; clarifies the scoring/search loop and multi-party objectives
- Retrieval phrases: “所有棋盘局势都是可以评分的”, “每个人 或者势力 都是一方”, “剪枝”, “计算下一步两步优劣势”

> 这有啥难理解的啊 stockfish的理念就是 所有棋盘局势都是可以评分的 有个评分ai 上来就给每一个可达的盘面评分 然后剪枝啊 或者啥的形成策略预测 就是下一步咋下 分支变化。现在 就是 盘面 就是人网络现状 多少分 啥关系 谁优势 然后不是红方黑方 是每个人 或者势力 都是一方 有个股份 下棋目标就是赢 ，那么人际关系目标就是更多人支持 舆论啊 财富更多啊这些是目标。下棋下哪个子，就是下一步现实的人 ，谁回谁了 干啥了 咋回谁的，导致了谁和谁关系好了坏了钱多了钱少了。然后下棋是有一个专门剪枝啊 遍历策略的叫啥来的 蒙特卡洛的ai 选 最牛逼的盘面，那么咱们这个项目就也是 计算下一步两步优劣势 。之前就是纯对话 一步最多计算俩分支 两轮对话吗，现在有了domain context维护 切换滑动管理，分支深度都可以更牛逼 回溯修改复盘更清晰吗 ，就是这么回事。

## DW-015 — Data foundation with an open, multidisciplinary reasoning layer

- Source: direct user clarification in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; keeps the upper reasoning and search approach open
- Retrieval phrases: “数据是底子”, “历史回溯”, “社会行为学”, “传播学”, “不一定是纯蒙特卡洛”

> 嗯 不用钉死下棋ai的做法 哪个是纯规则策略的 。咱们这个人际的 数据是底子 但是上层靠一些历史回溯啊 太阳下无新鲜事啊 心理上的真理啊 隐藏的社会行为学啊 社会网络学unet啊 传播学啊 这些支撑。 不一定是纯蒙特卡洛

- Interpretation boundary: `unet` is retained in the original wording; [DW-019](#dw-019--unet-corrects-to-ucient) later corrects it to `ucient`.

## DW-016 — Macro network methods and micro interpersonal methods

- Source: direct user clarification in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; distinguishes method scales without fixing their implementation
- Retrieval phrases: “大的”, “社会网络学”, “历史借鉴”, “小的”, “荣格分析”, “人情世故”, “谈话内容优化原话”, “厚黑”

> 大的就是上面说的那些社会网络学 历史借鉴的 ，小的就是荣格分析啊 人情世故啊 基本的谈话内容优化原话啊 厚黑啊这些 这些就是人格之间的小的 。

- Interpretation boundary: the named schools and informal bodies of knowledge are candidate analytical lenses at different scales, not automatically adopted truths or validated predictors.

## DW-017 — Candidate simulation and collective-agent references

- Source: direct user clarification in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; identifies optional references without adopting an implementation
- Retrieval phrases: “不限于unet”, “mirofish”, “oasis”, “备选参考思路”

> 不限于unet 比如gh上优秀的 mirofish啊  https://github.com/camel-ai/oasis oasis啊 都可以备选参考思路

- Interpretation boundary: named projects are candidate external references only. Their architecture, dependencies, claims, and licenses have not been evaluated or adopted.

## DW-018 — Candidate social-network-analysis tool references

- Source: direct user clarification in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; identifies an open SNA reference set
- Retrieval phrases: “ucient”, “gephi”, “r”, “pajek”, “nodeXL”, “social networl analysis”

> ucient啊 gephi，r,pajek ,nodeXL这些都可参考 social networl analysis的东西

- Interpretation boundary: names are preserved as written. `ucient` is unresolved; no product identity is inferred. The listed tools/ecosystems are references, not selected dependencies.

## DW-019 — `unet` corrects to `ucient`

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; supersedes only the unresolved `unet` term in DW-015
- Retrieval phrases: “unet估计我打错了”, “其实就是 ucient”

> unet估计我打错了 其实就是 ucient

- Interpretation boundary: `ucient` remains an unresolved project/tool identity until external evidence identifies it; this correction does not authorize guessing.

## DW-020 — Research prior art and license-clean reuse before building

- Source: direct user instruction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; expands the documentation round with a prior-art and reuse survey
- Retrieval phrases: “前人栽树”, “一次性在本轮调研清楚”, “不盲目造轮子”, “license干净的就直接用”, “形成调研表”

> 嗯 stockfish啊 包括我说的构想有无前人栽树啊 类似的有启发的啊 你都一次性在本轮调研清楚 不盲目造轮子。 license干净的就直接用 ，麻烦的就找替代或者进参考 形成调研表

- Interpretation boundary: “直接用” authorizes a reuse recommendation in this research round, not dependency installation or implementation. Actual adoption still requires capability, maintenance, security, architecture, and license-fit evidence.

## DW-021 — One runnable architecture with replaceable parts

- Source: direct user instruction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; starts a bounded architecture-definition round
- Retrieval phrases: “可行路径”, “能跑通的架构方案”, “零件后面可以一点点升级”, “一点点换”

> OK 现在分析一个可行路径出来 不用太复杂 先给我一个能跑通的架构方案 设计的好点 零件后面可以一点点升级 一点点换

- Interpretation boundary: this authorizes a candidate runnable architecture and staged replacement plan, not implementation or dependency installation in this round.

## DW-022 — Architecture must remain rooted in the requirement

- Source: direct user correction in Codex task
- Captured: 2026-08-16, Asia/Shanghai
- Status: active; governs every architecture and component choice
- Retrieval phrases: “别搞着搞着”, “忘记了什么才是需求”

> 还有 嘱咐你一句 别搞着搞着 忘记了什么才是需求哈

- Interpretation boundary: architecture elegance, prior art, and implementation convenience remain subordinate to the current StockMesh product outcome and observable user workflow.
